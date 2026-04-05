/**
 * @module UI
 * @description Stateful UI effects: profile photo / ASCII art flip loop,
 * typewriter animation, activity message cycling, and experience card
 * expand/collapse. All animation handles are tracked via state.js so they
 * can be cleanly cancelled on visibility change.
 */
import { state, trackTimeout, trackAnimationFrame } from './state.js';
import { fallbackAsciiFrames } from './config.js';
import { dom } from './dom.js';
import { profileData } from '../../profile-data.js';
import { clampNumber } from './utils.js';

interface BrailleOptions {
  columns: number;
  rows: number;
  contrast: number;
  gamma: number;
  threshold: number;
}

interface LuminanceSample {
  luminance: number;
  alpha: number;
}

function getLuminance(pixelData: Uint8ClampedArray, width: number, x: number, y: number): LuminanceSample {
  const pixelIndex = (y * width + x) * 4;
  const red   = pixelData[pixelIndex];
  const green = pixelData[pixelIndex + 1];
  const blue  = pixelData[pixelIndex + 2];
  const alpha = (pixelData[pixelIndex + 3] ?? 255) / 255;
  return {
    luminance: (0.2126 * (red ?? 0) + 0.7152 * (green ?? 0) + 0.0722 * (blue ?? 0)) / 255,
    alpha,
  };
}

function buildBrailleFrameFromImage(imageElement: HTMLImageElement, options: BrailleOptions): string {
  const { columns, rows, contrast, gamma, threshold } = options;
  const sourceWidth  = columns * 2;
  const sourceHeight = rows * 4;

  const bayerMatrix: number[][] = [
    [ 0,  8,  2, 10],
    [12,  4, 14,  6],
    [ 3, 11,  1,  9],
    [15,  7, 13,  5],
  ];

  const brailleDotBits: number[][] = [
    [0x01, 0x08],
    [0x02, 0x10],
    [0x04, 0x20],
    [0x40, 0x80],
  ];

  const canvas = document.createElement('canvas');
  canvas.width  = sourceWidth;
  canvas.height = sourceHeight;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return '';

  context.drawImage(imageElement, 0, 0, sourceWidth, sourceHeight);
  const pixelData = context.getImageData(0, 0, sourceWidth, sourceHeight).data;
  const lines: string[] = [];

  for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
    const rowChars: string[] = [];

    for (let columnIndex = 0; columnIndex < columns; columnIndex += 1) {
      let brailleBits = 0;

      for (let localY = 0; localY < 4; localY += 1) {
        for (let localX = 0; localX < 2; localX += 1) {
          const sourceX = columnIndex * 2 + localX;
          const sourceY = rowIndex    * 4 + localY;
          const sample  = getLuminance(pixelData, sourceWidth, sourceX, sourceY);

          if (sample.alpha < 0.08) continue;

          const gammaAdjusted = Math.pow(sample.luminance, 1 / gamma);
          const contrasted    = clampNumber((gammaAdjusted - 0.5) * contrast + 0.5, 0, 1);
          const darkValue     = 1 - contrasted;
          const dither        = ((bayerMatrix[sourceY % 4]?.[sourceX % 4] ?? 0) - 7.5) / 16;
          const ditheredDark  = clampNumber(darkValue + dither * 0.2, 0, 1);

          if (ditheredDark > threshold) {
            brailleBits |= (brailleDotBits[localY]?.[localX] ?? 0);
          }
        }
      }

      rowChars.push(brailleBits ? String.fromCharCode(0x2800 + brailleBits) : ' ');
    }

    lines.push(rowChars.join(''));
  }

  return lines.join('\n');
}

export function generateAsciiFramesFromProfilePhoto(imageElement: HTMLImageElement): string[] {
  try {
    const frameA = buildBrailleFrameFromImage(imageElement, { columns: 24, rows: 24, contrast: 1.2,  gamma: 0.96, threshold: 0.42 });
    const frameB = buildBrailleFrameFromImage(imageElement, { columns: 24, rows: 24, contrast: 1.26, gamma: 0.94, threshold: 0.46 });
    const frames = [frameA, frameB].filter(Boolean);
    return frames.length ? frames : fallbackAsciiFrames;
  } catch {
    return fallbackAsciiFrames;
  }
}

