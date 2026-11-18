"use client";

import { useEffect, useReducer, useState } from "react";
import {
  FIRST_ASKER,
  MAX_NUMBER,
  MIN_NUMBER,
  MY_NUMBER,
  MY_NUMBER_PARTS,
  allNumbers,
  answerYourQuestion,
  applyYourAnswer,
  describeMyQuestion,
  describeYourQuestion,
  isValidGuess,
  knownRange,
  pickMyQuestion,
  type Asker,
  type LogEntry,
  type MyQuestion,
  type YourQuestion,
  type YourQuestionKind,
} from "@/lib/game";
import { card, eyebrow, primaryButton, secondaryButton, skeleton } from "@/lib/styles";
import { readSession, useHydrated, writeSession } from "@/lib/use-hydrated";

// ---------------------------------------------------------------------------
// State

type Phase = "intro" | "playing" | "you-won" | "i-won" | "confused";

type GameState = {
  phase: Phase;
  turn: Asker;
  /** Numbers Eve's number could still be. */
  candidates: number[];
  myQuestion: MyQuestion | null;
  /** Bumps every time the website asks something new (used as a React key). */
  questionId: number;
  log: LogEntry[];
  yourNumber: number | null;
};

type Action = { type: "start" } | { type: "answer"; yes: boolean } | { type: "ask"; question: YourQuestion } | { type: "reset" };

const STORAGE_KEY = "eve-game-v1";

const initialState: GameState = {
  phase: "intro",
  turn: FIRST_ASKER,
  candidates: allNumbers(),
  myQuestion: null,
  questionId: 0,
  log: [],
  yourNumber: null,
};

function myTurn(state: GameState, candidates: number[], log: LogEntry[]): GameState {
  return {
    ...state,
    turn: "me",
    candidates,
    log,
    myQuestion: pickMyQuestion(candidates),
    questionId: state.questionId + 1,
  };
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "start": {
      const fresh = { ...initialState, phase: "playing" as const };
      return FIRST_ASKER === "me" ? myTurn(fresh, fresh.candidates, []) : { ...fresh, turn: "you" };
    }

    case "answer": {
      // Eve answers the website's question about her number.
      const question = state.myQuestion;
      if (state.phase !== "playing" || state.turn !== "me" || !question) return state;
      const log = [...state.log, { asker: "me" as const, question, answer: action.yes }];
      const candidates = applyYourAnswer(state.candidates, question, action.yes);

      if (question.kind === "equals" && action.yes) {
        return { ...state, phase: "i-won", log, candidates, myQuestion: null, yourNumber: question.value };
      }
      if (candidates.length === 0) return { ...state, phase: "confused", log, candidates, myQuestion: null };
      if (action.yes) return myTurn(state, candidates, log); // a "yes" means I ask again
      return { ...state, turn: "you", log, candidates, myQuestion: null };
    }

    case "ask": {
      // Eve asks the website about its number.
      const { question } = action;
      if (state.phase !== "playing" || state.turn !== "you" || !isValidGuess(question.value)) return state;
      const answer = answerYourQuestion(question);
      const log = [...state.log, { asker: "you" as const, question, answer }];

      if (question.kind === "equals" && answer) return { ...state, phase: "you-won", log };
      if (answer) return { ...state, log }; // a "yes" means Eve asks again
      return myTurn(state, state.candidates, log);
    }

    case "reset":
      return initialState;
  }
}

function loadState(): GameState {
  const raw = readSession(STORAGE_KEY);
  if (!raw) return initialState;
  try {
    const saved = JSON.parse(raw) as GameState;
    if (typeof saved?.phase === "string" && Array.isArray(saved.candidates) && Array.isArray(saved.log)) return saved;
  } catch {
    // Ignore a corrupted save.
  }
  return initialState;
}

// ---------------------------------------------------------------------------
// Components

export function Game() {
  // sessionStorage only exists in the browser, so wait for hydration before restoring a saved game.
  const hydrated = useHydrated();
  if (!hydrated) return <div className={`${skeleton} h-96`} />;
  return <GameBoard />;
}

