import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set("center_role", "", { maxAge: 0, path: "/" });
  res.cookies.set("center_uid", "", { maxAge: 0, path: "/" });
  return res;
}
