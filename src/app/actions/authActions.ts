"use server";

import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "@/auth";

export async function signInAction(formData: FormData) {
  await nextAuthSignIn("dex");
}

export async function signOutAction(formData: FormData) {
  await nextAuthSignOut();
}
