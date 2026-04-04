
import { languageConfig } from './config.js';

export const state = {
  language: languageConfig.defaultLanguage,
  renderToken: 0,
  activeTimeouts: new Set(),
  activeAnimationFrames: new Set(),
  profileAsciiFrames: [],
  localizedActivityMessages: [],
  isPageVisible: !document.hidden,
  printAtsReport: null,
  resizePrintTimeoutId: null,
  translationCache: new Map(),
  cachePersistTimeoutId: null,
  translationWarmupStarted: false,
  launcherTerminalText: "",
  launcherSpeechText: ""
};

export function trackTimeout(callback, delayMs) {
  const timeoutId = window.setTimeout(function executeTrackedTimeout() {
    state.activeTimeouts.delete(timeoutId);
    callback();
  }, delayMs);
  state.activeTimeouts.add(timeoutId);
  return timeoutId;
}

export function clearActiveTimeouts() {
  state.activeTimeouts.forEach(function clearTimeoutEntry(timeoutId) {
    window.clearTimeout(timeoutId);
  });
  state.activeTimeouts.clear();
}

export function trackAnimationFrame(callback) {
  const frameId = window.requestAnimationFrame(function runTrackedFrame(timestamp) {
    state.activeAnimationFrames.delete(frameId);
    callback(timestamp);
  });
  state.activeAnimationFrames.add(frameId);
  return frameId;
}

export function clearActiveAnimationFrames() {
  state.activeAnimationFrames.forEach(function clearFrame(frameId) {
    window.cancelAnimationFrame(frameId);
  });
  state.activeAnimationFrames.clear();
}

export function clearActiveAsyncWork() {
  clearActiveTimeouts();
  clearActiveAnimationFrames();
}
