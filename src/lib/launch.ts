import type { Session } from "@/lib/playfab";

// Opens the installed Plyria game through its plyria:// link, the way Roblox's website starts its player.
// The game registers the link on first run and uses this session, so players don't log in twice.
// ponytail: the session ticket rides in the link, like Roblox's launch ticket. Other programs on the
// same computer can read launch arguments; switch to a short-lived one-time code if that matters.
export function launchUrl(session: Session, action: "play" | "studio", params: Record<string, string> = {}) {
  const query = new URLSearchParams({ ...params, id: session.playFabId, ticket: session.ticket });
  return `plyria://${action}/?${query}`;
}
