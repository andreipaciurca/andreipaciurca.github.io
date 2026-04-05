/**
 * @module Main
 * @description Application entry point. Bootstraps the UI, initializes modules,
 * and manages global event listeners for theme, print, and window controls.
 */
import { uiText } from './modules/config.js';
import { 
  state, 
  clearActiveAsyncWork, 
  trackTimeout 
} from './modules/state.js';
import { dom } from './modules/dom.js';
import { profileData } from '../profile-data.js';
import {
  calculateAgeYears,
  formatYearMonth,
  toSafeMailtoUrl,
  toSafeTelUrl,
  toSafeExternalUrl,
  extractPublicPath,
} from './modules/utils.js';
import { optimizePrintResumeLayout } from './modules/print.js';
import {
  renderExperienceList,
  renderSkillsGroups,
  renderEducationList,
  renderCertificationsList,
} from './modules/renderer.js';
import { initializeTerminal } from './modules/terminal.js';
import {
  renderProfileImage,
  setupProfileFlipOnHover,
  startActivityLoop,
  typeTextInDuration,
  bindExperienceToggleEvents,
  setAllExperienceCardsExpanded,
  areAllExperienceCardsExpanded,
} from './modules/ui.js';

/**
 * Configures the initial state and attributes for window control buttons.
 */
function setupTopBarButtons(): void {
  dom.windowButtonClose.textContent    = '';
  dom.windowButtonMinimize.textContent = '';
  dom.windowButtonMaximize.textContent = '';
  dom.windowButtonClose.setAttribute('data-symbol',    'x');
  dom.windowButtonMinimize.setAttribute('data-symbol', '-');
  dom.windowButtonMaximize.setAttribute('data-symbol', '+');
  dom.terminalCommandCursor.textContent = '|';

  dom.launcherIcon.className  = profileData.topBar.launcherIconClass;
  dom.launcherSpeech.textContent = '';
}

/**
 * Triggers the terminal top-bar typing sequence.
 * Sequentially displays a welcome message followed by the session command.
 */
function showTopBarCommand(): void {
  const welcomeText = '$ Welcome to my 127.0.0.1';
  const commandText = '$ code session --agent=viewer --profile=andrei';
  
  if (dom.terminalCommandText.textContent === commandText) return;
  
  // Skip animation in CI/test environments for stability
  const isCI = (window as any).CI || (window as any).__playwright_test__ || (navigator as any).webdriver;
  if (isCI) {
    dom.terminalCommandText.textContent = commandText;
    return;
  }

  dom.terminalCommandText.textContent = '';
  
  function typeWelcome() {
    let charIndex = 0;
    function nextChar() {
      if (dom.terminalCommandText.dataset.typing === 'command') return;
      if (charIndex < welcomeText.length) {
        dom.terminalCommandText.textContent += welcomeText[charIndex];
        charIndex++;
        trackTimeout(nextChar, 40);
      } else {
        trackTimeout(typeCommand, 1500);
      }
    }
    nextChar();
  }
  
  function typeCommand() {
    dom.terminalCommandText.dataset.typing = 'command';
    dom.terminalCommandText.textContent = '';
    let charIndex = 0;
    function nextChar() {
      if (charIndex < commandText.length) {
        dom.terminalCommandText.textContent += commandText[charIndex];
        charIndex++;
        trackTimeout(nextChar, 45);
      }
    }
    nextChar();
  }
  
  dom.terminalCommandText.dataset.typing = 'welcome';
  dom.terminalCommandText.textContent = ''; // Reset before starting
  typeWelcome();
}

/**
 * Animates a text bubble for the launcher icon.
 * @param text The message to display.
 */
function runLauncherSpeechBubble(text: string): void {
  typeTextInDuration(dom.launcherSpeech, text, 900);
}

/**
 * Safely updates an anchor's href and accessibility attributes.
 * @param anchorElement The element to update.
 * @param safeUrl The validated URL.
 */
function setAnchorHref(anchorElement: HTMLAnchorElement | null, safeUrl: string): void {
  if (!anchorElement) return;

  if (!safeUrl) {
    anchorElement.href = '#';
    anchorElement.setAttribute('aria-disabled', 'true');
    anchorElement.tabIndex = -1;
    return;
  }

  anchorElement.href = safeUrl;
  anchorElement.setAttribute('aria-disabled', 'false');
  anchorElement.removeAttribute('tabindex');
}

/**
 * Main render function. Orchestrates data binding and HTML generation.
 */
