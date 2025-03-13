import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's roles. */
      roles: any[];
    } & DefaultSession["user"];
  }

  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface User {
    /** The user's roles. */
    roles?: any[];
  }
}
