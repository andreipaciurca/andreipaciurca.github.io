
import { languageConfig, translationConfig, uiText } from './config.js';
import { state, trackTimeout } from './state.js';
import { resumeI18n } from '../../i18n-data.js';
import { profileData } from '../../profile-data.js';

export function normalizeLanguage(language) {
  return language === "ro" ? "ro" : languageConfig.sourceLanguage;
}

function getLanguageDictionary(language) {
  const resolvedLanguage = normalizeLanguage(language);
  const dictionary = resumeI18n[resolvedLanguage];
  if (!dictionary || typeof dictionary !== "object") {
    return {};
  }
  return dictionary;
}

export function localizeText(sourceText, language) {
  if (typeof sourceText !== "string") {
    return sourceText;
  }

  const resolvedLanguage = normalizeLanguage(language);
  if (resolvedLanguage === languageConfig.sourceLanguage) {
    return sourceText;
  }

  const dictionary = getLanguageDictionary(resolvedLanguage);
  return dictionary[sourceText] || sourceText;
}

function getTranslationCacheKey(language, sourceText) {
  return normalizeLanguage(language) + "::" + String(sourceText || "").trim();
}

export function loadTranslationCache() {
  try {
    const rawValue = window.localStorage.getItem(translationConfig.cacheKey);
    if (!rawValue) {
      return;
    }

    const parsed = JSON.parse(rawValue);
    Object.keys(parsed).forEach(function loadEntry(cacheKey) {
      if (typeof parsed[cacheKey] === "string") {
        state.translationCache.set(cacheKey, parsed[cacheKey]);
      }
    });
  } catch (error) {
    // Ignore malformed cache payloads.
  }
}

export function persistTranslationCache() {
  if (state.cachePersistTimeoutId) {
    window.clearTimeout(state.cachePersistTimeoutId);
  }

  state.cachePersistTimeoutId = window.setTimeout(function writeTranslationCache() {
    const serialized = {};
    state.translationCache.forEach(function serializeEntry(value, key) {
      serialized[key] = value;
    });

    try {
      window.localStorage.setItem(translationConfig.cacheKey, JSON.stringify(serialized));
    } catch (error) {
      // Ignore storage failures.
    }
  }, 220);
}

export function getBestLocalizedText(sourceText, language) {
  if (typeof sourceText !== "string") {
    return sourceText;
  }

  const resolvedLanguage = normalizeLanguage(language);
  if (resolvedLanguage === languageConfig.sourceLanguage) {
    return sourceText;
  }

  const cacheKey = getTranslationCacheKey(resolvedLanguage, sourceText);
  if (state.translationCache.has(cacheKey)) {
    return state.translationCache.get(cacheKey);
  }

  return localizeText(sourceText, resolvedLanguage);
}

export async function requestExternalTranslation(sourceText, targetLanguage) {
  const resolvedLanguage = normalizeLanguage(targetLanguage);
  if (!sourceText || resolvedLanguage === languageConfig.sourceLanguage) {
    return sourceText;
  }

  const trimmedText = String(sourceText).trim();
  if (!trimmedText) {
    return sourceText;
  }

  const cacheKey = getTranslationCacheKey(resolvedLanguage, trimmedText);
  if (state.translationCache.has(cacheKey)) {
    return state.translationCache.get(cacheKey);
  }

  const requestUrl = translationConfig.endpoint
    .replace("{text}", encodeeURIComponent(trimmedText))
    .replace("{source}", encodeeURIComponent(languageConfig.sourceLanguage))
    .replace("{target}", encodeeURIComponent(resolvedLanguage));

  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeoutId = controller
    ? window.setTimeout(function abortTranslationRequest() {
        controller.abort();
      }, translationConfig.timeoutMs)
    : null;

  try {
    const response = await fetch(requestUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller ? controller.signal : undefined
    });

    if (!response.ok) {
      throw new Error("External translation request failed.");
    }

    const payload = await response.json();
    const translatedText =
      payload &&
      payload.responseData &&
      typeof payload.responseData.translatedText === "string"
        ? payload.responseData.translatedText.trim()
        : "";

    if (!translatedText) {
      throw new Error("External translation response was empty.");
    }

    state.translationCache.set(cacheKey, translatedText);
    persistTranslationCache();
    return translatedText;
  } catch (error) {
    // Fallback to local dictionary when API translation is unavailable.
    return localizeText(sourceText, resolvedLanguage);
  } finally {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
  }
}

export async function translateBatchWithExternalApi(sourceTextList, targetLanguage) {
  const resolvedLanguage = normalizeLanguage(targetLanguage);
  if (resolvedLanguage === languageConfig.sourceLanguage) {
    return;
  }

  const uniqueSourceText = Array.from(
    new Set(
      sourceTextList.filter(function keepText(entry) {
        return typeof entry === "string" && entry.trim();
      })
    )
  );

  const uncachedText = uniqueSourceText.filter(function keepUncached(entry) {
    return !state.translationCache.has(getTranslationCacheKey(resolvedLanguage, entry));
  });

  for (
    let index = 0;
    index < uncachedText.length;
    index += translationConfig.requestChunkSize
  ) {
    const chunk = uncachedText.slice(index, index + translationConfig.requestChunkSize);
    await Promise.all(
      chunk.map(function translateEntry(entry) {
        return requestExternalTranslation(entry, resolvedLanguage);
      })
    );
  }
}

export function collectTranslatableStrings() {
  const bucket = [];

  Object.keys(uiText).forEach(function addUiText(key) {
    bucket.push(uiText[key]);
  });

  bucket.push("Switch to Romanian");
  bucket.push("Switch to English");
  bucket.push(profileData.topBar.firstVisitMessage);
  bucket.push(profileData.topBar.commandMessage);
  bucket.push(profileData.topBar.launcherSpeechText);
  bucket.push(profileData.statusLine);
  bucket.push(profileData.role);
  bucket.push(profileData.summary);
  bucket.push(profileData.location);
  bucket.push(profileData.jobType);
  bucket.push(profileData.driversLicense);
  bucket.push.apply(bucket, profileData.activityMessages);

  profileData.skillGroups.forEach(function processGroup(groupEntry) {
    bucket.push(groupEntry.label);
    groupEntry.items.forEach(function processSkill(skill) {
      bucket.push(skill.label);
    });
  });

  profileData.experiences.forEach(function processExperience(experienceEntry) {
    bucket.push(experienceEntry.title);
    bucket.push(experienceEntry.period);
    bucket.push(experienceEntry.location);
    experienceEntry.bullets.forEach(function processBullet(bullet) {
      bucket.push(bullet);
    });
  });

  profileData.education.forEach(function processEducation(educationEntry) {
    bucket.push(educationEntry.title);
    bucket.push(educationEntry.details);
    bucket.push(educationEntry.extra);
  });

  profileData.certifications.forEach(function processCertification(certificationEntry) {
    bucket.push(certificationEntry.title);
    bucket.push(certificationEntry.issuer);
    bucket.push(certificationEntry.issued);
    bucket.push(certificationEntry.expires || "");
    bucket.push(certificationEntry.credentialId || "");
    (certificationEntry.skills || []).forEach(function processSkillTag(skillTag) {
      bucket.push(skillTag);
    });
  });

  return bucket;
}

export function warmUpRomanianTranslations() {
  if (state.translationWarmupStarted) {
    return;
  }
  state.translationWarmupStarted = true;

  trackTimeout(function startWarmup() {
    translateBatchWithExternalApi(collectTranslatableStrings(), "ro").catch(function ignoreError() {
      // Ignore warm-up failures; runtime translation still retries on demand.
    });
  }, 480);
}
