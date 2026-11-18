import { PinForm } from "./pin-form";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      <p className="animate-rise text-xs tracking-[0.35em] text-mist uppercase">just for you</p>
      <h1 className="text-glow animate-rise mt-4 font-serif text-6xl leading-none italic [animation-delay:80ms]">
        Welcome, Eve
      </h1>
      <div className="animate-rise mt-8 space-y-3 text-[15px] leading-relaxed text-ink/80 [animation-delay:160ms]">
        <p>Please proceed with this webpage only if you are alone right now.</p>
        <p>To proceed, please enter your phone&rsquo;s passcode below.</p>
      </div>
      <div className="animate-rise mt-10 w-full [animation-delay:240ms]">
        <PinForm />
      </div>
    </main>
  );
}
