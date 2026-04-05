import { profileData } from '../../profile-data.js';
/**
 * @module Constants
 * @description Centralized constants and command definitions for the Terminal.
 */
export const TERMINAL_CONFIG = {
    VERSION: `${new Date().getFullYear()}.0.1`,
    WELCOME_MESSAGE: 'Welcome to my 127.0.0.1',
    INITIAL_COMMAND: '$ code session --agent=viewer --profile=andrei',
    HELP_HEADER: `Andrei-Alexandru Paciurca | Terminal Resume CLI v${new Date().getFullYear()}.0.1`,
};
export const COMMANDS = {
    RESUME: 'resume',
    HELP: 'help',
    CLEAR: 'clear',
    LS: 'ls',
    CAT: 'cat',
};
export const RESUME_FLAGS = [
    {
        long: '--about',
        short: '-a',
        description: 'Show a summary of who I am',
        action: () => profileData.summary
    },
    {
        long: '--experience',
        short: '-e',
        description: 'List professional experience',
        action: () => formatExperiences()
    },
    {
        long: '--skills',
        short: '-s',
        description: 'Show technical skill groups',
        action: () => formatSkills()
    },
    {
        long: '--education',
        short: '-edu',
        description: 'Show educational background',
        action: () => formatEducation()
    },
    {
        long: '--contact',
        short: '-c',
        description: 'Get contact information',
        action: () => formatContact()
    },
    {
        long: '--linkedin',
        short: '-l',
        description: 'Open LinkedIn profile',
        action: () => {
            window.open(profileData.contact.linkedinUrl, '_blank');
            return `Opening LinkedIn: ${profileData.contact.linkedinUrl}`;
        }
    },
    {
        long: '--github',
        short: '-g',
        description: 'Open GitHub profile',
        action: () => {
            window.open(profileData.contact.githubUrl, '_blank');
            return `Opening GitHub: ${profileData.contact.githubUrl}`;
        }
    },
    {
        long: '--email',
        short: '-m',
        description: 'Send an email',
        action: () => {
            window.location.href = `mailto:${profileData.contact.email}`;
            return `Opening mail client for: ${profileData.contact.email}`;
        }
    },
    {
        long: '--photo',
        short: '-p',
        description: 'Show profile photo',
        action: () => {
            const asciiPhoto = `       .---.
      /     \\
      | () () |
       \\  ^  /
        |||||
        |||||
`;
            return `${asciiPhoto}\nOriginal photo present at: ${window.location.origin}/${profileData.profilePictureUrl}`;
        }
    },
    {
        long: '--help',
        short: '-h',
        description: 'Show this help message'
    },
    {
        long: '--right',
        short: '-r',
        description: 'Toggle right-click protection',
        hidden: true
    }
];
export const VIRTUAL_FILES = [
    'experience.md',
    'skills.md',
    'education.md',
    'contact.txt',
    'about_me.txt',
    'photo.jpg'
];
// Helper formatters (moved from terminal.ts to be reusable or at least organized)
function formatExperiences() {
    return profileData.experiences.map(exp => `${exp.company} | ${exp.title}\n${exp.period}\n${exp.location}\n\n${exp.bullets.map(b => `• ${b}`).join('\n')}`).join('\n\n' + '-'.repeat(40) + '\n\n');
}
function formatSkills() {
    return profileData.skillGroups.map(group => `[ ${group.label} ]\n${group.items.map(s => s.label).join(', ')}`).join('\n\n');
}
function formatEducation() {
    return profileData.education.map(edu => `${edu.title}\n${edu.details}\n${edu.extra || ''}`).join('\n\n');
}
function formatContact() {
    return `Email: ${profileData.contact.email}\nPhone: ${profileData.contact.phone}\nLinkedIn: ${profileData.contact.linkedinUrl}\nGitHub: ${profileData.contact.githubUrl}`;
}
