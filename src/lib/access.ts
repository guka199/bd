import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { ACCESS_COOKIE, verifyAccessToken } from "./access-token";

/** Sends anyone without a valid access cookie back to the PIN page. */
export async function requireAccess(): Promise<void> {
  // The check reads the current time (token expiry), so it must only ever run on a real request.
  await connection();
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!(await verifyAccessToken(token))) redirect("/");
}

/**
 * Renders its children only for visitors who entered the right PIN.
 * The proxy already blocks these routes; this is the second, in-page check.
 * It reads cookies, so it must sit inside a <Suspense> boundary.
 */
export async function AccessGate({ children }: { children: ReactNode }) {
  await requireAccess();
  return children;
}
