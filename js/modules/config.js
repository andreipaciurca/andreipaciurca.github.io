/**
 * @module Config
 * @description Centralized configuration constants for the resume site.
 */

export const uiText = {
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

export const languageConfig = {
  sourceLanguage: "en",
  defaultLanguage: "en"
};

export const translationConfig = {
  cacheKey: "terminal_resume_translation_cache_v3",
  endpoint:
    "https://api.mymemory.translated.net/get?q={text}&langpair={source}|{target}",
  requestChunkSize: 6,
  timeoutMs: 6000
};

export const printConfig = {
  pageContentHeightPx: 970,
  strategySteps: [
    { maxBulletsPerExperience: 2, summaryMaxChars: 520, skillsMaxChars: 380 },
    { maxBulletsPerExperience: 2, summaryMaxChars: 420, skillsMaxChars: 330 },
    { maxBulletsPerExperience: 1, summaryMaxChars: 360, skillsMaxChars: 280 },
    { maxBulletsPerExperience: 1, summaryMaxChars: 300, skillsMaxChars: 230 }
  ]
};

export const fallbackAsciiFrames = [
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
