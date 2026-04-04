/**
 * @module UI
 * @description Handles DOM manipulation, profile animations, and user interactions.
 */

import { state, trackTimeout, trackAnimationFrame } from './state.js';
import { fallbackAsciiFrames } from './config.js';
import { dom } from './dom.js';
import { profileData } from '../../profile-data.js';
import { clampNumber } from './utils.js';

function getLuminance(pixelData, width, x, y) {
  const pixelIndex = (y * width + x) * 4;
  const red = pixelData[pixelIndex];
  const green = pixelData[pixelIndex + 1];
  const blue = pixelData[pixelIndex + 2];
  const alpha = pixelData[pixelIndex + 3] / 255;

  return {
    luminance: (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255,
    alpha: alpha
  };
}

function buildBrailleFrameFromImage(imageElement, options) {
  const columns = options.columns;
  const rows = options.rows;
  const contrast = options.contrast;
  const gamma = options.gamma;
  const threshold = options.threshold;
  const sourceWidth = columns * 2;
  const sourceHeight = rows * 4;

  const bayerMatrix = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5]
  ];

  const brailleDotBits = [
    [0x01, 0x08],
    [0x02, 0x10],
    [0x04, 0x20],
    [0x40, 0x80]
  ];

  const canvas = document.createElement("canvas");
  canvas.width = sourceWidth;
  canvas.height = sourceHeight;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return "";
  }

  context.drawImage(imageElement, 0, 0, sourceWidth, sourceHeight);
  const pixelData = context.getImageData(0, 0, sourceWidth, sourceHeight).data;
  const lines = [];

  for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
    const rowChars = [];
    for (let columnIndex = 0; columnIndex < columns; columnIndex += 1) {
      let brailleBits = 0;

      for (let localY = 0; localY < 4; localY += 1) {
        for (let localX = 0; localX < 2; localX += 1) {
          const sourceX = columnIndex * 2 + localX;
          const sourceY = rowIndex * 4 + localY;
          const sample = getLuminance(pixelData, sourceWidth, sourceX, sourceY);

          if (sample.alpha < 0.08) {
            continue;
          }

          const gammaAdjusted = Math.pow(sample.luminance, 1 / gamma);
          const contrasted = clampNumber((gammaAdjusted - 0.5) * contrast + 0.5, 0, 1);
          const darkValue = 1 - contrasted;
          const dither = (bayerMatrix[sourceY % 4][sourceX % 4] - 7.5) / 16;
          const ditheredDark = clampNumber(darkValue + dither * 0.2, 0, 1);

          if (ditheredDark > threshold) {
            brailleBits |= brailleDotBits[localY][localX];
          }
        }
      }

      rowChars.push(brailleBits ? String.fromCharCode(0x2800 + brailleBits) : " ");
    }
    lines.push(rowChars.join(""));
  }

  return lines.join("\n");
}

export function generateAsciiFramesFromProfilePhoto(imageElement) {
  try {
    const frameA = buildBrailleFrameFromImage(imageElement, {
      columns: 24,
      rows: 24,
      contrast: 1.2,
      gamma: 0.96,
      threshold: 0.42
    });
    const frameB = buildBrailleFrameFromImage(imageElement, {
      columns: 24,
      rows: 24,
      contrast: 1.26,
      gamma: 0.94,
      threshold: 0.46
    });
    const frames = [frameA, frameB].filter(function keepNonEmpty(frame) {
      return Boolean(frame);
    });
    return frames.length ? frames : fallbackAsciiFrames;
  } catch (error) {
    return fallbackAsciiFrames;
  }
}

export function getActiveAsciiFrames() {
  return state.profileAsciiFrames.length ? state.profileAsciiFrames : fallbackAsciiFrames;
}

export function renderProfileImage() {
  dom.profileInitials.textContent = profileData.profileInitials;

  if (!profileData.profilePictureUrl) {
    dom.profilePhoto.style.display = "none";
    dom.profileInitials.style.display = "grid";
    state.profileAsciiFrames = fallbackAsciiFrames;
    dom.profileAsciiArt.textContent = state.profileAsciiFrames[0];
    return;
  }

  dom.profilePhoto.onload = function handleImageLoad() {
    dom.profilePhoto.style.display = "block";
    dom.profileInitials.style.display = "none";
    state.profileAsciiFrames = generateAsciiFramesFromProfilePhoto(dom.profilePhoto);
    dom.profileAsciiArt.textContent = state.profileAsciiFrames[0];
  };
  dom.profilePhoto.onerror = function handleImageError() {
    dom.profilePhoto.style.display = "none";
    dom.profileInitials.style.display = "grid";
    state.profileAsciiFrames = fallbackAsciiFrames;
    dom.profileAsciiArt.textContent = state.profileAsciiFrames[0];
  };
  dom.profilePhoto.src = profileData.profilePictureUrl;
}