function renderPage(): void {
  clearActiveAsyncWork();
  showTopBarCommand();

  dom.heroPaneTitle.textContent          = uiText.heroPaneTitle;
  dom.profilePaneTitle.textContent       = uiText.profilePaneTitle;
  dom.activityPaneTitle.textContent      = uiText.activityPaneTitle;
  dom.terminalPaneTitle.textContent      = uiText.terminalPaneTitle;
  dom.experiencePaneTitle.textContent    = uiText.experiencePaneTitle;
  dom.skillsPaneTitle.textContent        = uiText.skillsPaneTitle;
  dom.educationPaneTitle.textContent     = uiText.educationPaneTitle;
  dom.certificationsPaneTitle.textContent = uiText.certificationsPaneTitle;
  dom.printResumeLabel.textContent       = uiText.printResumeButton;
  dom.experiencePaneHint.textContent     = uiText.experienceHint;

  dom.statusLine.textContent    = profileData.statusLine;
  dom.candidateName.textContent = profileData.candidateName;
  dom.heroRole.textContent      = profileData.role;
  typeTextInDuration(dom.heroSummary, profileData.summary, 2500);

  const safeMailto    = toSafeMailtoUrl(profileData.contact.email);
  const safePhone     = toSafeTelUrl(profileData.contact.phone);
  const safeLinkedin  = toSafeExternalUrl(profileData.contact.linkedinUrl);
  const safeGithub    = toSafeExternalUrl(profileData.contact.githubUrl);

  setAnchorHref(dom.emailLink,    safeMailto);
  dom.emailValue.textContent = profileData.contact.email;
  setAnchorHref(dom.phoneLink,    safePhone);
  dom.phoneValue.textContent = profileData.contact.phone;
  setAnchorHref(dom.linkedinLink, safeLinkedin);
  dom.linkedinValue.textContent = extractPublicPath(safeLinkedin);
  setAnchorHref(dom.githubLink,   safeGithub);
  dom.githubValue.textContent = extractPublicPath(safeGithub);

  dom.profileLocationLabel.textContent   = `${uiText.profileLabel} · ${uiText.locationLabel}`;
  dom.profileLocationValue.textContent   = profileData.location;
  dom.profileJobTypeLabel.textContent    = uiText.jobTypeLabel;
  dom.profileJobTypeValue.textContent    = profileData.jobType;
  dom.profileDriversLicenseLabel.textContent = uiText.driversLicenseLabel;
  dom.profileDriversLicenseValue.textContent = profileData.driversLicense;
  dom.profileAgeLabel.textContent        = uiText.ageLabel;
  dom.profileAgeValue.textContent        = `${calculateAgeYears(profileData.birthDateIso)} ${uiText.ageSuffix}`;
  dom.profileAvailabilityLabel.textContent = uiText.availabilityLabel;
  dom.profileAvailabilityValue.textContent = profileData.availabilityMode === 'notice'
    ? uiText.availabilityNotice
    : uiText.availabilityImmediate;
  dom.footerCopyrightWord.textContent    = uiText.copyrightWord;
  dom.footerBranchLabel.textContent      = `feature/${formatYearMonth(new Date())}-please_hire_me`;

  state.launcherTerminalText = profileData.topBar.firstVisitMessage;
  state.launcherSpeechText   = profileData.topBar.launcherSpeechText;
  state.activityMessages     = profileData.activityMessages.slice();

  startActivityLoop(state.activityMessages);
  setupProfileFlipOnHover();

  dom.experienceList.innerHTML = renderExperienceList(
    profileData.experiences,
    function identity(s: string) { return s; },
    uiText.expandLabel,
    uiText.collapseLabel,
  );
  bindExperienceToggleEvents();

  dom.skillsGroupList.innerHTML  = renderSkillsGroups(profileData.skillGroups, function identity(s: string) { return s; });
  dom.educationList.innerHTML    = renderEducationList(profileData.education,   function identity(s: string) { return s; });
  dom.certificationList.innerHTML = renderCertificationsList(profileData.certifications, function identity(s: string) { return s; });

  optimizePrintResumeLayout();
}

function handlePrintResume(): void {
  const report = optimizePrintResumeLayout();

  if (report.status !== 'ready') {
    const issueLines = [...report.criticalIssues, ...report.warnings].slice(0, 4);
    const shouldContinue = window.confirm(
      `ATS precheck score: ${report.score}/100\n\n${issueLines.join('\n')}\n\nContinue and print anyway?`,
    );
    if (!shouldContinue) return;
  }

  window.print();
}

function handleCloseApp(): void {
  dom.launcherTerminalLine.textContent = state.launcherTerminalText || '$ Welcome to my 127.0.0.1';
  runLauncherSpeechBubble(state.launcherSpeechText || 'Pss! Please open and hire me!');
  document.body.classList.add('app-collapsed');
}

function handleOpenApp(): void {
  document.body.classList.remove('app-collapsed');
  dom.launcherSpeech.textContent = '';
  showTopBarCommand();
}

function handleMinimizeApp(): void {
  document.body.classList.toggle('app-minimized');
}

