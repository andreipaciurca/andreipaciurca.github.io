/**
 * @module Print
 * @description ATS-optimised single-page print layout.
 * Iterates through strategy steps (defined in config) to reduce content until
 * everything fits within pageContentHeightPx. Produces a heuristic ATS score
 * (0–100) for recruiter guidance before printing.
 */
import { printConfig } from './config.js';
import { state } from './state.js';
import { dom } from './dom.js';
import { profileData } from '../../profile-data.js';
import type { AtsReport, PrintPayload } from './types.js';
import {
  escapeHtml,
  truncateAtWordBoundary,
  countWords,
  extractPublicPath,
  toSafeExternalUrl,
  isLikelyEmailAddress,
  isLikelyPhoneNumber,
} from './utils.js';

interface PrintResumeOptions {
  maxBulletsPerExperience?: number;
  summaryMaxChars?: number;
  skillsMaxChars?: number;
}

interface PrintResumeData {
  printContactLine: string;
  summaryText: string;
  flattenedSkills: string;
  experienceEntries: Array<{
    title: string;
    company: string;
    period: string;
    location: string;
    bullets: string[];
  }>;
  educationEntries: typeof profileData.education;
  certificationEntries: typeof profileData.certifications;
}

function buildPrintResumePayload(options: PrintResumeOptions): PrintResumeData {
  const maxBullets = Math.max(1, options.maxBulletsPerExperience ?? 1);

  const linkedinPath = extractPublicPath(toSafeExternalUrl(profileData.contact.linkedinUrl));
  const githubPath   = extractPublicPath(toSafeExternalUrl(profileData.contact.githubUrl));
  const printContactLine = [
    profileData.location,
    profileData.contact.email,
    profileData.contact.phone,
    linkedinPath,
    githubPath,
  ].filter(Boolean).join(' | ');

  const flattenedSkills = truncateAtWordBoundary(
    profileData.skillGroups
      .flatMap(function flattenGroup(groupEntry) {
        return groupEntry.items.map(function extractLabel(skill) { return skill.label; });
      })
      .join(', '),
    options.skillsMaxChars ?? 420,
  );

  const summaryText = truncateAtWordBoundary(profileData.summary, options.summaryMaxChars ?? 600);

  const experienceEntries = profileData.experiences.map(function mapExperience(exp) {
    return {
      title:    exp.title,
      company:  exp.company,
      period:   exp.period,
      location: exp.location,
      bullets:  exp.bullets.slice(0, maxBullets),
    };
  });

  return {
    printContactLine,
    summaryText,
    flattenedSkills,
    experienceEntries,
    educationEntries:      profileData.education,
    certificationEntries:  profileData.certifications,
  };
}

/**
 * Redraws the hidden print-optimised container and calculates the ATS score.
 * This is called before printing to ensure content fits the single-page target.
 * @param options Overrides for truncation and bullet limits.
 * @returns An ATS report with the heuristic score and word counts.
 */
export function renderPrintResume(options: PrintResumeOptions = {}): PrintPayload {
  const printResumeSettings = profileData.printResume ?? {};
  const resolvedOptions: PrintResumeOptions = Object.assign(
    {
      maxBulletsPerExperience: printResumeSettings.maxBulletsPerExperience ?? 3,
      summaryMaxChars: 520,
      skillsMaxChars: 380,
    },
    options,
  );

  const payload = buildPrintResumePayload(resolvedOptions);

  const printExperienceMarkup = payload.experienceEntries
    .map(function mapExperience(exp) {
      const bulletMarkup = exp.bullets
        .map(function mapBullet(bullet) { return `<li>${escapeHtml(bullet)}</li>`; })
        .join('');
      return (
        '<article class="print-item">' +
        '<div class="print-item-head">' +
        `<strong>${escapeHtml(exp.company)} | ${escapeHtml(exp.location)}</strong>` +
        `<span>${escapeHtml(exp.period)}</span>` +
        '</div>' +
        `<p class="print-role-line">${escapeHtml(exp.title)}</p>` +
        `<ul>${bulletMarkup}</ul>` +
        '</article>'
      );
    })
    .join('');

  const printEducationMarkup = payload.educationEntries
    .map(function mapEdu(entry) {
      const extra = entry.extra ? `<br>${escapeHtml(entry.extra)}` : '';
      return `<p><strong>${escapeHtml(entry.title)}</strong><br>${escapeHtml(entry.details)}${extra}</p>`;
    })
    .join('');

  const printCertMarkup = payload.certificationEntries
    .map(function mapCert(cert) {
      return `<p>${escapeHtml(cert.title)} | ${escapeHtml(cert.issuer)} | ${escapeHtml(cert.issued)}</p>`;
    })
    .join('');

  dom.printName.textContent          = profileData.candidateName;
  dom.printContactLine.textContent   = payload.printContactLine;
  dom.printSummary.textContent       = payload.summaryText;
  dom.printSkills.textContent        = payload.flattenedSkills;
  dom.printExperienceList.innerHTML  = printExperienceMarkup;
  dom.printEducationList.innerHTML   = printEducationMarkup;
  dom.printCertificationList.innerHTML = printCertMarkup;

  const resumeTextBlob = [
    profileData.candidateName,
    payload.printContactLine,
    payload.summaryText,
    payload.flattenedSkills,
    payload.experienceEntries.map(e => `${e.title} ${e.company} ${e.period} ${e.location}`).join(' '),
    payload.experienceEntries.flatMap(e => e.bullets).join(' '),
    payload.educationEntries.map(e => `${e.title} ${e.details} ${e.extra ?? ''}`).join(' '),
    payload.certificationEntries.map(c => `${c.title} ${c.issuer} ${c.issued}`).join(' '),
  ].join(' ');

  return {
    totalWordCount: countWords(resumeTextBlob),
    summaryLength:  payload.summaryText.length,
    totalBulletCount: payload.experienceEntries.reduce((acc, e) => acc + e.bullets.length, 0),
    experienceCount:  payload.experienceEntries.length,
    hasSkills:        Boolean(payload.flattenedSkills),
    usedLanguage:     'en',
  };
}