function GameBoard() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    writeSession(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  switch (state.phase) {
    case "intro":
      return <Intro onStart={() => dispatch({ type: "start" })} />;
    case "playing":
      return <Playing state={state} dispatch={dispatch} />;
    case "you-won":
    case "i-won":
      return <Ending state={state} onReplay={() => dispatch({ type: "reset" })} />;
    case "confused":
      return <Confused onRestart={() => dispatch({ type: "reset" })} />;
  }
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <section className="flex flex-col items-center text-center">
      <p className={`${eyebrow} animate-rise`}>a little game</p>
      <h1 className="text-glow animate-rise mt-4 font-serif text-6xl leading-none italic [animation-delay:80ms]">
        Higher or lower?
      </h1>
      <p className="animate-rise mt-7 text-[15px] leading-relaxed text-ink/85 [animation-delay:160ms]">
        Choose a number from {MIN_NUMBER} to {MAX_NUMBER} and keep it in your head. I&rsquo;ve already chosen mine.
      </p>
      <ol className={`${card} animate-rise mt-8 space-y-3 text-left text-sm leading-relaxed text-ink/80 [animation-delay:240ms]`}>
        <Rule n={1}>We take turns asking yes-or-no questions about each other&rsquo;s number.</Rule>
        <Rule n={2}>If the answer is yes, you ask another one. If it&rsquo;s no, it&rsquo;s the other player&rsquo;s turn.</Rule>
        <Rule n={3}>
          Whoever guesses the other&rsquo;s number first wins. {FIRST_ASKER === "me" ? "I’ll go first." : "You go first."}
        </Rule>
      </ol>
      <button onClick={onStart} className={`${primaryButton} animate-rise mt-9 [animation-delay:320ms]`}>
        I&rsquo;ve chosen my number
      </button>
    </section>
  );
}

function Rule({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="font-serif text-lg leading-6 text-rose italic">{n}</span>
      <span>{children}</span>
    </li>
  );
}

function Playing({ state, dispatch }: { state: GameState; dispatch: React.Dispatch<Action> }) {
  const last = state.log.at(-1);

  return (
    <section className="flex w-full flex-col items-center gap-5">
      <TurnPill turn={state.turn} />
      {/* Prefixed keys: these siblings must never share a key. */}
      {last && <LastExchange key={`last-${state.log.length}`} entry={last} />}

      {state.turn === "me" && state.myQuestion ? (
        <MyTurn
          key={`question-${state.questionId}`}
          question={state.myQuestion}
          onAnswer={(yes) => dispatch({ type: "answer", yes })}
        />
      ) : (
        <YourTurn key="your-turn" log={state.log} onAsk={(question) => dispatch({ type: "ask", question })} />
      )}

      <History log={state.log} />
    </section>
  );
}

function TurnPill({ turn }: { turn: Asker }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs tracking-[0.25em] uppercase">
      <span className={`size-1.5 rounded-full ${turn === "me" ? "bg-peach" : "bg-rose"}`} />
      {turn === "me" ? "My turn" : "Your turn"}
    </div>
  );
}

function LastExchange({ entry }: { entry: LogEntry }) {
  let text: string;
  if (entry.asker === "me") {
    text = entry.answer ? "You said yes, so I get another question." : "You said no, so it’s your turn.";
  } else {
    text = entry.answer ? "Yes! Ask me another one." : "No. My turn now.";
  }

  return (
    <div className="animate-rise text-center">
      {entry.asker === "you" && (
        <p className="text-sm text-mist">
          {describeYourQuestion(entry.question as YourQuestion)}{" "}
          <span className={`ml-1 font-medium ${entry.answer ? "text-peach" : "text-rose"}`}>{entry.answer ? "Yes" : "No"}</span>
        </p>
      )}
      <p className="mt-1 text-[15px] text-ink/90">{text}</p>
    </div>
  );
}

