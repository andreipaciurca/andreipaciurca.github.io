/**
 * @module Main
 * @description Entry point for the application. Orchestrates UI initialization and event listeners.
 */
import { uiText, languageConfig } from './modules/config.js';
import { state, clearActiveAsyncWork, trackTimeout } from './modules/state.js';
import { dom } from './modules/dom.js';
import { profileData } from '../profile-data.js';
import {
  escapeHtml,
  calculateAgeYears,
  formatYearMonth,
  toSafeMailtoUrl,
  toSafeTelUrl,
  toSafeExternalUrl,
  extractPublicPath
} from './modules/utils.js';
import {
  normalizeLanguage,
  loadTranslationCache,
  getBestLocalizedText,
  translateBatchWithExternalApi,
  collectTranslatableStrings,
  warmUpRomanianTranslations
} from './modules/translation.js';
import { optimizePrintResumeLayout } from './modules/print.js';
import {
  renderProfileImage,
  startProfileFlipLoop,
  startActivityLoop,
  typeTextInDuration,
  bindExperienceToggleEvents,
  setAllExperienceCardsExpanded,
  areAllExperienceCardsExpanded
} from './modules/ui.js';

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
  const baseCommand = profileData.topBar.commandMessage || "$ codee session --agent=viewer";

  if (/--lang\s+\w+/i.test(baseCommand)) {
    return baseCommand.replace(/--lang\s+\w+/i, "--lang " + normalizedLanguage);
  }

  return baseCommand + " --lang " + normalizedLanguage;
}

function showTopBarIntroThenCommand(language) {
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
  dom.profileAvailabilityValue.textContent = translate(
    profileData.availabilityMode === "notice"
      ? uiText.availabilityNotice
      : uiText.availabilityImmediate
  );
  dom.footerCopyrightWord.textContent = translate(uiText.copyrightWord);
  dom.footerBranchLabel.textContent =
    "feature/" + formatYearMonth(new Date()) + "-please_hire_me";

  state.launcherTerminalText = translate(profileData.topBar.firstVisitMessage);
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
      const credentialIdLine = certificationEntry.credentialId
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
        credentialIdLine +
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

function handleThemeToggle() {
  document.body.classList.toggle("light-mode");
}

const commandRegistry = {
  help: () => alert("Available commands: help, theme, clear, ls, contact, resume"),
  theme: () => handleThemeToggle(),
  clear: () => { dom.terminalCommandText.textContent = ""; },
  ls: () => alert("Files: profile-data.js, i18n-data.js, index.html, style.css, js/"),
  contact: () => dom.emailLink.click(),
  resume: () => handlePrintResume()
};

function handleTerminalKeyDown(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    const commandLine = dom.terminalCommandText.textContent.trim().toLowerCase();
    const [command] = commandLine.split(" ");

    if (commandRegistry[command]) {
      commandRegistry[command]();
    } else if (command) {
    }
  }
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
  dom.themeToggleButton.addEventListener("click", handleThemeToggle);
  dom.terminalCommandText.addEventListener("keydown", handleTerminalKeyDown);
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
