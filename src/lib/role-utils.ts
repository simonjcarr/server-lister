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