export function getActiveAsciiFrames(): string[] {
  return state.profileAsciiFrames.length ? state.profileAsciiFrames : fallbackAsciiFrames;
}

export function renderProfileImage(): void {
  dom.profileInitials.textContent = profileData.profileInitials;

  if (!profileData.profilePictureUrl) {
    dom.profilePhoto.style.display    = 'none';
    dom.profileInitials.style.display = 'grid';
    state.profileAsciiFrames          = fallbackAsciiFrames;
    dom.profileAsciiArt.textContent   = state.profileAsciiFrames[0] ?? '';
    return;
  }

  dom.profilePhoto.onload = function handleImageLoad() {
    dom.profilePhoto.style.display    = 'block';
    dom.profileInitials.style.display = 'none';
    state.profileAsciiFrames          = generateAsciiFramesFromProfilePhoto(dom.profilePhoto);
    dom.profileAsciiArt.textContent   = state.profileAsciiFrames[0] ?? '';
  };
  dom.profilePhoto.onerror = function handleImageError() {
    dom.profilePhoto.style.display    = 'none';
    dom.profileInitials.style.display = 'grid';
    state.profileAsciiFrames          = fallbackAsciiFrames;
    dom.profileAsciiArt.textContent   = state.profileAsciiFrames[0] ?? '';
  };
  dom.profilePhoto.src = profileData.profilePictureUrl;
}

export function setupProfileFlipOnHover(): void {
  function handleFlip(): void {
    if (dom.profilePhotoFrame.classList.contains('coin-spin')) return;

    const activeFrames = getActiveAsciiFrames();
    const frameIndex = Math.floor(Math.random() * activeFrames.length);
    dom.profileAsciiArt.textContent = activeFrames[frameIndex] ?? '';
    dom.profilePhotoFrame.classList.add('coin-spin', 'photo-flipped');

    trackTimeout(function showPhotoSide() {
      dom.profilePhotoFrame.classList.remove('photo-flipped', 'coin-spin');
    }, 980);
  }

  dom.profilePhotoFrame.addEventListener('mouseenter', handleFlip);
  dom.profilePhotoFrame.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleFlip();
  }, { passive: false });
}

/**
 * Animates text typing within a specific duration.
 * @param element The target element.
 * @param text The text to type.
 * @param durationMs Total animation duration.
 */
export function typeTextInDuration(
  element: HTMLElement,
  text: string,
  durationMs: number,
  onComplete?: () => void,
): void {
  const safeText = text ?? '';
  element.textContent = '';

  if (!safeText) {
    onComplete?.();
    return;
  }

  if (!state.isPageVisible) {
    element.textContent = safeText;
    onComplete?.();
    return;
  }

  const duration       = Math.max(220, durationMs);
  const totalChars     = safeText.length;
  const startTimestamp = window.performance.now();

  function writeFrame(currentTimestamp: number): void {
    const elapsed    = currentTimestamp - startTimestamp;
    const progress   = Math.min(1, elapsed / duration);
    const charCount  = Math.max(1, Math.floor(progress * totalChars));
    element.textContent = safeText.slice(0, charCount);

    if (progress < 1) {
      trackAnimationFrame(writeFrame);
    } else {
      onComplete?.();
    }
  }

  trackAnimationFrame(writeFrame);
}

/**
 * Starts the AI Activity Feed typing loop.
 * Cycles through provided messages with a typewriter effect.
 * @param messages Array of strings to cycle through.
 */
