/**
 * Utility functions for checking user roles
 */

/**
 * Check if a user has at least one of the specified roles
 */
export function userHasAtLeastOneRole(userRoles: string[] | undefined, requiredRoles: string[]): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  return userRoles.some(role => requiredRoles.includes(role));
}

/**
 * Check if a user has all of the specified roles
 */
export function userHasAllRoles(userRoles: string[] | undefined, requiredRoles: string[]): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  return requiredRoles.every(role => userRoles.includes(role));
}

/**
 * Throws an error if the user doesn't have at least one of the required roles
 * @param userRoles The user's roles array
 * @param requiredRoles Array of roles to check against
 * @throws Error if the user doesn't have any of the required roles
 */
export function requireAtLeastOneRole(userRoles: string[] | undefined, requiredRoles: string[]): void {
  if (!userHasAtLeastOneRole(userRoles, requiredRoles)) {
    throw new Error("Unauthorized: Insufficient permissions");
  }
}

/**
 * Throws an error if the user doesn't have all of the required roles
 * @param userRoles The user's roles array
 * @param requiredRoles Array of roles that must all be present
 * @throws Error if the user doesn't have all of the required roles
 */
export function requireAllRoles(userRoles: string[] | undefined, requiredRoles: string[]): void {
  if (!userHasAllRoles(userRoles, requiredRoles)) {
    throw new Error("Unauthorized: Missing required permissions");
  }
}
