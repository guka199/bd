import { Suspense } from "react";
import { AccessGate } from "@/lib/access";
import { VIDEO_SRC } from "@/lib/config";
import { skeleton } from "@/lib/styles";
import { VideoPlayer } from "./video-player";

export default function VideoPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-center px-4 py-12">
      <Suspense fallback={<div className={`${skeleton} aspect-video`} />}>
        <AccessGate>
          <VideoPlayer src={VIDEO_SRC} />
        </AccessGate>
      </Suspense>
    </main>
  );
}
