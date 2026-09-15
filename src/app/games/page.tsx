import GameCard from "@/components/GameCard";
import { GAMES } from "@/lib/catalog";

export default function GamesPage() {
  return (
    <>
      <h1 className="h1">Games</h1>
      <p className="muted">Games you can play in Plyria. Studio games show up here once cloud publishing is added.</p>
      <div className="mt-2.5 flex flex-wrap gap-3">
        {GAMES.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </>
  );
}
