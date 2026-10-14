"use server";

import { redirect } from "next/navigation";
import { signOutCurrentSession } from "@/server/staff-session";

export async function signOut() {
  await signOutCurrentSession();
  redirect("/staff/login");
}