function MyTurn({ question, onAnswer }: { question: MyQuestion; onAnswer: (yes: boolean) => void }) {
  const [ready, setReady] = useState(false);

  // A short "thinking" pause so the turn change is easy to notice.
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 650);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`${card} animate-rise text-center`}>
      <p className={eyebrow}>{question.kind === "equals" ? "My guess" : "My question"}</p>
      <div className="flex min-h-28 items-center justify-center">
        {ready ? (
          <h2 className="animate-rise font-serif text-4xl leading-tight">{describeMyQuestion(question)}</h2>
        ) : (
          <p aria-live="polite" className="flex gap-1.5 text-3xl text-mist">
            <span className="animate-pulse-soft">•</span>
            <span className="animate-pulse-soft [animation-delay:150ms]">•</span>
            <span className="animate-pulse-soft [animation-delay:300ms]">•</span>
            <span className="sr-only">Thinking</span>
          </p>
        )}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <button disabled={!ready} onClick={() => onAnswer(true)} className={primaryButton}>
          Yes
        </button>
        <button disabled={!ready} onClick={() => onAnswer(false)} className={secondaryButton}>
          No
        </button>
      </div>
    </div>
  );
}

const QUESTION_KINDS: { kind: YourQuestionKind; label: string }[] = [
  { kind: "higher", label: "Higher than" },
  { kind: "lower", label: "Lower than" },
  { kind: "equals", label: "Exactly" },
];

function YourTurn({ log, onAsk }: { log: LogEntry[]; onAsk: (question: YourQuestion) => void }) {
  const { low, high } = knownRange(log);
  const [kind, setKind] = useState<YourQuestionKind>("higher");
  // Start from the last number she asked about (not the middle of her range, which would hint at the answer).
  const [raw, setRaw] = useState(() => String(lastAskedNumber(log)));
  const value = Number(raw);
  const valid = raw.trim() !== "" && isValidGuess(value);

  function step(delta: number) {
    const base = valid ? value : lastAskedNumber(log);
    setRaw(String(Math.min(MAX_NUMBER, Math.max(MIN_NUMBER, base + delta))));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onAsk({ kind, value });
      }}
      className={`${card} animate-rise flex flex-col items-center gap-5 text-center`}
    >
      <p className={eyebrow}>Your question</p>
      <p className="-mt-1 font-serif text-3xl">Is your number…</p>

      <div role="radiogroup" aria-label="Question type" className="grid w-full grid-cols-3 gap-1 rounded-full bg-white/[0.05] p-1">
        {QUESTION_KINDS.map((option) => (
          <button
            key={option.kind}
            type="button"
            role="radio"
            aria-checked={kind === option.kind}
            onClick={() => setKind(option.kind)}
            className={`rounded-full px-2 py-2.5 text-[13px] font-medium transition-all duration-200 ${
              kind === option.kind ? "bg-ink text-night" : "text-ink/70 hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <StepButton label="Decrease" onClick={() => step(-1)}>
          −
        </StepButton>
        <input
          type="number"
          inputMode="numeric"
          min={MIN_NUMBER}
          max={MAX_NUMBER}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          aria-label="Number"
          className="w-28 rounded-2xl border border-white/10 bg-transparent py-2 text-center font-serif text-5xl outline-none focus:border-rose/60"
        />
        <StepButton label="Increase" onClick={() => step(1)}>
          +
        </StepButton>
      </div>

      <p className="min-h-5 text-sm text-mist">
        {valid ? describeYourQuestion({ kind, value }) : `Pick a number from ${MIN_NUMBER} to ${MAX_NUMBER}.`}
      </p>

      <button type="submit" disabled={!valid} className={`${primaryButton} w-full`}>
        Ask
      </button>

      {(low > MIN_NUMBER || high < MAX_NUMBER) && (
        <p className="text-xs text-mist">
          {low === high ? `It has to be ${low}!` : `From my answers, it's between ${low} and ${high}.`}
        </p>
      )}
    </form>
  );
}

function lastAskedNumber(log: LogEntry[]): number {
  return log.findLast((entry) => entry.asker === "you")?.question.value ?? 50;
}

function StepButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-11 items-center justify-center rounded-full border border-white/15 text-xl text-ink/80 transition-all duration-200 hover:border-white/30 active:scale-90"
    >
      {children}
    </button>
  );
}

function History({ log }: { log: LogEntry[] }) {
  if (log.length === 0) return null;
  return (
    <div className="w-full">
      <p className={`${eyebrow} mb-3 text-center`}>So far</p>
      <ol className="max-h-56 space-y-1.5 overflow-y-auto pr-1 text-sm">
        {[...log].reverse().map((entry, i) => (
          <li key={log.length - i} className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.03] px-4 py-2.5">
            <span className="text-ink/80">
              <span className="mr-2 text-xs tracking-wider text-mist uppercase">{entry.asker === "me" ? "Me" : "You"}</span>
              {entry.asker === "me"
                ? describeMyQuestion(entry.question as MyQuestion)
                : describeYourQuestion(entry.question as YourQuestion)}
            </span>
            <span className={`shrink-0 font-medium ${entry.answer ? "text-peach" : "text-rose"}`}>{entry.answer ? "Yes" : "No"}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Ending({ state, onReplay }: { state: GameState; onReplay: () => void }) {
  const youWon = state.phase === "you-won";
  return (
    <section className="flex w-full flex-col items-center text-center">
      <p className={`${eyebrow} animate-rise`}>{youWon ? "You got it!" : "Got you!"}</p>
      <h1 className="text-glow animate-rise mt-4 font-serif text-5xl leading-tight italic [animation-delay:80ms]">
        {youWon ? `My number was ${MY_NUMBER}` : `Your number is ${state.yourNumber}`}
      </h1>
      {!youWon && (
        <p className="animate-rise mt-4 text-[15px] text-ink/85 [animation-delay:160ms]">
          And mine? It was {MY_NUMBER} the whole time.
        </p>
      )}
      <Reveal />
      <button onClick={onReplay} className={`${secondaryButton} animate-rise mt-9 [animation-delay:1600ms]`}>
        Play again
      </button>
    </section>
  );
}

function Reveal() {
  const [day, month, year] = MY_NUMBER_PARTS;
  return (
    <div className={`${card} mt-9 flex flex-col items-center gap-4 py-9`}>
      <p className={`${eyebrow} animate-rise [animation-delay:300ms]`}>Why {MY_NUMBER}?</p>
      <p className="text-glow animate-rise font-serif text-8xl leading-none [animation-delay:450ms]">{MY_NUMBER}</p>
      <p className="flex items-baseline gap-2 font-serif text-3xl">
        <span className="animate-rise text-mist [animation-delay:700ms]">=</span>
        <span className="animate-rise [animation-delay:850ms]">{day}</span>
        <span className="animate-rise text-mist [animation-delay:950ms]">+</span>
        <span className="animate-rise [animation-delay:1050ms]">{month}</span>
        <span className="animate-rise text-mist [animation-delay:1150ms]">+</span>
        <span className="animate-rise [animation-delay:1250ms]">{year}</span>
      </p>
      <p className="animate-rise text-sm text-ink/80 [animation-delay:1450ms]">
        today&rsquo;s date: {day}/{month}/{year} ♡
      </p>
    </div>
  );
}

function Confused({ onRestart }: { onRestart: () => void }) {
  return (
    <section className="flex flex-col items-center text-center">
      <p className={`${eyebrow} animate-rise`}>hmm…</p>
      <h1 className="animate-rise mt-4 font-serif text-5xl leading-tight italic [animation-delay:80ms]">
        That doesn&rsquo;t add up
      </h1>
      <p className="animate-rise mt-6 text-[15px] leading-relaxed text-ink/85 [animation-delay:160ms]">
        I&rsquo;ve run out of numbers yours could be. Maybe a wrong tap somewhere? Let&rsquo;s start over.
      </p>
      <button onClick={onRestart} className={`${primaryButton} animate-rise mt-9 [animation-delay:240ms]`}>
        Start over
      </button>
    </section>
  );
}
