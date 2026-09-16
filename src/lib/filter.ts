// Text filter for names and anything players type, matching the game's filter (Assets/Scripts/GameHud.cs).
// Short words match whole words only, so "class" keeps its "ass"; longer words match inside a word;
// phrases match across the whole text. Symbol-for-letter swaps (f4ck, sh!t, a$$) are undone first.
// ponytail: a word list, not a moderation service. Swap in a real filter API before Plyria has real players.

import { badWords } from "./badwords";

// Words no ordinary word contains, so they are matched inside words too ("XxFuckerxX", "f4cking").
// "cunt" stays out on purpose: Scunthorpe. So do "anal", "rape" and "cock" (analysis, grape, cocktail).
const ALWAYS_INSIDE = [
  "fuck", "shit", "slut", "twat", "wank", "jizz", "clit", "milf", "porn",
  "fack", "fck", "fuk", "fuq", "fvck", "sht", "btch", "bich", "azz", "dik",
];

// Endings allowed after a short word, so "nude" also catches "nudes".
const ENDINGS = ["s", "es", "ed", "er", "ers", "ing", "y", "ies"];

const SWAPS: Record<string, string> = {
  "0": "o", "1": "i", "!": "i", "|": "i", "3": "e", "4": "a", "@": "a",
  "5": "s", $: "s", "7": "t", "8": "b", "*": "u",
};

function normalize(word: string): string {
  let out = "";
  for (const raw of word.toLowerCase()) {
    const c = SWAPS[raw] ?? raw;
    if (c >= "a" && c <= "z") out += c;
  }
  return out;
}

// Runs of three or more letters down to one, so "fuuuuck" matches while "shiitake" keeps its "ii".
const collapse = (word: string) => word.replace(/(.)\1{2,}/g, "$1");

const shortWords: string[] = [];
const longWords: string[] = [];
const phrases: string[] = [];
const symbolWords: string[] = [];

for (const entry of badWords) {
  if (entry.includes(" ")) {
    const parts = entry.split(" ").map(normalize).filter(Boolean);
    if (parts.length > 1) phrases.push(parts.join(" "));
    continue;
  }
  const clean = normalize(entry);
  if (!clean) symbolWords.push(entry);
  else if (clean.length <= 4 && !ALWAYS_INSIDE.includes(clean)) shortWords.push(clean);
  else longWords.push(clean);
}

function matchesShort(word: string, bad: string): boolean {
  if (word === bad) return true;
  if (!word.startsWith(bad)) return false;
  return ENDINGS.includes(word.slice(bad.length));
}

function isBadWord(raw: string): boolean {
  const word = normalize(raw);
  if (!word) return false;
  const tight = collapse(word);
  for (const bad of shortWords) if (matchesShort(word, bad) || matchesShort(tight, collapse(bad))) return true;
  for (const bad of longWords) if (word.includes(bad) || tight.includes(collapse(bad))) return true;
  return false;
}

const WORDS = /[\p{L}\p{N}@$!*]+/gu;

function hasBadPhrase(text: string): boolean {
  const words = text.toLowerCase().split(/\s+/).map(normalize).filter(Boolean);
  const joined = words.join(" ");
  const tight = words.join("");
  return phrases.some((phrase) => joined.includes(phrase) || tight.includes(phrase.replaceAll(" ", "")));
}

// True when the text has anything the filter blocks. Use it to turn away names and profile text.
export function hasBadWords(text: string): boolean {
  if (!text) return false;
  if (symbolWords.some((symbol) => text.includes(symbol))) return true;
  if (hasBadPhrase(text)) return true;
  return (text.match(WORDS) ?? []).some(isBadWord);
}

// Blocked words replaced with "###", like the game's chat. Use it for text that already exists,
// such as game names and descriptions published from Studio.
export function maskBadWords(text: string): string {
  if (!text) return "";
  let out = text;
  for (const symbol of symbolWords) out = out.replaceAll(symbol, "###");
  if (hasBadPhrase(out)) return "###";
  return out.replace(WORDS, (word) => (isBadWord(word) ? "#".repeat(word.length) : word));
}