function handleMaximizeApp(): void {
  const cards = Array.from(dom.experienceList.querySelectorAll('.experience-card'));
  if (!cards.length) {
    document.body.classList.toggle('app-maximized');
    return;
  }
  const shouldExpandAll = !areAllExperienceCardsExpanded();
  setAllExperienceCardsExpanded(shouldExpandAll);
  document.body.classList.toggle('app-maximized', shouldExpandAll);
}

function handleThemeToggle(): void {
  document.body.classList.toggle('light-mode');
}

function isTypingTarget(eventTarget: EventTarget | null): boolean {
  if (!eventTarget || !(eventTarget instanceof HTMLElement)) return false;
  if (eventTarget.isContentEditable) return true;
  const tagName = eventTarget.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
}

function handleGlobalShortcuts(event: KeyboardEvent): void {
  if (isTypingTarget(event.target)) return;

  const pressedKey = String(event.key ?? '').toLowerCase();

  // Disable View Source shortcuts
  if ((event.ctrlKey || event.metaKey) && (pressedKey === 'u' || pressedKey === 's')) {
    event.preventDefault();
    return;
  }

  // Disable DevTools shortcuts
  if (event.key === 'F12' || ((event.ctrlKey || event.metaKey) && event.shiftKey && (pressedKey === 'i' || pressedKey === 'j' || pressedKey === 'c'))) {
    event.preventDefault();
    return;
  }

  if ((event.metaKey || event.ctrlKey) && pressedKey === 'p') {
    event.preventDefault();
    handlePrintResume();
    return;
  }
  if (pressedKey === 'e') { event.preventDefault(); handleMaximizeApp(); return; }
  if (pressedKey === 'm') { event.preventDefault(); handleMinimizeApp(); }
}

function handleVisibilityChange(): void {
  state.isPageVisible = !document.hidden;
  if (!state.isPageVisible) { clearActiveAsyncWork(); return; }
  showTopBarCommand();
  startActivityLoop(state.activityMessages);
}

function setupSecurityProtection(): void {
  const preventContextMenu = (e: MouseEvent) => e.preventDefault();
  
  (window as any).toggleSecurityProtection = (enable: boolean) => {
    if (enable) {
      document.addEventListener('contextmenu', preventContextMenu);
    } else {
      document.removeEventListener('contextmenu', preventContextMenu);
    }
  };

  // Determine if we should be protected by default
  const isLocal = window.location.hostname === 'localhost' || 
                 window.location.hostname === '127.0.0.1';
                 
  // Check if we are in a Playwright test (usually has a special user agent or global)
  const isTesting = navigator.userAgent.toLowerCase().includes('playwright') || 
                   (window as any).__playwright_test__ ||
                   (navigator as any).webdriver;

  // On localhost or during E2E tests, it's OFF by default to facilitate debugging.
  // Otherwise, it's ON by default for production privacy.
  const shouldBeProtected = !isLocal && !isTesting;

  (window as any).toggleSecurityProtection(shouldBeProtected);
}

function initializeStaticUi(): void {
  renderProfileImage();
  setupTopBarButtons();
  dom.footerName.textContent  = profileData.candidateName;
  dom.currentYear.textContent = String(new Date().getFullYear());
}

function initializeEventListeners(): void {
  dom.printResumeButton.addEventListener('click', handlePrintResume);
  dom.windowButtonClose.addEventListener('click', handleCloseApp);
  dom.launcherCard.addEventListener('click', handleOpenApp);
  dom.launcherCard.addEventListener('keydown', function handleLauncherKeyDown(event: Event) {
    const ke = event as KeyboardEvent;
    if (ke.key === 'Enter' || ke.key === ' ') { ke.preventDefault(); handleOpenApp(); }
  });
  dom.windowButtonMinimize.addEventListener('click', handleMinimizeApp);
  dom.windowButtonMaximize.addEventListener('click', handleMaximizeApp);
  dom.themeToggleButton.addEventListener('click', handleThemeToggle);
  document.addEventListener('keydown', handleGlobalShortcuts);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  window.addEventListener('resize', function resizeOpenCards() {
    Array.from(dom.experienceList.querySelectorAll<HTMLElement>('.experience-card.open'))
      .forEach(function updateCardHeight(card) {
        const content = card.querySelector<HTMLElement>('.experience-content');
        if (content) content.style.maxHeight = `${content.scrollHeight}px`;
      });

    if (state.resizePrintTimeoutId !== null) {
      window.clearTimeout(state.resizePrintTimeoutId);
    }
    state.resizePrintTimeoutId = window.setTimeout(function updatePrintAfterResize() {
      optimizePrintResumeLayout();
    }, 120);
  });
}

function initializePage(): void {
  initializeStaticUi();
  initializeEventListeners();
  initializeTerminal();
  setupSecurityProtection();
  renderPage();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePage);
} else {
  initializePage();
}
