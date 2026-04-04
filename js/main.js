/**
 * @module Main
 * @description Application entry point. Bootstraps the UI and wires all event
 * listeners. All user interactions (theme, print, window controls, keyboard
 * shortcuts, visibility changes) are handled here.
 */
import { uiText } from './modules/config.js';
import { state, clearActiveAsyncWork, trackTimeout } from './modules/state.js';
import { dom } from './modules/dom.js';
import { profileData } from '../profile-data.js';
import { calculateAgeYears, formatYearMonth, toSafeMailtoUrl, toSafeTelUrl, toSafeExternalUrl, extractPublicPath, } from './modules/utils.js';
import { optimizePrintResumeLayout } from './modules/print.js';
import { renderExperienceList, renderSkillsGroups, renderEducationList, renderCertificationsList, } from './modules/renderer.js';
import { renderProfileImage, startProfileFlipLoop, startActivityLoop, typeTextInDuration, bindExperienceToggleEvents, setAllExperienceCardsExpanded, areAllExperienceCardsExpanded, } from './modules/ui.js';
function setupTopBarButtons() {
    dom.windowButtonClose.textContent = profileData.topBar.buttonLabels.close;
    dom.windowButtonMinimize.textContent = profileData.topBar.buttonLabels.minimize;
    dom.windowButtonMaximize.textContent = profileData.topBar.buttonLabels.maximize;
    dom.windowButtonClose.setAttribute('data-symbol', profileData.topBar.buttonLabels.close);
    dom.windowButtonMinimize.setAttribute('data-symbol', profileData.topBar.buttonLabels.minimize);
    dom.windowButtonMaximize.setAttribute('data-symbol', profileData.topBar.buttonLabels.maximize);
    dom.terminalCommandCursor.textContent = profileData.topBar.commandCursor || '|';
    dom.launcherIcon.className = profileData.topBar.launcherIconClass;
    dom.launcherSpeech.textContent = '';
}
function showTopBarCommand() {
    dom.terminalCommandText.textContent = `$ ${profileData.topBar.firstVisitMessage}`;
    trackTimeout(function switchToCommand() {
        typeTextInDuration(dom.terminalCommandText, profileData.topBar.commandMessage, 800);
    }, 1000);
}
function runLauncherSpeechBubble(text) {
    typeTextInDuration(dom.launcherSpeech, text, 900);
}
function setAnchorHref(anchorElement, safeUrl) {
    if (!anchorElement)
        return;
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
function renderPage() {
    clearActiveAsyncWork();
    showTopBarCommand();
    dom.heroPaneTitle.textContent = uiText.heroPaneTitle;
    dom.profilePaneTitle.textContent = uiText.profilePaneTitle;
    dom.activityPaneTitle.textContent = uiText.activityPaneTitle;
    dom.experiencePaneTitle.textContent = uiText.experiencePaneTitle;
    dom.skillsPaneTitle.textContent = uiText.skillsPaneTitle;
    dom.educationPaneTitle.textContent = uiText.educationPaneTitle;
    dom.certificationsPaneTitle.textContent = uiText.certificationsPaneTitle;
    dom.printResumeLabel.textContent = uiText.printResumeButton;
    dom.experiencePaneHint.textContent = uiText.experienceHint;
    dom.statusLine.textContent = profileData.statusLine;
    dom.candidateName.textContent = profileData.candidateName;
    dom.heroRole.textContent = profileData.role;
    typeTextInDuration(dom.heroSummary, profileData.summary, 2500);
    const safeMailto = toSafeMailtoUrl(profileData.contact.email);
    const safePhone = toSafeTelUrl(profileData.contact.phone);
    const safeLinkedin = toSafeExternalUrl(profileData.contact.linkedinUrl);
    const safeGithub = toSafeExternalUrl(profileData.contact.githubUrl);
    setAnchorHref(dom.emailLink, safeMailto);
    dom.emailValue.textContent = profileData.contact.email;
    setAnchorHref(dom.phoneLink, safePhone);
    dom.phoneValue.textContent = profileData.contact.phone;
    setAnchorHref(dom.linkedinLink, safeLinkedin);
    dom.linkedinValue.textContent = extractPublicPath(safeLinkedin);
    setAnchorHref(dom.githubLink, safeGithub);
    dom.githubValue.textContent = extractPublicPath(safeGithub);
    dom.profileLocationLabel.textContent = `${uiText.profileLabel} · ${uiText.locationLabel}`;
    dom.profileLocationValue.textContent = profileData.location;
    dom.profileJobTypeLabel.textContent = uiText.jobTypeLabel;
    dom.profileJobTypeValue.textContent = profileData.jobType;
    dom.profileDriversLicenseLabel.textContent = uiText.driversLicenseLabel;
    dom.profileDriversLicenseValue.textContent = profileData.driversLicense;
    dom.profileAgeLabel.textContent = uiText.ageLabel;
    dom.profileAgeValue.textContent = `${calculateAgeYears(profileData.birthDateIso)} ${uiText.ageSuffix}`;
    dom.profileAvailabilityLabel.textContent = uiText.availabilityLabel;
    dom.profileAvailabilityValue.textContent = profileData.availabilityMode === 'notice'
        ? uiText.availabilityNotice
        : uiText.availabilityImmediate;
    dom.footerCopyrightWord.textContent = uiText.copyrightWord;
    dom.footerBranchLabel.textContent = `feature/${formatYearMonth(new Date())}-please_hire_me`;
    state.launcherTerminalText = profileData.topBar.firstVisitMessage;
    state.launcherSpeechText = profileData.topBar.launcherSpeechText;
    state.activityMessages = profileData.activityMessages.slice();
    startActivityLoop(state.activityMessages);
    startProfileFlipLoop();
    dom.experienceList.innerHTML = renderExperienceList(profileData.experiences, function identity(s) { return s; }, uiText.expandLabel, uiText.collapseLabel);
    bindExperienceToggleEvents();
    dom.skillsGroupList.innerHTML = renderSkillsGroups(profileData.skillGroups, function identity(s) { return s; });
    dom.educationList.innerHTML = renderEducationList(profileData.education, function identity(s) { return s; });
    dom.certificationList.innerHTML = renderCertificationsList(profileData.certifications, function identity(s) { return s; });
    optimizePrintResumeLayout();
}
function handlePrintResume() {
    const report = optimizePrintResumeLayout();
    if (report.status !== 'ready') {
        const issueLines = [...report.criticalIssues, ...report.warnings].slice(0, 4);
        const shouldContinue = window.confirm(`ATS precheck score: ${report.score}/100\n\n${issueLines.join('\n')}\n\nContinue and print anyway?`);
        if (!shouldContinue)
            return;
    }
    window.print();
}
function handleCloseApp() {
    dom.launcherTerminalLine.textContent = state.launcherTerminalText || '$ Welcome to my 127.0.0.1';
    runLauncherSpeechBubble(state.launcherSpeechText || 'Pss! Please open and hire me!');
    document.body.classList.add('app-collapsed');
}
function handleOpenApp() {
    document.body.classList.remove('app-collapsed');
    dom.launcherSpeech.textContent = '';
    showTopBarCommand();
}
function handleMinimizeApp() {
    document.body.classList.toggle('app-minimized');
}
function handleMaximizeApp() {
    const cards = Array.from(dom.experienceList.querySelectorAll('.experience-card'));
    if (!cards.length) {
        document.body.classList.toggle('app-maximized');
        return;
    }
    const shouldExpandAll = !areAllExperienceCardsExpanded();
    setAllExperienceCardsExpanded(shouldExpandAll);
    document.body.classList.toggle('app-maximized', shouldExpandAll);
}
function handleThemeToggle() {
    document.body.classList.toggle('light-mode');
}
function isTypingTarget(eventTarget) {
    if (!eventTarget || !(eventTarget instanceof HTMLElement))
        return false;
    if (eventTarget.isContentEditable)
        return true;
    const tagName = eventTarget.tagName.toLowerCase();
    return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
}
function handleGlobalShortcuts(event) {
    if (isTypingTarget(event.target))
        return;
    const pressedKey = String(event.key ?? '').toLowerCase();
    if ((event.metaKey || event.ctrlKey) && pressedKey === 'p') {
        event.preventDefault();
        handlePrintResume();
        return;
    }
    if (pressedKey === 'e') {
        event.preventDefault();
        handleMaximizeApp();
        return;
    }
    if (pressedKey === 'm') {
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
    showTopBarCommand();
    startActivityLoop(state.activityMessages);
    startProfileFlipLoop();
}
function initializeStaticUi() {
    renderProfileImage();
    setupTopBarButtons();
    dom.footerName.textContent = profileData.candidateName;
    dom.currentYear.textContent = String(new Date().getFullYear());
}
function initializeEventListeners() {
    dom.printResumeButton.addEventListener('click', handlePrintResume);
    dom.windowButtonClose.addEventListener('click', handleCloseApp);
    dom.launcherCard.addEventListener('click', handleOpenApp);
    dom.launcherCard.addEventListener('keydown', function handleLauncherKeyDown(event) {
        const ke = event;
        if (ke.key === 'Enter' || ke.key === ' ') {
            ke.preventDefault();
            handleOpenApp();
        }
    });
    dom.windowButtonMinimize.addEventListener('click', handleMinimizeApp);
    dom.windowButtonMaximize.addEventListener('click', handleMaximizeApp);
    dom.themeToggleButton.addEventListener('click', handleThemeToggle);
    document.addEventListener('keydown', handleGlobalShortcuts);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('resize', function resizeOpenCards() {
        Array.from(dom.experienceList.querySelectorAll('.experience-card.open'))
            .forEach(function updateCardHeight(card) {
            const content = card.querySelector('.experience-content');
            if (content)
                content.style.maxHeight = `${content.scrollHeight}px`;
        });
        if (state.resizePrintTimeoutId !== null) {
            window.clearTimeout(state.resizePrintTimeoutId);
        }
        state.resizePrintTimeoutId = window.setTimeout(function updatePrintAfterResize() {
            optimizePrintResumeLayout();
        }, 120);
    });
}
function initializePage() {
    initializeStaticUi();
    initializeEventListeners();
    renderPage();
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
}
else {
    initializePage();
}
