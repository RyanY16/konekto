// Word-boundary aware profanity/slur check.
// Matches whole words and common l33t-speak variants.

const BANNED = [
  // Slurs — racial/ethnic
  "nigger","nigga","chink","gook","spic","spick","wetback","kike","heeb","hymie",
  "towelhead","raghead","sandnigger","redskin","injun","zipperhead","jap","nip",
  "coon","darky","porch monkey","jungle bunny","negro","beaner","cracker",
  "honky","whitey","gringo","halfbreed","half-breed","mulatto","zipperhead",
  // Slurs — sexuality/gender
  "faggot","fag","dyke","tranny","shemale","trannies","sissy","queer",
  "homo","lesbo","poofter",
  // General profanity / hate
  "cunt","fuck","shit","bitch","asshole","bastard","dick","cock","pussy",
  "motherfucker","motherfucking","whore","slut","retard","retarded","spaz",
  "nazi","heil","kkk","white power","white supremacy","go back to your country",
  "kill yourself","kys","die in a fire",
];

// Build one regex: whole-word match, case-insensitive.
// Also strips common l33t substitutions before checking.
const PATTERN = new RegExp(
  `\\b(${BANNED.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+")).join("|")})\\b`,
  "i",
);

const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "@": "a", "$": "s", "!": "i" };
function normalise(text: string) {
  return text.replace(/[013@$!4]/g, (c) => LEET[c] ?? c);
}

export function containsSlur(text: string): boolean {
  return PATTERN.test(normalise(text));
}

/** Check an array of strings; returns true if any contain a slur. */
export function anyContainsSlur(...fields: (string | null | undefined)[]): boolean {
  return fields.some((f) => f && containsSlur(f));
}
