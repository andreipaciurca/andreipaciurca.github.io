import { dom } from './dom.js';
import { 
  TERMINAL_CONFIG, 
  COMMANDS, 
  RESUME_FLAGS, 
  VIRTUAL_FILES 
} from './constants.js';

/**
 * @module Terminal
 * @description Interactive Terminal command processor with inline history.
 */

/**
 * Initializes the interactive terminal and binds form submission events.
 */
export function initializeTerminal(): void {
  const { 
    terminalCommandForm, 
    terminalInput, 
    terminalHistory 
  } = dom;

  if (!terminalCommandForm || !terminalInput || !terminalHistory) return;

  // Focus input on history click
  terminalHistory.addEventListener('click', () => {
    terminalInput.focus();
  });

  // Handle Command Submission
  terminalCommandForm.addEventListener('submit', (e: SubmitEvent) => {
    e.preventDefault();
    const command = terminalInput.value.trim();
    if (!command) return;

    // Echo command
    appendLine(`$ ${command}`, 'command-echo');
    
    processCommand(command);
    
    terminalInput.value = '';
    
    // Scroll to bottom
    setTimeout(() => {
      terminalHistory.scrollTop = terminalHistory.scrollHeight;
    }, 10);
  });

  function appendLine(text: string, className?: string) {
    const p = document.createElement('p');
    p.className = 'terminal-line' + (className ? ` ${className}` : '');
    p.textContent = text;
    terminalHistory.appendChild(p);
    
    // Auto-scroll
    terminalHistory.scrollTop = terminalHistory.scrollHeight;
  }

  function processCommand(rawCommand: string) {
    const args = rawCommand.split(/\s+/);
    let cmd = args[0].toLowerCase();
    let flag = args[1]?.toLowerCase();
    let subflag = args[2]?.toLowerCase();

    // Support flags without "resume" prefix
    if (cmd.startsWith('-')) {
      subflag = args[1]?.toLowerCase();
      flag = cmd;
      cmd = COMMANDS.RESUME;
    } else if (cmd !== COMMANDS.RESUME && !Object.values(COMMANDS).includes(cmd as any)) {
      // Just a word, maybe it's a command like "about" instead of "--about"
      const potentialFlag = `--${cmd}`;
      const foundFlag = RESUME_FLAGS.find(f => f.long === potentialFlag);
      if (foundFlag) {
        subflag = args[1]?.toLowerCase();
        flag = potentialFlag;
        cmd = COMMANDS.RESUME;
      }
    }

    if (cmd === COMMANDS.HELP || cmd === '--help' || flag === '--help' || flag === '-h') {
      appendLine(getHelpMessage(), 'output-text');
      return;
    }

    if (cmd === COMMANDS.RESUME) {
      if (!flag) {
        appendLine(getHelpMessage(), 'output-text');
        return;
      }

      if (flag === '--right' || flag === '-r') {
        if (subflag === 'on') {
          (window as any).toggleSecurityProtection?.(true);
          appendLine('Security protection enabled.', 'output-text');
        } else if (subflag === 'off') {
          (window as any).toggleSecurityProtection?.(false);
          appendLine('Security protection disabled.', 'output-text');
        } else {
          appendLine(`Usage: ${rawCommand.startsWith(COMMANDS.RESUME) ? COMMANDS.RESUME + ' ' : ''}${flag} [on|off]`, 'error-text');
        }
        return;
      }

      const matchingFlag = RESUME_FLAGS.find(f => f.long === flag || f.short === flag);
      if (matchingFlag && matchingFlag.action) {
        appendLine(matchingFlag.action(), 'output-text');
      } else if (matchingFlag) {
        // Flag exists but has no action (like --help which is handled above)
        if (matchingFlag.long === '--help') {
          appendLine(getHelpMessage(), 'output-text');
        }
      } else {
        appendLine(`Unknown argument: ${flag || ''}\nType 'help' for available commands.`, 'error-text');
      }
      return;
    }

    if (cmd === COMMANDS.CLEAR) {
      terminalHistory.innerHTML = '';
      
      const welcomeLine = document.createElement('p');
      welcomeLine.className = 'terminal-line welcome-line';
      welcomeLine.textContent = TERMINAL_CONFIG.WELCOME_MESSAGE;
      terminalHistory.appendChild(welcomeLine);

      const initialLine = document.createElement('p');
      initialLine.className = 'terminal-line initial-command';
      initialLine.textContent = TERMINAL_CONFIG.INITIAL_COMMAND;
      terminalHistory.appendChild(initialLine);
      return;
    }

    if (cmd === COMMANDS.LS) {
      appendLine(VIRTUAL_FILES.join('  '), 'output-text');
      return;
    }

    if (cmd === COMMANDS.CAT && args[1]) {
       const file = args[1].toLowerCase();
       const matchingFlag = RESUME_FLAGS.find(f => file.includes(f.long.replace('--', '')));
       
       if (matchingFlag && matchingFlag.action) {
         appendLine(matchingFlag.action(), 'output-text');
         return;
       }
       
       if (file === 'photo.jpg') {
         const photoFlag = RESUME_FLAGS.find(f => f.long === '--photo');
         if (photoFlag && photoFlag.action) {
           appendLine(photoFlag.action(), 'output-text');
           return;
         }
       }

       appendLine(`cat: ${args[1]}: No such file or directory`, 'error-text');
       return;
    }

    appendLine(`Command not found: ${cmd}\n\nHint: Try '${COMMANDS.RESUME} --help' to see what I can do.`, 'error-text');
  }

  function getHelpMessage(): string {
    const flagsHelp = RESUME_FLAGS
      .filter(f => !f.hidden)
      .map(f => `  ${f.long.padEnd(16)}, ${f.short.padEnd(4)} ${f.description}`)
      .join('\n');

    return `
${TERMINAL_CONFIG.HELP_HEADER}

Usage: ${COMMANDS.RESUME} [arguments] or [argument]

Arguments:
${flagsHelp}

Other Commands:
  ${COMMANDS.LS.padEnd(18)} List virtual profile files
  ${`${COMMANDS.CAT} [file]`.padEnd(18)} Display content of a virtual file
  ${COMMANDS.CLEAR.padEnd(18)} Clear terminal history
`;
  }
}