export function measurePrintResumeHeight(): number {
  if (!dom.printResumeRoot) return 0;
  dom.printResumeRoot.classList.add('measure-mode');
  const height = dom.printResumeRoot.scrollHeight;
  dom.printResumeRoot.classList.remove('measure-mode');
  return height;
}

export function buildAtsHeuristicReport(printPayload: PrintPayload, fitsOnePage: boolean): AtsReport {
  let score = 100;
  const criticalIssues: string[] = [];
  const warnings: string[] = [];

  if (!isLikelyEmailAddress(profileData.contact.email)) {
    criticalIssues.push('Email is missing or invalid.');
    score -= 18;
  }
  if (!isLikelyPhoneNumber(profileData.contact.phone)) {
    criticalIssues.push('Phone number is missing or invalid.');
    score -= 18;
  }
  if (printPayload.experienceCount < 2) {
    warnings.push('At least two experience entries are recommended for ATS confidence.');
    score -= 8;
  }
  if (printPayload.totalBulletCount < 4) {
    warnings.push('Low bullet count may reduce keyword coverage.');
    score -= 8;
  }
  if (printPayload.summaryLength < 80 || printPayload.summaryLength > 550) {
    warnings.push('Summary length is outside the recommended range.');
    score -= 6;
  }
  if (printPayload.totalWordCount < 180 || printPayload.totalWordCount > 900) {
    warnings.push('Total resume word count is outside typical one-page ATS targets.');
    score -= 10;
  }
  if (!printPayload.hasSkills) {
    criticalIssues.push('Skills section is empty.');
    score -= 14;
  }
  if (!fitsOnePage) {
    criticalIssues.push('Resume overflows one page with current content.');
    score -= 20;
  }

  const normalizedScore = Math.max(0, Math.min(100, score));
  const status: AtsReport['status'] = criticalIssues.length
    ? 'failed'
    : warnings.length
      ? 'warning'
      : 'ready';

  return { status, score: normalizedScore, criticalIssues, warnings };
}

/**
 * Automatically adjusts content density (strategy steps) to fit the resume on one page.
 * @returns The final ATS report after optimization.
 */
export function optimizePrintResumeLayout(): AtsReport {
  const printResumeSettings = profileData.printResume ?? {};
  let bestPayload: PrintPayload | null = null;
  let bestFit = false;

  for (const step of printConfig.strategySteps) {
    const payload = renderPrintResume({
      maxBulletsPerExperience: Math.min(
        printResumeSettings.maxBulletsPerExperience ?? 3,
        step.maxBulletsPerExperience,
      ),
      summaryMaxChars: step.summaryMaxChars,
      skillsMaxChars:  step.skillsMaxChars,
    });
    const fitsOnePage = measurePrintResumeHeight() <= printConfig.pageContentHeightPx;
    bestPayload = payload;
    bestFit     = fitsOnePage;
    if (fitsOnePage) break;
  }

  const report = buildAtsHeuristicReport(bestPayload!, bestFit);
  state.printAtsReport = report;
  return report;
}
