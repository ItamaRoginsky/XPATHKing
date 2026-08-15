const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity

export function generateRoomCode(existing: Set<string>): string {
  let code: string;
  do {
    code = Array.from({ length: 4 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");
  } while (existing.has(code));
  return code;
}
