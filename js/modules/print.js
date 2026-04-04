
import { printConfig, languageConfig } from './config.js';
import { state } from './state.js';
import { dom } from './dom.js';
import { profileData } from '../../profile-data.js';
import {
  escapeHtml,
  truncateAtWordBoundary,
  countWords,
  extractPublicPath,
  toSafeExternalUrl,
  isLikelyEmailAddress,
  isLikelyPhoneNumber
} from './utils.js';
import { normalizeLanguage, getBestLocalizedText } from './translation.js';

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

export function renderPrintResume(options) {
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

export function measurePrintResumeHeight() {
  if (!dom.printResumeRoot) {
    return 0;
  }
  dom.printResumeRoot.classList.add("measure-mode");
  const measuredHeight = dom.printResumeRoot.scrollHeight;
  dom.printResumeRoot.classList.remove("measure-mode");
  return measuredHeight;
}

export function buildAtsHeuristicReport(printPayload, fitsOnePage) {
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

export function optimizePrintResumeLayout() {
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
  return report;
}
