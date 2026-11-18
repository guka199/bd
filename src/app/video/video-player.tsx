"use client";

import Link from "next/link";
import { useState } from "react";
import { eyebrow, primaryButton, skeleton } from "@/lib/styles";
import { readSession, useHydrated, writeSession } from "@/lib/use-hydrated";

const FINISHED_KEY = "eve-video-finished";

export function VideoPlayer({ src }: { src: string }) {
  // Render the player only in the browser so a finished video survives a page reload.
  const hydrated = useHydrated();
  if (!hydrated) return <div className={`${skeleton} aspect-video`} />;
  return <Player src={src} />;
}

function Player({ src }: { src: string }) {
  const [finished, setFinished] = useState(() => readSession(FINISHED_KEY) === "1");
  const [failed, setFailed] = useState(false);

  function handleEnded() {
    writeSession(FINISHED_KEY, "1");
    setFinished(true);
  }

  return (
    <div className="flex w-full flex-col items-center gap-10">
      <p className={`${eyebrow} animate-rise`}>sound on ♡</p>
      <div className="animate-rise w-full overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[0_30px_120px_-40px_rgb(255_143_171/0.45)] [animation-delay:100ms]">
        <video
          src={src}
          controls
          playsInline
          preload="metadata"
          onEnded={handleEnded}
          onError={() => setFailed(true)}
          className="block max-h-[75dvh] w-full bg-black"
        />
      </div>

      {failed && (
        <p role="alert" className="text-center text-sm text-rose">
          The video couldn&rsquo;t be loaded, but the game is still waiting for you.
        </p>
      )}

      <div className="min-h-12">
        {(finished || failed) && (
          <Link href="/game" className={`${primaryButton} animate-rise`}>
            Start the game
            <span aria-hidden>→</span>
          </Link>
        )}
      </div>
    </div>
  );
}
