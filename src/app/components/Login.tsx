import { signIn } from "@/auth"

export default function SignIn() {
  return (
    <form
      action={async () => {
        "use server"
        await signIn("dex")
      }}
    >
      <button type="submit">Signin with Dex</button>
    </form>
  )
} 