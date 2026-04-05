/**
 * @module Renderer
 * @description Pure HTML string builders for each resume section.
 * Every function is stateless: takes profile data and returns an HTML string.
 * No DOM access — callers assign the result to innerHTML.
 */
import type { Experience, SkillGroup, EducationEntry, Certification } from './types.js';
import { escapeHtml } from './utils.js';

type Translate = (text: string) => string;

/**
 * Renders the work experience section.
 * @param experiences Array of experience entries.
 * @param translate Translator function.
 * @param expandLabel Text for expand button.
 * @param collapseLabel Text for collapse button.
 * @returns HTML string for the experience list.
 */
export function renderExperienceList(
  experiences: Experience[],
  translate: Translate,
  expandLabel: string,
  collapseLabel: string,
): string {
  return experiences
    .map(function mapExperience(exp) {
      const bulletMarkup = exp.bullets
        .map(function mapBullet(bullet) {
          return `<li>${escapeHtml(translate(bullet))}</li>`;
        })
        .join('');

      return (
        '<article class="experience-card">' +
        '<div class="experience-header">' +
        '<div>' +
        '<div class="experience-meta">' +
        `<span>${escapeHtml(translate(exp.period))}</span>` +
        `<span><i class="fa-solid fa-location-dot" aria-hidden="true"></i> ${escapeHtml(translate(exp.location))}</span>` +
        '</div>' +
        `<h3 class="experience-title">${escapeHtml(translate(exp.title))} · ${escapeHtml(exp.company)}</h3>` +
        '</div>' +
        '<button type="button" class="experience-toggle" aria-expanded="false" ' +
        `data-expand-label="${escapeHtml(translate(expandLabel))}" ` +
        `data-collapse-label="${escapeHtml(translate(collapseLabel))}"` +
        '>' +
        '<span class="experience-toggle-label"></span>' +
        '<i class="fa-solid fa-chevron-down" aria-hidden="true"></i>' +
        '</button>' +
        '</div>' +
        `<div class="experience-content"><ul>${bulletMarkup}</ul></div>` +
        '</article>'
      );
    })
    .join('');
}

/**
 * Renders the skills section, grouped by category.
 * @param skillGroups Array of skill groups.
 * @param translate Translator function.
 * @returns HTML string for the skills groups.
 */
export function renderSkillsGroups(skillGroups: SkillGroup[], translate: Translate): string {
  return skillGroups
    .map(function mapGroup(group, index) {
      const groupClass = `group-${(index % 5) + 1}`;
      const chipMarkup = group.items
        .map(function mapItem(skill) {
          return (
            '<span class="skill-chip">' +
            `<i class="${escapeHtml(skill.iconClass)}" aria-hidden="true"></i>` +
            `<span>${escapeHtml(translate(skill.label))}</span>` +
            '</span>'
          );
        })
        .join('');

      return (
        '<section class="skill-group">' +
        `<h3 class="skill-group-title ${escapeHtml(groupClass)}">${escapeHtml(translate(group.label))}</h3>` +
        `<div class="skill-chip-list">${chipMarkup}</div>` +
        '</section>'
      );
    })
    .join('');
}

/**
 * Renders the education history.
 * @param education Array of education entries.
 * @param translate Translator function.
 * @returns HTML string for the education list.
 */
export function renderEducationList(education: EducationEntry[], translate: Translate): string {
  return education
    .map(function mapEntry(entry) {
      const extra = entry.extra
        ? `<p>${escapeHtml(translate(entry.extra))}</p>`
        : '';
      return (
        '<article class="info-card">' +
        `<i class="${escapeHtml(entry.iconClass)}" aria-hidden="true"></i>` +
        '<div>' +
        `<strong>${escapeHtml(translate(entry.title))}</strong>` +
        `<p>${escapeHtml(translate(entry.details))}</p>` +
        extra +
        '</div>' +
        '</article>'
      );
    })
    .join('');
}

/**
 * Renders the professional certifications.
 * @param certifications Array of certifications.
 * @param translate Translator function.
 * @returns HTML string for the certifications list.
 */
export function renderCertificationsList(
  certifications: Certification[],
  translate: Translate,
): string {
  return certifications
    .map(function mapCert(cert) {
      const skillTagMarkup = (cert.skills ?? [])
        .map(function mapTag(tag) {
          return `<span class="cert-skill-tag">${escapeHtml(translate(tag))}</span>`;
        })
        .join('');

      const expiresLine = cert.expires
        ? `<p class="cert-meta-line">${escapeHtml(translate(cert.expires))}</p>`
        : '';
      const credentialIdLine = cert.credentialId
        ? `<p class="cert-meta-line">${escapeHtml(translate(cert.credentialId))}</p>`
        : '';

      return (
        '<article class="info-card cert-card">' +
        `<i class="${escapeHtml(cert.iconClass)}" aria-hidden="true"></i>` +
        '<div>' +
        `<strong>${escapeHtml(translate(cert.title))}</strong>` +
        `<p class="cert-meta-line">${escapeHtml(translate(cert.issuer))}</p>` +
        `<p class="cert-meta-line">${escapeHtml(translate(cert.issued))}</p>` +
        expiresLine +
        credentialIdLine +
        (skillTagMarkup ? `<div class="cert-skill-row">${skillTagMarkup}</div>` : '') +
        '</div>' +
        '</article>'
      );
    })
    .join('');
}
