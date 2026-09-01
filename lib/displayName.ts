/**
 * Single source of truth for resolving a user's display name.
 *
 * Fallback chain (first non-empty wins):
 *   1. profiles.display_name (set by the user in Profile)
 *   2. user_metadata.full_name (e.g. from social login)
 *   3. user_metadata.name
 *   4. email prefix (before the @)
 *   5. DEFAULT_DISPLAY_NAME
 *
 * Used by both Dashboard and Profile so every screen shows the same name.
 */

export const DEFAULT_DISPLAY_NAME = 'Lumio Learner';

export function resolveDisplayName(
  profileDisplayName: string | null | undefined,
  metadataFullName?: string | null,
  metadataName?: string | null,
  email?: string | null
): string {
  if (profileDisplayName && profileDisplayName.trim().length > 0) {
    return profileDisplayName;
  }
  if (metadataFullName && metadataFullName.trim().length > 0) {
    return metadataFullName;
  }
  if (metadataName && metadataName.trim().length > 0) {
    return metadataName;
  }
  if (email && email.trim().length > 0) {
    const prefix = email.split('@')[0].trim();
    if (prefix.length > 0) {
      return prefix;
    }
  }
  return DEFAULT_DISPLAY_NAME;
}
