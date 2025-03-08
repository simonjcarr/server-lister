'use client';

import { Button } from "antd"
import { signInAction, signOutAction } from "@/app/actions/authActions";

export function SignIn() {
  return (
    <form action={signInAction}>
      <Button type="primary" htmlType="submit">Sign In</Button>
    </form>
  )
} 

export function SignOut() {
  return (
    <form action={signOutAction}>
      <Button type="primary" htmlType="submit">Sign Out</Button>
    </form>
  )
}