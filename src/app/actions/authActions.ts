"use server";

import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "@/auth";

export async function signInAction() {
  await nextAuthSignIn("dex");
}

export async function signOutAction() {
  await nextAuthSignOut();
}
