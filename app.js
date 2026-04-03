(function initializeTerminalResume() {
  "use strict";

  const profileData = window.profileData;

  if (!profileData) {
    throw new Error("profileData is missing. Ensure profile-data.js loads before app.js.");
  }

  const uiText = {
    heroPaneTitle: "session:identity",
    profilePaneTitle: "session:profile",
    activityPaneTitle: "session:ai-feed",
    experiencePaneTitle: "session:experience",
    skillsPaneTitle: "session:skills",
    educationPaneTitle: "session:education",
    certificationsPaneTitle: "session:certifications",
    printResumeButton: "Download Resume (PDF)",
    translatingButton: "Translating...",
    experienceHint: "",
    profileLabel: "PROFILE",
    locationLabel: "Location",
    jobTypeLabel: "Job type",
    driversLicenseLabel: "Driver's lic.",
    ageLabel: "Age",
    availabilityLabel: "Availability",
    availabilityImmediate: "Immediately",
    availabilityNotice: "20 working days notice",
    expandLabel: "Expand",
    collapseLabel: "Collapse",
    copyrightWord: "Copyright",
    ageSuffix: "years old"
  };

  const i18nDictionary = window.resumeI18n || {};

  const languageConfig = {
    sourceLanguage: "en",
    defaultLanguage: "en"
  };

  const translationConfig = {
    cacheKey: "terminal_resume_translation_cache_v3",
    endpoint:
      "https://api.mymemory.translated.net/get?q={text}&langpair={source}|{target}",
    requestChunkSize: 6,
    timeoutMs: 6000
  };

  const printConfig = {
    pageContentHeightPx: 970,
    strategySteps: [
      { maxBulletsPerExperience: 2, summaryMaxChars: 520, skillsMaxChars: 380 },
      { maxBulletsPerExperience: 2, summaryMaxChars: 420, skillsMaxChars: 330 },
      { maxBulletsPerExperience: 1, summaryMaxChars: 360, skillsMaxChars: 280 },
      { maxBulletsPerExperience: 1, summaryMaxChars: 300, skillsMaxChars: 230 }
    ]
  };

  const state = {
    language: languageConfig.defaultLanguage,
    renderToken: 0,
    activeTimeouts: new Set(),
    activeAnimationFrames: new Set(),
    profileAsciiFrames: [],
    localizedActivityMessages: [],
    isPageVisible: !document.hidden,
    printAtsReport: null,
    resizePrintTimeoutId: null,
    translationCache: new Map(),
    cachePersistTimeoutId: null,
    translationWarmupStarted: false
  };

  const fallbackAsciiFrames = [
    [
      "  .-''''-.",
      " /  .--.  \\",
      "|  (o  o)  |",
      "|   .--.   |",
      "|  (____)  |",
      " \\  ----  /",
      "  '-.__.-'"
    ].join("\n"),
    [
      "  .-====-.",
      " /  __  _ \\",
      "|  /  \\/ \\ |",
      "| |  <>  | |",
      "|  \\_  _/  |",
      " \\   ||   /",
      "  '._||_.'"
    ].join("\n")
  ];

  const dom = {
    terminalCommandText: document.getElementById("terminalCommandText"),
    terminalCommandCursor: document.getElementById("terminalCommandCursor"),
    windowButtonClose: document.getElementById("windowButtonClose"),
    windowButtonMinimize: document.getElementById("windowButtonMinimize"),
    windowButtonMaximize: document.getElementById("windowButtonMaximize"),
    launcher: document.getElementById("appLauncher"),
    launcherCard: document.getElementById("launcherCard"),
    launcherIcon: document.getElementById("launcherIcon"),
    launcherTerminalLine: document.getElementById("launcherTerminalLine"),
    launcherSpeech: document.getElementById("launcherSpeech"),
    heroPaneTitle: document.getElementById("heroPaneTitle"),
    profilePaneTitle: document.getElementById("profilePaneTitle"),
    activityPaneTitle: document.getElementById("activityPaneTitle"),
    experiencePaneTitle: document.getElementById("experiencePaneTitle"),
    skillsPaneTitle: document.getElementById("skillsPaneTitle"),
    educationPaneTitle: document.getElementById("educationPaneTitle"),
    certificationsPaneTitle: document.getElementById("certificationsPaneTitle"),
    languageToggleButton: document.getElementById("languageToggleButton"),
    languageToggleIcon: document.getElementById("languageToggleIcon"),
    languageToggleLabel: document.getElementById("languageToggleLabel"),
    printResumeButton: document.getElementById("printResumeButton"),
    printResumeLabel: document.getElementById("printResumeLabel"),
    statusLine: document.getElementById("statusLine"),
    candidateName: document.getElementById("candidateName"),
    heroRole: document.getElementById("heroRole"),
    heroSummary: document.getElementById("heroSummary"),
    profilePhotoFrame: document.getElementById("profilePhotoFrame"),
    profilePhoto: document.getElementById("profilePhoto"),
    profileInitials: document.getElementById("profileInitials"),
    profileAsciiArt: document.getElementById("profileAsciiArt"),
    emailLink: document.getElementById("emailLink"),
    emailValue: document.getElementById("emailValue"),
    phoneLink: document.getElementById("phoneLink"),
    phoneValue: document.getElementById("phoneValue"),
    linkedinLink: document.getElementById("linkedinLink"),
    linkedinValue: document.getElementById("linkedinValue"),
    githubLink: document.getElementById("githubLink"),
    githubValue: document.getElementById("githubValue"),
    profileLocationLabel: document.getElementById("profileLocationLabel"),
    profileLocationValue: document.getElementById("profileLocationValue"),
    profileJobTypeLabel: document.getElementById("profileJobTypeLabel"),
    profileJobTypeValue: document.getElementById("profileJobTypeValue"),
    profileDriversLicenseLabel: document.getElementById("profileDriversLicenseLabel"),
    profileDriversLicenseValue: document.getElementById("profileDriversLicenseValue"),
    profileAgeLabel: document.getElementById("profileAgeLabel"),
    profileAgeValue: document.getElementById("profileAgeValue"),
    profileAvailabilityLabel: document.getElementById("profileAvailabilityLabel"),
    profileAvailabilityValue: document.getElementById("profileAvailabilityValue"),
    experiencePaneHint: document.getElementById("experiencePaneHint"),
    experienceList: document.getElementById("experienceList"),
    skillsGroupList: document.getElementById("skillsGroupList"),
    educationList: document.getElementById("educationList"),
    certificationList: document.getElementById("certificationList"),
    activityTypingText: document.getElementById("activityTypingText"),
    footerCopyrightWord: document.getElementById("footerCopyrightWord"),
    footerName: document.getElementById("footerName"),
    currentYear: document.getElementById("currentYear"),
    footerBranchLabel: document.getElementById("footerBranchLabel"),
    printResumeRoot: document.getElementById("printResumeRoot"),
    printName: document.getElementById("printName"),
    printContactLine: document.getElementById("printContactLine"),
    printSummary: document.getElementById("printSummary"),
    printSkills: document.getElementById("printSkills"),
    printExperienceList: document.getElementById("printExperienceList"),
    printEducationList: document.getElementById("printEducationList"),
    printCertificationList: document.getElementById("printCertificationList")
  };

  function trackTimeout(callback, delayMs) {
    const timeoutId = window.setTimeout(function executeTrackedTimeout() {
      state.activeTimeouts.delete(timeoutId);
      callback();
    }, delayMs);
    state.activeTimeouts.add(timeoutId);
    return timeoutId;
  }

  function clearActiveTimeouts() {
    state.activeTimeouts.forEach(function clearTimeoutEntry(timeoutId) {
      window.clearTimeout(timeoutId);
    });
    state.activeTimeouts.clear();
  }

  function trackAnimationFrame(callback) {
    const frameId = window.requestAnimationFrame(function runTrackedFrame(timestamp) {
      state.activeAnimationFrames.delete(frameId);
      callback(timestamp);
    });
    state.activeAnimationFrames.add(frameId);
    return frameId;
  }

  function clearActiveAnimationFrames() {
    state.activeAnimationFrames.forEach(function clearFrame(frameId) {
      window.cancelAnimationFrame(frameId);
    });
    state.activeAnimationFrames.clear();
  }

  function clearActiveAsyncWork() {
    clearActiveTimeouts();
    clearActiveAnimationFrames();
  }

  function escapeHtml(rawValue) {
    return String(rawValue)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeLanguage(language) {
    return language === "ro" ? "ro" : languageConfig.sourceLanguage;
  }

  function getLanguageDictionary(language) {
    const resolvedLanguage = normalizeLanguage(language);
    const dictionary = i18nDictionary[resolvedLanguage];
    if (!dictionary || typeof dictionary !== "object") {
      return {};
    }
    return dictionary;
  }

  function localizeText(sourceText, language) {
    if (typeof sourceText !== "string") {
      return sourceText;
    }

    const resolvedLanguage = normalizeLanguage(language);
    if (resolvedLanguage === languageConfig.sourceLanguage) {
      return sourceText;
    }

    const dictionary = getLanguageDictionary(resolvedLanguage);
    return dictionary[sourceText] || sourceText;
  }

  function getTranslationCacheKey(language, sourceText) {
    return normalizeLanguage(language) + "::" + String(sourceText || "").trim();
  }

  function loadTranslationCache() {
    try {
      const rawValue = window.localStorage.getItem(translationConfig.cacheKey);
      if (!rawValue) {
        return;
      }

      const parsed = JSON.parse(rawValue);
      Object.keys(parsed).forEach(function loadEntry(cacheKey) {
        if (typeof parsed[cacheKey] === "string") {
          state.translationCache.set(cacheKey, parsed[cacheKey]);
        }
      });
    } catch (error) {
      // Ignore malformed cache payloads.
    }
  }

  function persistTranslationCache() {
    if (state.cachePersistTimeoutId) {
      window.clearTimeout(state.cachePersistTimeoutId);
    }

    state.cachePersistTimeoutId = window.setTimeout(function writeTranslationCache() {
      const serialized = {};
      state.translationCache.forEach(function serializeEntry(value, key) {
        serialized[key] = value;
      });

      try {
        window.localStorage.setItem(translationConfig.cacheKey, JSON.stringify(serialized));
      } catch (error) {
        // Ignore storage failures.
      }
    }, 220);
  }

  function getBestLocalizedText(sourceText, language) {
    if (typeof sourceText !== "string") {
      return sourceText;
    }

    const resolvedLanguage = normalizeLanguage(language);
    if (resolvedLanguage === languageConfig.sourceLanguage) {
      return sourceText;
    }

    const cacheKey = getTranslationCacheKey(resolvedLanguage, sourceText);
    if (state.translationCache.has(cacheKey)) {
      return state.translationCache.get(cacheKey);
    }

    return localizeText(sourceText, resolvedLanguage);
  }

  async function requestExternalTranslation(sourceText, targetLanguage) {
    const resolvedLanguage = normalizeLanguage(targetLanguage);
    if (!sourceText || resolvedLanguage === languageConfig.sourceLanguage) {
      return sourceText;
    }

    const trimmedText = String(sourceText).trim();
    if (!trimmedText) {
      return sourceText;
    }

    const cacheKey = getTranslationCacheKey(resolvedLanguage, trimmedText);
    if (state.translationCache.has(cacheKey)) {
      return state.translationCache.get(cacheKey);
    }

    const requestUrl = translationConfig.endpoint
      .replace("{text}", encodeURIComponent(trimmedText))
      .replace("{source}", encodeURIComponent(languageConfig.sourceLanguage))
      .replace("{target}", encodeURIComponent(resolvedLanguage));

    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timeoutId = controller
      ? window.setTimeout(function abortTranslationRequest() {
          controller.abort();
        }, translationConfig.timeoutMs)
      : null;

    try {
      const response = await fetch(requestUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller ? controller.signal : undefined
      });

      if (!response.ok) {
        throw new Error("External translation request failed.");
      }

      const payload = await response.json();
      const translatedText =
        payload &&
        payload.responseData &&
        typeof payload.responseData.translatedText === "string"
          ? payload.responseData.translatedText.trim()
          : "";

      if (!translatedText) {
        throw new Error("External translation response was empty.");
      }

      state.translationCache.set(cacheKey, translatedText);
      persistTranslationCache();
      return translatedText;
    } catch (error) {
      // Fallback to local dictionary when API translation is unavailable.
      return localizeText(sourceText, resolvedLanguage);
    } finally {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    }
  }

  async function translateBatchWithExternalApi(sourceTextList, targetLanguage) {
    const resolvedLanguage = normalizeLanguage(targetLanguage);
    if (resolvedLanguage === languageConfig.sourceLanguage) {
      return;
    }

    const uniqueSourceText = Array.from(
      new Set(
        sourceTextList.filter(function keepText(entry) {
          return typeof entry === "string" && entry.trim();
        })
      )
    );

    const uncachedText = uniqueSourceText.filter(function keepUncached(entry) {
      return !state.translationCache.has(getTranslationCacheKey(resolvedLanguage, entry));
    });

    for (
      let index = 0;
      index < uncachedText.length;
      index += translationConfig.requestChunkSize
    ) {
      const chunk = uncachedText.slice(index, index + translationConfig.requestChunkSize);
      await Promise.all(
        chunk.map(function translateEntry(entry) {
          return requestExternalTranslation(entry, resolvedLanguage);
        })
      );
    }
  }

  function collectTranslatableStrings() {
    const bucket = [];

    Object.keys(uiText).forEach(function addUiText(key) {
      bucket.push(uiText[key]);
    });

    bucket.push("Switch to Romanian");
    bucket.push("Switch to English");
    bucket.push(profileData.topBar.firstVisitMessage);
    bucket.push(profileData.topBar.commandMessage);
    bucket.push(profileData.topBar.launcherSpeechText);
    bucket.push(profileData.statusLine);
    bucket.push(profileData.role);
    bucket.push(profileData.summary);
    bucket.push(profileData.location);
    bucket.push(profileData.jobType);
    bucket.push(profileData.driversLicense);
    bucket.push.apply(bucket, profileData.activityMessages);

    profileData.skillGroups.forEach(function processGroup(groupEntry) {
      bucket.push(groupEntry.label);
      groupEntry.items.forEach(function processSkill(skill) {
        bucket.push(skill.label);
      });
    });

    profileData.experiences.forEach(function processExperience(experienceEntry) {
      bucket.push(experienceEntry.title);
      bucket.push(experienceEntry.period);
      bucket.push(experienceEntry.location);
      experienceEntry.bullets.forEach(function processBullet(bullet) {
        bucket.push(bullet);
      });
    });

    profileData.education.forEach(function processEducation(educationEntry) {
      bucket.push(educationEntry.title);
      bucket.push(educationEntry.details);
      bucket.push(educationEntry.extra);
    });

    profileData.certifications.forEach(function processCertification(certificationEntry) {
      bucket.push(certificationEntry.title);
      bucket.push(certificationEntry.issuer);
      bucket.push(certificationEntry.issued);
      bucket.push(certificationEntry.expires || "");
      bucket.push(certificationEntry.credentialId || "");
      (certificationEntry.skills || []).forEach(function processSkillTag(skillTag) {
        bucket.push(skillTag);
      });
    });

    return bucket;
  }

  function warmUpRomanianTranslations() {
    if (state.translationWarmupStarted) {
      return;
    }
    state.translationWarmupStarted = true;

    trackTimeout(function startWarmup() {
      translateBatchWithExternalApi(collectTranslatableStrings(), "ro").catch(function ignoreError() {
        // Ignore warm-up failures; runtime translation still retries on demand.
      });
    }, 480);
  }

  function isLikelyEmailAddress(rawEmail) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(rawEmail || "").trim());
  }

  function isLikelyPhoneNumber(rawPhone) {
    const normalized = String(rawPhone || "").trim();
    return /^\+?[0-9]{7,15}$/.test(normalized);
  }

  function toSafeMailtoUrl(rawEmail) {
    const trimmedEmail = String(rawEmail || "").trim();
    return isLikelyEmailAddress(trimmedEmail) ? "mailto:" + trimmedEmail : "";
  }

  function toSafeTelUrl(rawPhone) {
    const normalizedPhone = String(rawPhone || "").replace(/[^0-9+]/g, "");
    return isLikelyPhoneNumber(normalizedPhone) ? "tel:" + normalizedPhone : "";
  }

  function toSafeExternalUrl(rawUrl) {
    if (typeof rawUrl !== "string" || !rawUrl.trim()) {
      return "";
    }

    try {
      const parsedUrl = new URL(rawUrl, window.location.origin);
      return parsedUrl.protocol === "https:" ? parsedUrl.href : "";
    } catch (error) {
      return "";
    }
  }

  function setAnchorHref(anchorElement, safeUrl) {
    if (!anchorElement) {
      return;
    }

    if (!safeUrl) {
      anchorElement.href = "#";
      anchorElement.setAttribute("aria-disabled", "true");
      anchorElement.tabIndex = -1;
      return;
    }

    anchorElement.href = safeUrl;
    anchorElement.setAttribute("aria-disabled", "false");
    anchorElement.removeAttribute("tabindex");
  }

  function calculateAgeYears(birthDateIso) {
    const birthDate = new Date(birthDateIso);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age -= 1;
    }
    return age;
  }

  function extractPublicPath(url) {
    return String(url || "").replace(/^https?:\/\//i, "");
  }

  function formatYearMonth(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return year + "-" + month;
  }

  function getAvailabilityLabel() {
    return profileData.availabilityMode === "notice"
      ? uiText.availabilityNotice
      : uiText.availabilityImmediate;
  }

  function clampNumber(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

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

    // 4x4 Bayer matrix for ordered dithering.
    const bayerMatrix = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5]
    ];

    // Unicode Braille dot bit masks by local (x,y) in a 2x4 cell.
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

  function generateAsciiFramesFromProfilePhoto(imageElement) {
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

  function getActiveAsciiFrames() {
    return state.profileAsciiFrames.length ? state.profileAsciiFrames : fallbackAsciiFrames;
  }

  function renderProfileImage() {
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

  function startProfileFlipLoop() {
    // Flip between photo and an ASCII replica generated from the actual profile image.
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

  function typeTextInDuration(element, text, durationMs, onComplete) {
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

  function startActivityLoop(localizedMessages) {
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

  function setExperienceCardExpanded(cardElement, shouldExpand) {
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

  function bindExperienceToggleEvents() {
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

  function setAllExperienceCardsExpanded(shouldExpand) {
    const cards = Array.from(dom.experienceList.querySelectorAll(".experience-card"));
    cards.forEach(function expandOrCollapse(cardElement) {
      setExperienceCardExpanded(cardElement, shouldExpand);
    });
  }

  function areAllExperienceCardsExpanded() {
    const cards = Array.from(dom.experienceList.querySelectorAll(".experience-card"));
    if (!cards.length) {
      return false;
    }
    return cards.every(function isExpanded(cardElement) {
      return cardElement.classList.contains("open");
    });
  }

  function truncateAtWordBoundary(text, maxCharacters) {
    const safeText = String(text || "").trim();
    if (!maxCharacters || safeText.length <= maxCharacters) {
      return safeText;
    }
    const roughCut = safeText.slice(0, maxCharacters);
    const lastSpace = roughCut.lastIndexOf(" ");
    const truncated = (lastSpace > 40 ? roughCut.slice(0, lastSpace) : roughCut).trim();
    return truncated + "...";
  }

  function countWords(text) {
    const matches = String(text || "").match(/[A-Za-z0-9+#/.-]+/g);
    return matches ? matches.length : 0;
  }

  function buildPrintResumePayload(options) {
    const language = normalizeLanguage(options.language);
    const maxBullets = Math.max(1, options.maxBulletsPerExperience || 1);

    function t(text) {
      return getBestLocalizedText(text, language);
    }

    const linkedinPath = extractPublicPath(toSafeExternalUrl(profileData.contact.linkedinUrl));
    const githubPath = extractPublicPath(toSafeExternalUrl(profileData.contact.githubUrl));
    const printContactLine = [
      t(profileData.location),
      profileData.contact.email,
      profileData.contact.phone,
      linkedinPath,
      githubPath
    ]
      .filter(Boolean)
      .join(" | ");

    const flattenedSkills = truncateAtWordBoundary(
      profileData.skillGroups
        .flatMap(function flattenGroup(groupEntry) {
          return groupEntry.items.map(function extractSkill(skill) {
            return t(skill.label);
          });
        })
        .join(", "),
      options.skillsMaxChars
    );

    const summaryText = truncateAtWordBoundary(t(profileData.summary), options.summaryMaxChars);

    const experienceEntries = profileData.experiences.map(function mapExperience(experienceEntry) {
      return {
        title: t(experienceEntry.title),
        company: experienceEntry.company,
        period: t(experienceEntry.period),
        location: t(experienceEntry.location),
        bullets: experienceEntry.bullets
          .slice(0, maxBullets)
          .map(function mapBullet(bullet) {
            return t(bullet);
          })
      };
    });

    return {
      language: language,
      printContactLine: printContactLine,
      summaryText: summaryText,
      flattenedSkills: flattenedSkills,
      experienceEntries: experienceEntries,
      educationEntries: profileData.education,
      certificationEntries: profileData.certifications
    };
  }

  function renderPrintResume(options) {
    const printResumeSettings = profileData.printResume || {};
    const resolvedOptions = Object.assign(
      {
        language: languageConfig.sourceLanguage,
        maxBulletsPerExperience: printResumeSettings.maxBulletsPerExperience || 2,
        summaryMaxChars: 520,
        skillsMaxChars: 380
      },
      options || {}
    );
    const payload = buildPrintResumePayload(resolvedOptions);

    const printExperienceMarkup = payload.experienceEntries
      .map(function mapExperience(experienceEntry) {
        const bulletMarkup = experienceEntry.bullets
          .map(function mapBullet(bullet) {
            return "<li>" + escapeHtml(bullet) + "</li>";
          })
          .join("");

        return (
          '<article class="print-item">' +
          '<div class="print-item-head">' +
          "<strong>" +
          escapeHtml(experienceEntry.company) +
          " | " +
          escapeHtml(experienceEntry.location) +
          "</strong>" +
          "<span>" + escapeHtml(experienceEntry.period) + "</span>" +
          "</div>" +
          '<p class="print-role-line">' + escapeHtml(experienceEntry.title) + "</p>" +
          "<ul>" + bulletMarkup + "</ul>" +
          "</article>"
        );
      })
      .join("");

    const printEducationMarkup = payload.educationEntries
      .map(function mapEducation(educationEntry) {
        const localizedTitle = getBestLocalizedText(educationEntry.title, payload.language);
        const localizedDetails = getBestLocalizedText(educationEntry.details, payload.language);
        const localizedExtra = getBestLocalizedText(educationEntry.extra, payload.language);
        const extra = localizedExtra ? "<br>" + escapeHtml(localizedExtra) : "";
        return (
          "<p><strong>" +
          escapeHtml(localizedTitle) +
          "</strong><br>" +
          escapeHtml(localizedDetails) +
          extra +
          "</p>"
        );
      })
      .join("");

    const printCertificationMarkup = payload.certificationEntries
      .map(function mapCertification(certificationEntry) {
        const localizedTitle = getBestLocalizedText(certificationEntry.title, payload.language);
        const localizedIssuer = getBestLocalizedText(certificationEntry.issuer, payload.language);
        const localizedIssued = getBestLocalizedText(certificationEntry.issued, payload.language);
        return (
          "<p>" +
          escapeHtml(localizedTitle) +
          " | " +
          escapeHtml(localizedIssuer) +
          " | " +
          escapeHtml(localizedIssued) +
          "</p>"
        );
      })
      .join("");

    dom.printName.textContent = profileData.candidateName;
    dom.printContactLine.textContent = payload.printContactLine;
    dom.printSummary.textContent = payload.summaryText;
    dom.printSkills.textContent = payload.flattenedSkills;
    dom.printExperienceList.innerHTML = printExperienceMarkup;
    dom.printEducationList.innerHTML = printEducationMarkup;
    dom.printCertificationList.innerHTML = printCertificationMarkup;

    const resumeTextBlob = [
      profileData.candidateName,
      payload.printContactLine,
      payload.summaryText,
      payload.flattenedSkills,
      payload.experienceEntries
        .map(function flattenExperience(entry) {
          return [entry.title, entry.company, entry.period, entry.location].join(" ");
        })
        .join(" "),
      payload.experienceEntries
        .flatMap(function flattenBullets(entry) {
          return entry.bullets;
        })
        .join(" "),
      payload.educationEntries
        .map(function flattenEducation(entry) {
          return [entry.title, entry.details, entry.extra || ""].join(" ");
        })
        .join(" "),
      payload.certificationEntries
        .map(function flattenCertification(entry) {
          return [entry.title, entry.issuer, entry.issued].join(" ");
        })
        .join(" ")
    ].join(" ");

    return {
      totalWordCount: countWords(resumeTextBlob),
      summaryLength: payload.summaryText.length,
      totalBulletCount: payload.experienceEntries.reduce(function sumBullets(total, entry) {
        return total + entry.bullets.length;
      }, 0),
      experienceCount: payload.experienceEntries.length,
      hasSkills: Boolean(payload.flattenedSkills),
      usedLanguage: payload.language
    };
  }

  function measurePrintResumeHeight() {
    if (!dom.printResumeRoot) {
      return 0;
    }
    dom.printResumeRoot.classList.add("measure-mode");
    const measuredHeight = dom.printResumeRoot.scrollHeight;
    dom.printResumeRoot.classList.remove("measure-mode");
    return measuredHeight;
  }

  function buildAtsHeuristicReport(printPayload, fitsOnePage) {
    let score = 100;
    const criticalIssues = [];
    const warnings = [];

    if (!isLikelyEmailAddress(profileData.contact.email)) {
      criticalIssues.push("Email is missing or invalid.");
      score -= 18;
    }
    if (!isLikelyPhoneNumber(profileData.contact.phone)) {
      criticalIssues.push("Phone number is missing or invalid.");
      score -= 18;
    }
    if (printPayload.experienceCount < 2) {
      warnings.push("At least two experience entries are recommended for ATS confidence.");
      score -= 8;
    }
    if (printPayload.totalBulletCount < 4) {
      warnings.push("Low bullet count may reduce keyword coverage.");
      score -= 8;
    }
    if (printPayload.summaryLength < 80 || printPayload.summaryLength > 550) {
      warnings.push("Summary length is outside the recommended range.");
      score -= 6;
    }
    if (printPayload.totalWordCount < 180 || printPayload.totalWordCount > 900) {
      warnings.push("Total resume word count is outside typical one-page ATS targets.");
      score -= 10;
    }
    if (!printPayload.hasSkills) {
      criticalIssues.push("Skills section is empty.");
      score -= 14;
    }
    if (!fitsOnePage) {
      criticalIssues.push("Resume overflows one page with current content.");
      score -= 20;
    }

    const normalizedScore = Math.max(0, Math.min(100, score));
    const status = criticalIssues.length
      ? "failed"
      : warnings.length
        ? "warning"
        : "ready";

    return {
      status: status,
      score: normalizedScore,
      criticalIssues: criticalIssues,
      warnings: warnings
    };
  }

  function updatePrintHealthLine(report, language) {
    // ATS precheck is intentionally not rendered in the interface.
    // The report is consumed only during the print flow.
    void report;
    void language;
  }

  function optimizePrintResumeLayout() {
    const printResumeSettings = profileData.printResume || {};
    const preferredPrintLanguage = normalizeLanguage(
      printResumeSettings.language || languageConfig.sourceLanguage
    );

    let bestPayload = null;
    let bestFit = false;

    for (let index = 0; index < printConfig.strategySteps.length; index += 1) {
      const step = printConfig.strategySteps[index];
      const payload = renderPrintResume({
        language: preferredPrintLanguage,
        maxBulletsPerExperience: Math.min(
          printResumeSettings.maxBulletsPerExperience || 2,
          step.maxBulletsPerExperience
        ),
        summaryMaxChars: step.summaryMaxChars,
        skillsMaxChars: step.skillsMaxChars
      });
      const fitsOnePage = measurePrintResumeHeight() <= printConfig.pageContentHeightPx;
      bestPayload = payload;
      bestFit = fitsOnePage;
      if (fitsOnePage) {
        break;
      }
    }

    const report = buildAtsHeuristicReport(bestPayload, bestFit);
    state.printAtsReport = report;
    updatePrintHealthLine(report, state.language);
    return report;
  }

  function setupTopBarButtons() {
    dom.windowButtonClose.textContent = profileData.topBar.buttonLabels.close;
    dom.windowButtonMinimize.textContent = profileData.topBar.buttonLabels.minimize;
    dom.windowButtonMaximize.textContent = profileData.topBar.buttonLabels.maximize;
    dom.windowButtonClose.setAttribute("data-symbol", profileData.topBar.buttonLabels.close);
    dom.windowButtonMinimize.setAttribute("data-symbol", profileData.topBar.buttonLabels.minimize);
    dom.windowButtonMaximize.setAttribute("data-symbol", profileData.topBar.buttonLabels.maximize);
    dom.terminalCommandCursor.textContent = profileData.topBar.commandCursor || "|";

    dom.launcherIcon.className = profileData.topBar.launcherIconClass;
    dom.launcherSpeech.textContent = "";
  }

  function buildLocalizedTopBarCommand(language) {
    const normalizedLanguage = normalizeLanguage(language);
    const baseCommand = profileData.topBar.commandMessage || "$ code session --agent=viewer";

    if (/--lang\s+\w+/i.test(baseCommand)) {
      return baseCommand.replace(/--lang\s+\w+/i, "--lang " + normalizedLanguage);
    }

    return baseCommand + " --lang " + normalizedLanguage;
  }

  function showTopBarIntroThenCommand(language) {
    // Always show the welcome line first, then type the command line.
    dom.terminalCommandText.textContent =
      "$ " + getBestLocalizedText(profileData.topBar.firstVisitMessage, language);

    trackTimeout(function switchToCommand() {
      typeTextInDuration(
        dom.terminalCommandText,
        buildLocalizedTopBarCommand(language),
        800
      );
    }, 1000);
  }

  function setLanguageToggleUi(isTranslating, targetLanguage) {
    if (isTranslating) {
      dom.languageToggleButton.disabled = true;
      dom.languageToggleButton.classList.add("is-loading");
      dom.languageToggleIcon.className = "fa-solid fa-arrows-rotate button-icon";
      dom.languageToggleLabel.textContent = getBestLocalizedText(
        uiText.translatingButton,
        targetLanguage
      );
      return;
    }

    dom.languageToggleButton.disabled = false;
    dom.languageToggleButton.classList.remove("is-loading");
    dom.languageToggleIcon.className = "fa-solid fa-language button-icon";
    dom.languageToggleLabel.textContent = targetLanguage === "en" ? "RO" : "EN";
    dom.languageToggleButton.setAttribute(
      "aria-label",
      targetLanguage === "en"
        ? getBestLocalizedText("Switch to Romanian", targetLanguage)
        : getBestLocalizedText("Switch to English", targetLanguage)
    );
  }

  function runLauncherSpeechBubble(text) {
    typeTextInDuration(dom.launcherSpeech, text, 900);
  }

  async function applyLanguage(language) {
    const renderToken = ++state.renderToken;
    const targetLanguage = normalizeLanguage(language);

    setLanguageToggleUi(true, targetLanguage);

    try {
      await translateBatchWithExternalApi(collectTranslatableStrings(), targetLanguage);
    } catch (error) {
      // Ignore transient API failures; dictionary fallback is still available.
    }

    if (renderToken !== state.renderToken) {
      return;
    }

    state.language = targetLanguage;
    document.documentElement.lang = targetLanguage;

    function translate(entry) {
      return getBestLocalizedText(entry, targetLanguage);
    }
    clearActiveAsyncWork();

    showTopBarIntroThenCommand(targetLanguage);

    dom.heroPaneTitle.textContent = translate(uiText.heroPaneTitle);
    dom.profilePaneTitle.textContent = translate(uiText.profilePaneTitle);
    dom.activityPaneTitle.textContent = translate(uiText.activityPaneTitle);
    dom.experiencePaneTitle.textContent = translate(uiText.experiencePaneTitle);
    dom.skillsPaneTitle.textContent = translate(uiText.skillsPaneTitle);
    dom.educationPaneTitle.textContent = translate(uiText.educationPaneTitle);
    dom.certificationsPaneTitle.textContent = translate(uiText.certificationsPaneTitle);
    dom.printResumeLabel.textContent = translate(uiText.printResumeButton);
    dom.experiencePaneHint.textContent = translate(uiText.experienceHint);

    dom.statusLine.textContent = translate(profileData.statusLine);
    dom.candidateName.textContent = profileData.candidateName;
    dom.heroRole.textContent = translate(profileData.role);
    typeTextInDuration(dom.heroSummary, translate(profileData.summary), 2500);

    const safeMailto = toSafeMailtoUrl(profileData.contact.email);
    const safePhone = toSafeTelUrl(profileData.contact.phone);
    const safeLinkedinUrl = toSafeExternalUrl(profileData.contact.linkedinUrl);
    const safeGithubUrl = toSafeExternalUrl(profileData.contact.githubUrl);

    setAnchorHref(dom.emailLink, safeMailto);
    dom.emailValue.textContent = profileData.contact.email;
    setAnchorHref(dom.phoneLink, safePhone);
    dom.phoneValue.textContent = profileData.contact.phone;
    setAnchorHref(dom.linkedinLink, safeLinkedinUrl);
    dom.linkedinValue.textContent = extractPublicPath(safeLinkedinUrl);
    setAnchorHref(dom.githubLink, safeGithubUrl);
    dom.githubValue.textContent = extractPublicPath(safeGithubUrl);

    dom.profileLocationLabel.textContent =
      translate(uiText.profileLabel) + " · " + translate(uiText.locationLabel);
    dom.profileLocationValue.textContent = translate(profileData.location);
    dom.profileJobTypeLabel.textContent = translate(uiText.jobTypeLabel);
    dom.profileJobTypeValue.textContent = translate(profileData.jobType);
    dom.profileDriversLicenseLabel.textContent = translate(uiText.driversLicenseLabel);
    dom.profileDriversLicenseValue.textContent = translate(profileData.driversLicense);
    dom.profileAgeLabel.textContent = translate(uiText.ageLabel);
    dom.profileAgeValue.textContent =
      calculateAgeYears(profileData.birthDateIso) + " " + translate(uiText.ageSuffix);
    dom.profileAvailabilityLabel.textContent = translate(uiText.availabilityLabel);
    dom.profileAvailabilityValue.textContent = translate(getAvailabilityLabel());
    dom.footerCopyrightWord.textContent = translate(uiText.copyrightWord);
    dom.footerBranchLabel.textContent =
      "feature/" + formatYearMonth(new Date()) + "-please_hire_me";

    state.launcherTerminalText = "$ " + translate(profileData.topBar.firstVisitMessage);
    state.launcherSpeechText = translate(profileData.topBar.launcherSpeechText);

    state.localizedActivityMessages = profileData.activityMessages.map(function mapMessage(message) {
      return translate(message);
    });
    startActivityLoop(state.localizedActivityMessages);
    startProfileFlipLoop();

    const experienceMarkup = profileData.experiences
      .map(function mapExperience(experienceEntry) {
        const bulletMarkup = experienceEntry.bullets
          .map(function mapBullet(bullet) {
            return "<li>" + escapeHtml(translate(bullet)) + "</li>";
          })
          .join("");

        return (
          '<article class="experience-card">' +
          '<div class="experience-header">' +
          "<div>" +
          '<div class="experience-meta">' +
          "<span>" + escapeHtml(translate(experienceEntry.period)) + "</span>" +
          '<span><i class="fa-solid fa-location-dot" aria-hidden="true"></i> ' +
          escapeHtml(translate(experienceEntry.location)) +
          "</span>" +
          "</div>" +
          '<h3 class="experience-title">' +
          escapeHtml(translate(experienceEntry.title)) +
          " · " +
          escapeHtml(experienceEntry.company) +
          "</h3>" +
          "</div>" +
          '<button type="button" class="experience-toggle" aria-expanded="false" ' +
          'data-expand-label="' +
          escapeHtml(translate(uiText.expandLabel)) +
          '" data-collapse-label="' +
          escapeHtml(translate(uiText.collapseLabel)) +
          '">' +
          '<span class="experience-toggle-label"></span>' +
          '<i class="fa-solid fa-chevron-down" aria-hidden="true"></i>' +
          "</button>" +
          "</div>" +
          '<div class="experience-content"><ul>' +
          bulletMarkup +
          "</ul></div>" +
          "</article>"
        );
      })
      .join("");
    dom.experienceList.innerHTML = experienceMarkup;
    bindExperienceToggleEvents();

    const skillsMarkup = profileData.skillGroups
      .map(function mapSkillGroup(groupEntry, index) {
        const groupClass = "group-" + String((index % 5) + 1);
        const itemMarkup = groupEntry.items
          .map(function mapSkillItem(skillEntry) {
            return (
              '<span class="skill-chip">' +
              '<i class="' +
              escapeHtml(skillEntry.iconClass) +
              '" aria-hidden="true"></i>' +
              "<span>" + escapeHtml(translate(skillEntry.label)) + "</span>" +
              "</span>"
            );
          })
          .join("");

        return (
          '<section class="skill-group">' +
          '<h3 class="skill-group-title ' +
          escapeHtml(groupClass) +
          '">' +
          escapeHtml(translate(groupEntry.label)) +
          "</h3>" +
          '<div class="skill-chip-list">' +
          itemMarkup +
          "</div>" +
          "</section>"
        );
      })
      .join("");
    dom.skillsGroupList.innerHTML = skillsMarkup;

    const educationMarkup = profileData.education
      .map(function mapEducation(educationEntry) {
        const optionalExtra = educationEntry.extra
          ? "<p>" + escapeHtml(translate(educationEntry.extra)) + "</p>"
          : "";
        return (
          '<article class="info-card">' +
          '<i class="' +
          escapeHtml(educationEntry.iconClass) +
          '" aria-hidden="true"></i>' +
          "<div>" +
          "<strong>" + escapeHtml(translate(educationEntry.title)) + "</strong>" +
          "<p>" + escapeHtml(translate(educationEntry.details)) + "</p>" +
          optionalExtra +
          "</div>" +
          "</article>"
        );
      })
      .join("");
    dom.educationList.innerHTML = educationMarkup;

    const certificationsMarkup = profileData.certifications
      .map(function mapCertification(certificationEntry) {
        const skillTagMarkup = (certificationEntry.skills || [])
          .map(function mapSkillTag(skillTag) {
            return '<span class="cert-skill-tag">' + escapeHtml(translate(skillTag)) + "</span>";
          })
          .join("");

        const expiresLine = certificationEntry.expires
          ? '<p class="cert-meta-line">' + escapeHtml(translate(certificationEntry.expires)) + "</p>"
          : "";
        const credentialLine = certificationEntry.credentialId
          ? '<p class="cert-meta-line">' + escapeHtml(translate(certificationEntry.credentialId)) + "</p>"
          : "";
        return (
          '<article class="info-card cert-card">' +
          '<i class="' + escapeHtml(certificationEntry.iconClass) + '" aria-hidden="true"></i>' +
          "<div>" +
          "<strong>" + escapeHtml(translate(certificationEntry.title)) + "</strong>" +
          '<p class="cert-meta-line">' + escapeHtml(translate(certificationEntry.issuer)) + "</p>" +
          '<p class="cert-meta-line">' + escapeHtml(translate(certificationEntry.issued)) + "</p>" +
          expiresLine +
          credentialLine +
          (skillTagMarkup ? '<div class="cert-skill-row">' + skillTagMarkup + "</div>" : "") +
          "</div>" +
          "</article>"
        );
      })
      .join("");
    dom.certificationList.innerHTML = certificationsMarkup;

    setLanguageToggleUi(false, targetLanguage);
    optimizePrintResumeLayout();
  }

  function handleLanguageToggle() {
    const nextLanguage = state.language === "en" ? "ro" : "en";
    applyLanguage(nextLanguage);
  }

  function handlePrintResume() {
    const report = optimizePrintResumeLayout();

    if (report.status !== "ready") {
      const issueLines = report.criticalIssues.concat(report.warnings).slice(0, 4);
      const shouldContinue = window.confirm(
        "ATS precheck score: " +
          String(report.score) +
          "/100\n\n" +
          issueLines.join("\n") +
          "\n\nContinue and print anyway?"
      );
      if (!shouldContinue) {
        return;
      }
    }

    window.print();
  }

  function handleCloseApp() {
    dom.launcherTerminalLine.textContent =
      state.launcherTerminalText || "$ Welcome to my 127.0.0.1";
    runLauncherSpeechBubble(
      state.launcherSpeechText || "Pss! Please open and hire me!"
    );
    document.body.classList.add("app-collapsed");
  }

  function handleOpenApp() {
    document.body.classList.remove("app-collapsed");
    dom.launcherSpeech.textContent = "";
    showTopBarIntroThenCommand(state.language);
  }

  function handleMinimizeApp() {
    document.body.classList.toggle("app-minimized");
  }

  function handleMaximizeApp() {
    const cards = Array.from(dom.experienceList.querySelectorAll(".experience-card"));
    if (!cards.length) {
      document.body.classList.toggle("app-maximized");
      return;
    }

    const shouldExpandAll = !areAllExperienceCardsExpanded();
    setAllExperienceCardsExpanded(shouldExpandAll);
    document.body.classList.toggle("app-maximized", shouldExpandAll);
  }

  function isTypingTarget(eventTarget) {
    if (!eventTarget || !(eventTarget instanceof HTMLElement)) {
      return false;
    }
    if (eventTarget.isContentEditable) {
      return true;
    }
    const tagName = eventTarget.tagName.toLowerCase();
    return tagName === "input" || tagName === "textarea" || tagName === "select";
  }

  function handleGlobalShortcuts(event) {
    if (isTypingTarget(event.target)) {
      return;
    }

    const pressedKey = String(event.key || "").toLowerCase();
    if ((event.metaKey || event.ctrlKey) && pressedKey === "k") {
      event.preventDefault();
      handleLanguageToggle();
      return;
    }
    if ((event.metaKey || event.ctrlKey) && pressedKey === "p") {
      event.preventDefault();
      handlePrintResume();
      return;
    }
    if (pressedKey === "e") {
      event.preventDefault();
      handleMaximizeApp();
      return;
    }
    if (pressedKey === "m") {
      event.preventDefault();
      handleMinimizeApp();
    }
  }

  function handleVisibilityChange() {
    state.isPageVisible = !document.hidden;
    if (!state.isPageVisible) {
      clearActiveAsyncWork();
      return;
    }

    showTopBarIntroThenCommand(state.language);
    startActivityLoop(state.localizedActivityMessages);
    startProfileFlipLoop();
  }

  function initializeStaticUi() {
    renderProfileImage();
    setupTopBarButtons();
    setLanguageToggleUi(false, "en");
    dom.footerName.textContent = profileData.candidateName;
    dom.currentYear.textContent = String(new Date().getFullYear());
    optimizePrintResumeLayout();
  }

  function initializeEventListeners() {
    dom.languageToggleButton.addEventListener("click", handleLanguageToggle);
    dom.printResumeButton.addEventListener("click", handlePrintResume);
    dom.windowButtonClose.addEventListener("click", handleCloseApp);
    dom.launcherCard.addEventListener("click", handleOpenApp);
    dom.launcherCard.addEventListener("keydown", function handleLauncherKeyDown(event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleOpenApp();
      }
    });
    dom.windowButtonMinimize.addEventListener("click", handleMinimizeApp);
    dom.windowButtonMaximize.addEventListener("click", handleMaximizeApp);
    document.addEventListener("keydown", handleGlobalShortcuts);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    window.addEventListener("resize", function resizeOpenExperienceCards() {
      const openCards = Array.from(
        dom.experienceList.querySelectorAll(".experience-card.open")
      );
      openCards.forEach(function updateCardHeight(cardElement) {
        const contentElement = cardElement.querySelector(".experience-content");
        if (contentElement) {
          contentElement.style.maxHeight = contentElement.scrollHeight + "px";
        }
      });

      if (state.resizePrintTimeoutId) {
        window.clearTimeout(state.resizePrintTimeoutId);
      }
      state.resizePrintTimeoutId = window.setTimeout(function updatePrintAfterResize() {
        optimizePrintResumeLayout();
      }, 120);
    });
  }

  function initializePage() {
    loadTranslationCache();
    initializeStaticUi();
    initializeEventListeners();
    applyLanguage("en");
    warmUpRomanianTranslations();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializePage);
  } else {
    initializePage();
  }
})();
