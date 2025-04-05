// This is a factory function to create session response based on user data
export const createSessionResponse = (userData) => {
  return {
    user: {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      image: userData.image,
      roles: userData.roles
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    userHasAtLeastOneRole: () => true, // This will be ignored in the mock, the real implementation is in the auth.ts
    userHasAllRoles: () => true // This will be ignored in the mock, the real implementation is in the auth.ts
  };
};

// This is a factory function to create JWT token response
export const createJwtResponse = (userData) => {
  return {
    sub: userData.id,
    name: userData.name,
    email: userData.email,
    picture: userData.image,
    roles: userData.roles,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
    jti: "mock-jwt-id-" + Math.random().toString(36).substring(2)
  };
};
