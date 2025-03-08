import { signIn, signOut } from "@/auth"
import { Button } from "antd"

export function SignIn() {
  return (
    <form
      action={async () => {
        "use server"
        await signIn("dex")
      }}
    >
      <Button type="primary" htmlType="submit">Signin</Button>
    </form>
  )
} 

export function SignOut() {
  return (
    <form
      action={async () => {
        "use server"
        await signOut()
      }}
    >
      <Button type="primary" htmlType="submit">Sign Out</Button>
    </form>
  )
}