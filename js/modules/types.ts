/**
 * @module Types
 * @description Shared TypeScript interfaces for all profile data structures.
 * These types are the contract between the pipeline-generated profile-data.js
 * and every module that consumes it.
 */

export interface Contact {
  email: string;
  phone: string;
  linkedinUrl: string;
  githubUrl: string;
}

export interface SkillItem {
  iconClass: string;
  label: string;
}

export interface SkillGroup {
  id: string;
  label: string;
  items: SkillItem[];
}

export interface Experience {
  title: string;
  company: string;
  period: string;
  location: string;
  bullets: string[];
}

export interface EducationEntry {
  title: string;
  details: string;
  extra?: string;
  iconClass: string;
}

export interface Certification {
  title: string;
  issuer: string;
  issued: string;
  expires?: string;
  credentialId?: string;
  iconClass: string;
  skills?: string[];
}

export interface TopBarButtonLabels {
  close: string;
  minimize: string;
  maximize: string;
}

export interface TopBar {
  buttonLabels: TopBarButtonLabels;
  commandCursor: string;
  firstVisitMessage: string;
  commandMessage: string;
  launcherIconClass: string;
  launcherSpeechText: string;
}

export interface PrintResumeConfig {
  maxBulletsPerExperience?: number;
}

export interface ProfileData {
  availabilityMode: 'immediate' | 'notice';
  birthDateIso: string;
  candidateName: string;
  role: string;
  summary: string;
  statusLine: string;
  location: string;
  jobType: string;
  driversLicense: string;
  profileInitials: string;
  profilePictureUrl: string;
  contact: Contact;
  topBar: TopBar;
  activityMessages: string[];
  experiences: Experience[];
  skillGroups: SkillGroup[];
  education: EducationEntry[];
  certifications: Certification[];
  printResume?: PrintResumeConfig;
}

/** Shape returned by buildAtsHeuristicReport */
export interface AtsReport {
  status: 'ready' | 'warning' | 'failed';
  score: number;
  criticalIssues: string[];
  warnings: string[];
}

/** Shape returned by renderPrintResume */
export interface PrintPayload {
  totalWordCount: number;
  summaryLength: number;
  totalBulletCount: number;
  experienceCount: number;
  hasSkills: boolean;
  usedLanguage: string;
}
