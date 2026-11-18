"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ACCESS_COOKIE,
  ACCESS_TTL_SECONDS,
  createAccessToken,
  isAccessConfigured,
  isCorrectPin,
} from "@/lib/access-token";

export type UnlockState = {
  status: "idle" | "wrong" | "incomplete" | "misconfigured";
  attempt: number;
};

export async function unlock(prev: UnlockState, formData: FormData): Promise<UnlockState> {
  const attempt = prev.attempt + 1;
  const pin = String(formData.get("pin") ?? "").trim();

  if (!isAccessConfigured()) return { status: "misconfigured", attempt };
  if (!/^\d{6}$/.test(pin)) return { status: "incomplete", attempt };

  if (!isCorrectPin(pin)) {
    // Slow down guessing a little.
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { status: "wrong", attempt };
  }

  (await cookies()).set(ACCESS_COOKIE, await createAccessToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TTL_SECONDS,
  });
  redirect("/video");
}
