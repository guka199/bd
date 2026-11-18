import { Suspense } from "react";
import { AccessGate } from "@/lib/access";
import { skeleton } from "@/lib/styles";
import { Game } from "./game";

export default function GamePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-5 py-12">
      <Suspense fallback={<div className={`${skeleton} h-96`} />}>
        <AccessGate>
          <Game />
        </AccessGate>
      </Suspense>
    </main>
  );
}
