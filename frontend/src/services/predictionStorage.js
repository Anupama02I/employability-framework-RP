const EMPLOYABILITY_PROFILE_KEY = "employability_profile";

export function saveEmployabilityProfile(employabilityProfile) {
  if (!employabilityProfile || typeof window === "undefined") return;

  sessionStorage.setItem(EMPLOYABILITY_PROFILE_KEY, JSON.stringify(employabilityProfile));
}

export function getSavedEmployabilityProfile() {
  if (typeof window === "undefined") return null;

  const savedProfile = sessionStorage.getItem(EMPLOYABILITY_PROFILE_KEY);
  if (!savedProfile) return null;

  try {
    return JSON.parse(savedProfile);
  } catch {
    clearSavedEmployabilityProfile();
    return null;
  }
}

export function clearSavedEmployabilityProfile() {
  if (typeof window === "undefined") return;

  sessionStorage.removeItem(EMPLOYABILITY_PROFILE_KEY);
}
