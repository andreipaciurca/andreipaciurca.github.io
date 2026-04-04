/**
 * @module State
 * @description Centralised mutable runtime state.
 * All async work handles (timeouts, animation frames) are tracked here so they
 * can be cleanly cancelled on visibility change or re-render.
 */
import type { AtsReport } from './types.js';

interface AppState {
  renderToken: number;
  activeTimeouts: Set<number>;
  activeAnimationFrames: Set<number>;
  profileAsciiFrames: string[];
  activityMessages: string[];
  isPageVisible: boolean;
  printAtsReport: AtsReport | null;
  resizePrintTimeoutId: number | null;
  launcherTerminalText: string;
  launcherSpeechText: string;
}

export const state: AppState = {
  renderToken: 0,
  activeTimeouts: new Set<number>(),
  activeAnimationFrames: new Set<number>(),
  profileAsciiFrames: [],
  activityMessages: [],
  isPageVisible: !document.hidden,
  printAtsReport: null,
  resizePrintTimeoutId: null,
  launcherTerminalText: '',
  launcherSpeechText: '',
};

export function trackTimeout(callback: () => void, delayMs: number): number {
  const timeoutId = window.setTimeout(function executeTrackedTimeout() {
    state.activeTimeouts.delete(timeoutId);
    callback();
  }, delayMs);
  state.activeTimeouts.add(timeoutId);
  return timeoutId;
}

export function clearActiveTimeouts(): void {
  state.activeTimeouts.forEach(function clearTimeoutEntry(timeoutId) {
    window.clearTimeout(timeoutId);
  });
  state.activeTimeouts.clear();
}

export function trackAnimationFrame(callback: (timestamp: number) => void): number {
  const frameId = window.requestAnimationFrame(function runTrackedFrame(timestamp) {
    state.activeAnimationFrames.delete(frameId);
    callback(timestamp);
  });
  state.activeAnimationFrames.add(frameId);
  return frameId;
}

export function clearActiveAnimationFrames(): void {
  state.activeAnimationFrames.forEach(function clearFrame(frameId) {
    window.cancelAnimationFrame(frameId);
  });
  state.activeAnimationFrames.clear();
}

export function clearActiveAsyncWork(): void {
  clearActiveTimeouts();
  clearActiveAnimationFrames();
}