export function startActivityLoop(messages: string[]): void {
  if (!dom.activityTypingText) return;
  if (!messages.length) {
    dom.activityTypingText.textContent = '';
    return;
  }
  if (!state.isPageVisible) {
    dom.activityTypingText.textContent = messages[0] ?? '';
    return;
  }

  // Stabilization: Calculate maximum dimensions ONCE to prevent layout shifts
  const container = dom.activityTypingText.parentElement;
  if (container && !container.dataset.stabilized) {
    // Save original state
    const originalText = dom.activityTypingText.textContent;
    const originalVisibility = container.style.visibility;
    const originalDisplay = container.style.display;
    
    // Measure without visual impact
    container.style.visibility = 'hidden';
    container.style.display = 'block'; // Ensure it's measurable
    
    // Lock height to the current computed height before measurement if possible
    // to prevent immediate resizing during the loop below
    const currentH = container.offsetHeight;
    if (currentH > 0) container.style.minHeight = `${currentH}px`;
    
    // Force layout flush before measurement
    void container.offsetHeight;
    
    let maxW = 0;
    let maxH = 0;
    
    messages.forEach(msg => {
      dom.activityTypingText.textContent = msg;
      // Force layout flush for each message to be sure
      void dom.activityTypingText.offsetHeight;
      maxW = Math.max(maxW, dom.activityTypingText.offsetWidth);
      maxH = Math.max(maxH, dom.activityTypingText.offsetHeight);
    });
    
    // Revert state
    dom.activityTypingText.textContent = originalText;
    container.style.visibility = originalVisibility;
    container.style.display = originalDisplay;
    
    // Lock the container size (min-height AND min-width ensure stability)
    // Add 1px buffer to prevent rounding issues in some browsers
    const finalW = Math.ceil(maxW) + 1;
    const finalH = Math.ceil(maxH) + 1;
    
    container.style.minHeight = `${finalH}px`;
    container.style.minWidth = `${finalW}px`;
    container.dataset.stabilized = 'true';
  }

  let messageIndex = 0;

  function playNext(): void {
    const current = messages[messageIndex % messages.length] ?? '';
    typeTextInDuration(dom.activityTypingText, current, 1500, function onTypeComplete() {
      trackTimeout(function clearAndContinue() {
        dom.activityTypingText.textContent = '';
        messageIndex += 1;
        playNext();
      }, 800);
    });
  }

  playNext();
}

export function setExperienceCardExpanded(cardElement: Element, shouldExpand: boolean): void {
  const contentElement = cardElement.querySelector<HTMLElement>('.experience-content');
  const toggleButton   = cardElement.querySelector<HTMLElement>('.experience-toggle');
  const toggleLabel    = cardElement.querySelector<HTMLElement>('.experience-toggle-label');

  if (!contentElement || !toggleButton || !toggleLabel) return;

  const expandLabel   = toggleButton.getAttribute('data-expand-label')   ?? '';
  const collapseLabel = toggleButton.getAttribute('data-collapse-label') ?? '';

  const isExpanding = shouldExpand;
  cardElement.classList.toggle('open', isExpanding);
  toggleButton.setAttribute('aria-expanded', String(isExpanding));
  toggleLabel.textContent = isExpanding ? collapseLabel : expandLabel;
  
  // Explicitly set max-height for CSS transition
  if (isExpanding) {
    // Use scrollHeight for actual content size, but ensures it's measurable
    const fullHeight = contentElement.scrollHeight;
    contentElement.style.maxHeight = fullHeight > 0 ? `${fullHeight}px` : '2000px';
  } else {
    contentElement.style.maxHeight = '0';
  }

  // If view transitions are supported and we're not in a test, use them
  if (document.startViewTransition && 
      !document.querySelector('.view-transitioning') &&
      !navigator.userAgent.toLowerCase().includes('playwright') &&
      !navigator.webdriver) {
    document.documentElement.classList.add('view-transitioning');
    document.startViewTransition(() => {}).finished.finally(() => {
      document.documentElement.classList.remove('view-transitioning');
    });
  }
}

/**
 * Binds click events to all experience cards for expand/collapse functionality.
 */
export function bindExperienceToggleEvents(): void {
  const cards = Array.from(dom.experienceList.querySelectorAll('.experience-card'));

  cards.forEach(function bindCard(cardElement, cardIndex) {
    const toggleButton = cardElement.querySelector('.experience-toggle');
    if (!toggleButton) return;

    setExperienceCardExpanded(cardElement, cardIndex === 0);

    toggleButton.addEventListener('click', function onToggleClick() {
      const isOpen = cardElement.classList.contains('open');
      setExperienceCardExpanded(cardElement, !isOpen);
    });
  });
}

export function setAllExperienceCardsExpanded(shouldExpand: boolean): void {
  Array.from(dom.experienceList.querySelectorAll('.experience-card'))
    .forEach(function expandOrCollapse(cardElement) {
      setExperienceCardExpanded(cardElement, shouldExpand);
    });
}

export function areAllExperienceCardsExpanded(): boolean {
  const cards = Array.from(dom.experienceList.querySelectorAll('.experience-card'));
  if (!cards.length) return false;
  return cards.every(function isExpanded(cardElement) {
    return cardElement.classList.contains('open');
  });
}
