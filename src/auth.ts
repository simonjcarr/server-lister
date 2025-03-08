import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    {
      id: "dex", // signIn("my-provider") and will be part of the callback URL
      name: "Login with Dex", // optional, used on the default login page as the button text.
      type: "oidc", // or "oauth" for OAuth 2 providers
      issuer: process.env.OIDC_ISSUER_URL, // to infer the .well-known/openid-configuration URL
      clientId: process.env.AUTH_CLIENT_ID, // from the provider's dashboard
      clientSecret: process.env.AUTH_CLIENT_SECRET, // from the provider's dashboard
    },
  ],
});
