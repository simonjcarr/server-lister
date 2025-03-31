import { DefaultSession } from "next-auth";
// JWT import is used in the module declarations below

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's roles. */
      roles: string[];
    } & DefaultSession["user"];
    /** Check if the user has at least one of the specified roles */
    userHasAtLeastOneRole: (roles: string[]) => boolean;
    /** Check if the user has all of the specified roles */
    userHasAllRoles: (roles: string[]) => boolean;
  }

  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface User {
    /** The user's roles. */
    roles?: string[];
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** The user's roles. */
    roles?: string[];
  }
}
