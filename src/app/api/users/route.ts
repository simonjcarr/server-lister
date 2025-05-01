import { NextResponse } from "next/server";
import { getAllUsers } from "@/app/actions/users/userActions";

export async function GET() {
  const users = await getAllUsers();
  // Only return id and name/email for assignment
  const safeUsers = Array.isArray(users)
    ? users.map((u) => ({ id: u.id, name: u.name || u.email || u.id }))
    : [];
  return NextResponse.json(safeUsers);
}
