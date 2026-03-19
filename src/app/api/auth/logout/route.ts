import { NextResponse } from "next/server";
import { authCookieName } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ data: true });
  res.cookies.set(authCookieName, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}
