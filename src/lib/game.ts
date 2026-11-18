// Pure rules for the "higher or lower" guessing game. No React in here so it is easy to test.

export const MIN_NUMBER = 1;
export const MAX_NUMBER = 100;
/** The website's secret number: 18 + 11 + 26 (18/11/26). */
export const MY_NUMBER = 55;
export const MY_NUMBER_PARTS = [18, 11, 26] as const;
/** Once this many (or fewer) numbers are left, the website guesses them one by one. */
export const DIRECT_GUESS_AT = 5;
/** Who asks the first question. */
export const FIRST_ASKER: Asker = "me";

export type Asker = "me" | "you"; // "me" = the website, "you" = Eve

/** A question the website asks Eve about her number. */
export type MyQuestion = { kind: "lower"; value: number } | { kind: "equals"; value: number };

/** A question Eve asks the website about its number. */
export type YourQuestionKind = "higher" | "lower" | "equals";
export type YourQuestion = { kind: YourQuestionKind; value: number };

export type LogEntry = {
  asker: Asker;
  question: MyQuestion | YourQuestion;
  answer: boolean;
};

export function allNumbers(): number[] {
  return Array.from({ length: MAX_NUMBER - MIN_NUMBER + 1 }, (_, i) => MIN_NUMBER + i);
}

/**
 * The website's strategy: split the remaining numbers into thirds and ask
 * "is it lower than the 2/3 mark?" (1–100 gives "lower than 66?").
 * With 5 or fewer numbers left, it guesses them directly.
 */
export function pickMyQuestion(candidates: number[]): MyQuestion {
  if (candidates.length === 0) throw new Error("No candidates left");
  if (candidates.length <= DIRECT_GUESS_AT) {
    return { kind: "equals", value: candidates[Math.floor(candidates.length / 2)] };
  }
  const index = Math.floor((candidates.length * 2) / 3) - 1;
  return { kind: "lower", value: candidates[index] };
}

/** Narrows the website's candidates for Eve's number using her answer. */
export function applyYourAnswer(candidates: number[], question: MyQuestion, yes: boolean): number[] {
  if (question.kind === "lower") {
    return candidates.filter((n) => (yes ? n < question.value : n >= question.value));
  }
  return yes ? [question.value] : candidates.filter((n) => n !== question.value);
}

/** Truthfully answers Eve's question about the website's number. */
export function answerYourQuestion({ kind, value }: YourQuestion): boolean {
  switch (kind) {
    case "higher":
      return MY_NUMBER > value;
    case "lower":
      return MY_NUMBER < value;
    case "equals":
      return MY_NUMBER === value;
  }
}

/** What Eve can conclude about the website's number from the answers she got. */
export function knownRange(log: LogEntry[]): { low: number; high: number } {
  let low = MIN_NUMBER;
  let high = MAX_NUMBER;
  for (const { asker, question, answer } of log) {
    if (asker !== "you") continue;
    const { kind, value } = question;
    if (kind === "higher") {
      if (answer) low = Math.max(low, value + 1);
      else high = Math.min(high, value);
    } else if (kind === "lower") {
      if (answer) high = Math.min(high, value - 1);
      else low = Math.max(low, value);
    } else if (answer) {
      low = high = value;
    }
  }
  return { low, high };
}

export function isValidGuess(value: number): boolean {
  return Number.isInteger(value) && value >= MIN_NUMBER && value <= MAX_NUMBER;
}

export function describeMyQuestion(q: MyQuestion): string {
  return q.kind === "lower" ? `Is your number lower than ${q.value}?` : `Is your number ${q.value}?`;
}

export function describeYourQuestion(q: YourQuestion): string {
  if (q.kind === "higher") return `Is it higher than ${q.value}?`;
  if (q.kind === "lower") return `Is it lower than ${q.value}?`;
  return `Is it ${q.value}?`;
}
