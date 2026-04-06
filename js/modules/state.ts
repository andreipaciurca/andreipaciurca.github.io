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

/**
 * Schedules a callback after a delay and tracks it in the application state.
 * @param callback The function to execute.
 * @param delayMs Delay in milliseconds.
 * @returns The numeric timeout ID.
 */
export function trackTimeout(callback: () => void, delayMs: number): number {
  const timeoutId = window.setTimeout(function executeTrackedTimeout() {
    state.activeTimeouts.delete(timeoutId);
    callback();
  }, delayMs);
  state.activeTimeouts.add(timeoutId);
  return timeoutId;
}

/**
 * Cancels all currently active timeouts tracked in the state.
 */
export function clearActiveTimeouts(): void {
  state.activeTimeouts.forEach(function clearTimeoutEntry(timeoutId) {
    window.clearTimeout(timeoutId);
  });
  state.activeTimeouts.clear();
}

/**
 * Schedules an animation frame and tracks it in the application state.
 * @param callback The animation frame callback.
 * @returns The numeric frame ID.
 */
export function trackAnimationFrame(callback: (timestamp: number) => void): number {
  const frameId = window.requestAnimationFrame(function runTrackedFrame(timestamp) {
    state.activeAnimationFrames.delete(frameId);
    callback(timestamp);
  });
  state.activeAnimationFrames.add(frameId);
  return frameId;
}

/**
 * Cancels all currently active animation frames tracked in the state.
 */
export function clearActiveAnimationFrames(): void {
  state.activeAnimationFrames.forEach(function clearFrame(frameId) {
    window.cancelAnimationFrame(frameId);
  });
  state.activeAnimationFrames.clear();
}

/**
 * Clears all active timeouts and animation frames.
 */
export function clearActiveAsyncWork(): void {
  clearActiveTimeouts();
  clearActiveAnimationFrames();
}
