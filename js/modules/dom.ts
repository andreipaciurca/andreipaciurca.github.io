/**
 * @module Dom
 * @description Typed DOM element references.
 * All IDs must stay in sync with index.html. Using typed HTMLElement subtypes
 * enables compile-time checking of element-specific properties (e.g. .href on
 * anchors, .src on images).
 *
 * Non-null assertions (!) are intentional — every element is guaranteed to
 * exist in index.html. If an ID is removed from the HTML, TypeScript will
 * still compile but the browser will throw at runtime, which is caught by E2E.
 */

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

export const dom = {
  terminalCommandForm:        el<HTMLFormElement>('terminalCommandForm'),
  terminalInput:              el<HTMLInputElement>('terminalInput'),
  terminalHistory:            el('terminalHistory'),
  terminalCommandText:         el('terminalCommandText'),
  terminalCommandCursor:      el('terminalCommandCursor'),
  terminalOutputOverlay:      el('terminalOutputOverlay'),
  terminalOutputBody:         el('terminalOutputBody'),
  closeTerminalOutput:        el<HTMLButtonElement>('closeTerminalOutput'),
  windowButtonClose:          el<HTMLButtonElement>('windowButtonClose'),
  windowButtonMinimize:       el<HTMLButtonElement>('windowButtonMinimize'),
  windowButtonMaximize:       el<HTMLButtonElement>('windowButtonMaximize'),
  themeToggleButton:          el<HTMLButtonElement>('themeToggleButton'),
  launcher:                   el('appLauncher'),
  launcherCard:               el('launcherCard'),
  launcherIcon:               el('launcherIcon'),
  launcherTerminalLine:       el('launcherTerminalLine'),
  launcherSpeech:             el<HTMLPreElement>('launcherSpeech'),
  heroPaneTitle:              el('heroPaneTitle'),
  profilePaneTitle:           el('profilePaneTitle'),
  activityPaneTitle:          el('activityPaneTitle'),
  terminalPaneTitle:          el('terminalPaneTitle'),
  experiencePaneTitle:        el('experiencePaneTitle'),
  skillsPaneTitle:            el('skillsPaneTitle'),
  educationPaneTitle:         el('educationPaneTitle'),
  certificationsPaneTitle:    el('certificationsPaneTitle'),
  downloadResumeBtn:          el('downloadResumeBtn'),
  printResumeButton:          el<HTMLButtonElement>('printResumeButton'),
  printResumeLabel:           el('printResumeLabel'),
  statusLine:                 el('statusLine'),
  candidateName:              el('candidateName'),
  heroRole:                   el('heroRole'),
  heroSummary:                el('heroSummary'),
  profilePhotoFrame:          el('profilePhotoFrame'),
  profilePhoto:               el<HTMLImageElement>('profilePhoto'),
  profileInitials:            el('profileInitials'),
  profileAsciiArt:            el<HTMLPreElement>('profileAsciiArt'),
  emailLink:                  el<HTMLAnchorElement>('emailLink'),
  emailValue:                 el('emailValue'),
  phoneLink:                  el<HTMLAnchorElement>('phoneLink'),
  phoneValue:                 el('phoneValue'),
  linkedinLink:               el<HTMLAnchorElement>('linkedinLink'),
  linkedinValue:              el('linkedinValue'),
  githubLink:                 el<HTMLAnchorElement>('githubLink'),
  githubValue:                el('githubValue'),
  profileLocationLabel:       el('profileLocationLabel'),
  profileLocationValue:       el('profileLocationValue'),
  profileJobTypeLabel:        el('profileJobTypeLabel'),
  profileJobTypeValue:        el('profileJobTypeValue'),
  profileDriversLicenseLabel: el('profileDriversLicenseLabel'),
  profileDriversLicenseValue: el('profileDriversLicenseValue'),
  profileAgeLabel:            el('profileAgeLabel'),
  profileAgeValue:            el('profileAgeValue'),
  profileAvailabilityLabel:   el('profileAvailabilityLabel'),
  profileAvailabilityValue:   el('profileAvailabilityValue'),
  experiencePaneHint:         el('experiencePaneHint'),
  experienceList:             el('experienceList'),
  skillsGroupList:            el('skillsGroupList'),
  educationList:              el('educationList'),
  certificationList:          el('certificationList'),
  activityTypingText:         el('activityTypingText'),
  footerCopyrightWord:        el('footerCopyrightWord'),
  footerName:                 el('footerName'),
  currentYear:                el('currentYear'),
  footerBranchLabel:          el('footerBranchLabel'),
  printResumeRoot:            el('printResumeRoot'),
  printName:                  el('printName'),
  printContactLine:           el('printContactLine'),
  printSummary:               el('printSummary'),
  printSkills:                el('printSkills'),
  printExperienceList:        el('printExperienceList'),
  printEducationList:         el('printEducationList'),
  printCertificationList:     el('printCertificationList'),
} as const;

export type Dom = typeof dom;
