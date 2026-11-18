"use client";

import { useActionState, useState } from "react";
import { primaryButton } from "@/lib/styles";
import { unlock, type UnlockState } from "./actions";

const PIN_LENGTH = 6;
const initialState: UnlockState = { status: "idle", attempt: 0 };

const messages: Record<UnlockState["status"], string> = {
  idle: "",
  wrong: "That's not it. Try again.",
  incomplete: "Please enter all 6 digits.",
  misconfigured: "The passcode isn't set up yet (ACCESS_PIN is missing).",
};

export function PinForm() {
  const [state, formAction, pending] = useActionState(unlock, initialState);

  return (
    <form action={formAction} className="flex flex-col items-center gap-6">
      {/* Remounts after every attempt: clears the digits and replays the shake. */}
      <PinField key={state.attempt} shake={state.status === "wrong"} pending={pending} />
      <p role="status" aria-live="polite" className="min-h-5 text-sm text-rose">
        {pending ? "" : messages[state.status]}
      </p>
    </form>
  );
}

function PinField({ shake, pending }: { shake: boolean; pending: boolean }) {
  const [pin, setPin] = useState("");
  const [focused, setFocused] = useState(false);
  const complete = pin.length === PIN_LENGTH;

  return (
    <>
      <div className={`relative ${shake ? "animate-shake" : ""}`}>
        <div className="flex gap-2.5" aria-hidden>
          {Array.from({ length: PIN_LENGTH }, (_, i) => {
            const filled = i < pin.length;
            const active = focused && (i === pin.length || (complete && i === PIN_LENGTH - 1));
            return (
              <div
                key={i}
                className={`flex size-12 items-center justify-center rounded-2xl border bg-white/[0.03] backdrop-blur-sm transition-all duration-200 ${
                  active ? "border-rose/70 shadow-[0_0_0_4px_rgb(255_143_171/0.12)]" : filled ? "border-white/25" : "border-white/10"
                }`}
              >
                <span
                  className={`size-2.5 rounded-full bg-ink transition-transform duration-200 ${filled ? "scale-100" : "scale-0"}`}
                />
              </div>
            );
          })}
        </div>
        <input
          name="pin"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          autoFocus
          aria-label="6-digit passcode"
          disabled={pending}
          className="absolute inset-0 h-full w-full cursor-pointer text-base opacity-0"
        />
      </div>
      <button type="submit" disabled={!complete || pending} className={primaryButton}>
        {pending ? "Checking…" : "Enter"}
      </button>
    </>
  );
}
