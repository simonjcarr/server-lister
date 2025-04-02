/**
 * Normalizes version strings by removing build identifiers
 * This allows comparison of versions like "2.7.14build2" and "2.7.14"
 * 
 * @param version - Version string to normalize
 * @returns Normalized version string
 */
export function normalizeVersion(version: string): string {
  if (!version) {
    return '';
  }

  // Regex to match version patterns with build identifiers
  // This matches common patterns like:
  // - 2.7.14build2
  // - 1.2.3-beta1
  // - 4.5.6+build789
  // - 7.8.9rc2
  // - 1.2.3.build4
  const versionPattern = /^(\d+(?:\.\d+)*)(?:[.\-+_\s]?|\s*)(?:build|beta|alpha|rc|rev|release|r|b|a)?(\d*).*$/i;
  
  const match = version.match(versionPattern);
  
  if (match) {
    // Return just the numeric version part
    return match[1];
  }
  
  // If no pattern match, return the original version
  return version;
}

/**
 * Compares two software versions, with intelligence to ignore build identifiers
 * 
 * @param installedVersion - The version currently installed on the server
 * @param whitelistedVersion - The version from the whitelist
 * @returns True if versions are considered equivalent
 */
export function areVersionsEquivalent(
  installedVersion: string | null | undefined, 
  whitelistedVersion: string | null | undefined
): boolean {
  // Handle null/undefined cases
  if (!installedVersion || !whitelistedVersion) {
    return false;
  }
  
  // First try exact match
  if (installedVersion === whitelistedVersion) {
    return true;
  }
  
  // Normalize both versions
  const normalizedInstalled = normalizeVersion(installedVersion);
  const normalizedWhitelisted = normalizeVersion(whitelistedVersion);
  
  // Compare normalized versions
  return normalizedInstalled === normalizedWhitelisted;
}
