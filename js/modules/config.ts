/**
 * @module Config
 * @description Centralised configuration constants for the resume site.
 */

export interface UiText {
  heroPaneTitle: string;
  profilePaneTitle: string;
  activityPaneTitle: string;
  experiencePaneTitle: string;
  skillsPaneTitle: string;
  educationPaneTitle: string;
  certificationsPaneTitle: string;
  printResumeButton: string;
  experienceHint: string;
  profileLabel: string;
  locationLabel: string;
  jobTypeLabel: string;
  driversLicenseLabel: string;
  ageLabel: string;
  availabilityLabel: string;
  availabilityImmediate: string;
  availabilityNotice: string;
  expandLabel: string;
  collapseLabel: string;
  copyrightWord: string;
  ageSuffix: string;
}

export const uiText: UiText = {
  heroPaneTitle: 'session:identity',
  profilePaneTitle: 'session:profile',
  activityPaneTitle: 'session:ai-feed',
  experiencePaneTitle: 'session:experience',
  skillsPaneTitle: 'session:skills',
  educationPaneTitle: 'session:education',
  certificationsPaneTitle: 'session:certifications',
  printResumeButton: 'Download Resume (PDF)',
  experienceHint: '',
  profileLabel: 'PROFILE',
  locationLabel: 'Location',
  jobTypeLabel: 'Job type',
  driversLicenseLabel: "Driver's lic.",
  ageLabel: 'Age',
  availabilityLabel: 'Availability',
  availabilityImmediate: 'Immediately',
  availabilityNotice: '20 working days notice',
  expandLabel: 'Expand',
  collapseLabel: 'Collapse',
  copyrightWord: 'Copyright',
  ageSuffix: 'years old',
};

export interface PrintStrategyStep {
  maxBulletsPerExperience: number;
  summaryMaxChars: number;
  skillsMaxChars: number;
}

export interface PrintConfig {
  pageContentHeightPx: number;
  strategySteps: PrintStrategyStep[];
}

export const printConfig: PrintConfig = {
  pageContentHeightPx: 970,
  strategySteps: [
    { maxBulletsPerExperience: 3, summaryMaxChars: 600, skillsMaxChars: 420 },
    { maxBulletsPerExperience: 2, summaryMaxChars: 520, skillsMaxChars: 380 },
    { maxBulletsPerExperience: 2, summaryMaxChars: 420, skillsMaxChars: 330 },
    { maxBulletsPerExperience: 1, summaryMaxChars: 360, skillsMaxChars: 280 },
  ],
};

export const fallbackAsciiFrames: string[] = [
  [
    "  .-''''-.  ",
    " /  .--.  \\ ",
    "|  (o  o)  |",
    "|   .--.   |",
    "|  (____)  |",
    " \\  ----  / ",
    "  '-.__.-'  ",
  ].join('\n'),
  [
    "  .-====-.  ",
    " /  __  _ \\ ",
    "|  /  \\/ \\ |",
    "| |  <>  | |",
    "|  \\_  _/  |",
    " \\   ||   / ",
    "  '._||_.'  ",
  ].join('\n'),
];