export function startProfileFlipLoop() {
  if (!state.isPageVisible) {
    return;
  }

  let frameIndex = 0;

  function scheduleFlip() {
    const flipDelay = 3000 + Math.floor(Math.random() * 2000);
    trackTimeout(function showAsciiSide() {
      const activeFrames = getActiveAsciiFrames();
      frameIndex = (frameIndex + 1) % activeFrames.length;
      dom.profileAsciiArt.textContent = activeFrames[frameIndex];
      dom.profilePhotoFrame.classList.add("coin-spin");
      dom.profilePhotoFrame.classList.add("photo-flipped");

      trackTimeout(function showPhotoSide() {
        dom.profilePhotoFrame.classList.remove("photo-flipped");
        dom.profilePhotoFrame.classList.remove("coin-spin");
        scheduleFlip();
      }, 980);
    }, flipDelay);
  }

  dom.profileAsciiArt.textContent = getActiveAsciiFrames()[0];
  dom.profilePhotoFrame.classList.remove("photo-flipped");
  scheduleFlip();
}

export function typeTextInDuration(element, text, durationMs, onComplete) {
  const safeText = text || "";
  element.textContent = "";

  if (!safeText) {
    if (typeof onComplete === "function") {
      onComplete();
    }
    return;
  }

  if (!state.isPageVisible) {
    element.textContent = safeText;
    if (typeof onComplete === "function") {
      onComplete();
    }
    return;
  }

  const duration = Math.max(220, durationMs);
  const totalCharacters = safeText.length;
  const startTimestamp = window.performance.now();

  function writeFrame(currentTimestamp) {
    const elapsed = currentTimestamp - startTimestamp;
    const progress = Math.min(1, elapsed / duration);
    const characterCount = Math.max(1, Math.floor(progress * totalCharacters));
    element.textContent = safeText.slice(0, characterCount);

    if (progress < 1) {
      trackAnimationFrame(writeFrame);
    } else if (typeof onComplete === "function") {
      onComplete();
    }
  }

  trackAnimationFrame(writeFrame);
}

export function startActivityLoop(localizedMessages) {
  if (!localizedMessages.length) {
    dom.activityTypingText.textContent = "";
    return;
  }

  if (!state.isPageVisible) {
    dom.activityTypingText.textContent = localizedMessages[0];
    return;
  }

  let messageIndex = 0;

  function playNext() {
    const current = localizedMessages[messageIndex % localizedMessages.length];
    typeTextInDuration(dom.activityTypingText, current, 1500, function onTypeComplete() {
      trackTimeout(function clearAndContinue() {
        dom.activityTypingText.textContent = "";
        messageIndex += 1;
        playNext();
      }, 650);
    });
  }

  playNext();
}

export function setExperienceCardExpanded(cardElement, shouldExpand) {
  const contentElement = cardElement.querySelector(".experience-content");
  const toggleButton = cardElement.querySelector(".experience-toggle");
  const toggleLabel = cardElement.querySelector(".experience-toggle-label");

  if (!contentElement || !toggleButton || !toggleLabel) {
    return;
  }

  const expandLabel = toggleButton.getAttribute("data-expand-label");
  const collapseLabel = toggleButton.getAttribute("data-collapse-label");

  cardElement.classList.toggle("open", shouldExpand);
  toggleButton.setAttribute("aria-expanded", String(shouldExpand));
  toggleLabel.textContent = shouldExpand ? collapseLabel : expandLabel;
  contentElement.style.maxHeight = shouldExpand ? contentElement.scrollHeight + "px" : "0";
}

export function bindExperienceToggleEvents() {
  const cards = Array.from(dom.experienceList.querySelectorAll(".experience-card"));

  cards.forEach(function bindCard(cardElement, cardIndex) {
    const toggleButton = cardElement.querySelector(".experience-toggle");
    if (!toggleButton) {
      return;
    }

    setExperienceCardExpanded(cardElement, cardIndex === 0);

    toggleButton.addEventListener("click", function onToggleClick() {
      const isOpen = cardElement.classList.contains("open");
      setExperienceCardExpanded(cardElement, !isOpen);
    });
  });
}

export function setAllExperienceCardsExpanded(shouldExpand) {
  const cards = Array.from(dom.experienceList.querySelectorAll(".experience-card"));
  cards.forEach(function expandOrCollapse(cardElement) {
    setExperienceCardExpanded(cardElement, shouldExpand);
  });
}

export function areAllExperienceCardsExpanded() {
  const cards = Array.from(dom.experienceList.querySelectorAll(".experience-card"));
  if (!cards.length) {
    return false;
  }
  return cards.every(function isExpanded(cardElement) {
    return cardElement.classList.contains("open");
  });
}
