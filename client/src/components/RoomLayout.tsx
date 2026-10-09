import type { ReactNode } from "react";
import type { RoomState } from "../../../shared/types";
import DevTools from "./DevTools";
import RoomChat from "./RoomChat";
import RoomInfo from "./RoomInfo";

interface RoomLayoutProps {
  state: RoomState;
  /**
   * Linke Spalte: Spielerliste (und was dazugehört, z. B. der Start-Knopf des Hosts).
   * Ohne (Kniffel – dort ist jeder Spieler schon eine Spalte im Block) gibt es nur Spiel und Chat.
   */
  players?: ReactNode;
  /** Mitte: das eigentliche Spielgeschehen. */
  children: ReactNode;
}

const devTools = (state: RoomState) =>
  state.devTools && state.hostId === state.you && <DevTools state={state} />;

/**
 * Gemeinsames Raster aller Raum-Bildschirme.
 * Breit: Raumcode und Spieler links, Spiel in der Mitte, Chat rechts. Mittel: Spiel links,
 * Spieler und Chat rechts übereinander. Schmal (Handy): Spiel, dann Chat, dann Spieler.
 */
function RoomLayout({ state, players, children }: RoomLayoutProps) {
  if (!players) {
    return (
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          {children}
          {devTools(state)}
        </div>
        <div className="xl:self-stretch">
          <RoomChat state={state} />
        </div>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] xl:grid-cols-[15rem_minmax(0,1fr)_20rem]">
      <div className="order-1 flex min-w-0 flex-col lg:order-none lg:col-start-1 lg:row-span-2 lg:row-start-1 xl:col-start-2 xl:row-span-1 xl:self-stretch">
        {children}
      </div>
      {/* Breit: ganzhohe Leiste mit Raumcode oben und Spielern darunter (Liste füllt den Rest). */}
      <div className="order-3 flex flex-col gap-4 lg:order-none lg:col-start-2 lg:row-start-1 xl:sticky xl:top-24 xl:col-start-1 xl:h-[calc(100dvh-8rem)] xl:min-h-[28rem]">
        <div className="hidden xl:block">
          <RoomInfo state={state} />
        </div>
        {players}
        {devTools(state)}
      </div>
      <div className="order-2 lg:order-none lg:col-start-2 lg:row-start-2 xl:col-start-3 xl:row-start-1 xl:self-stretch">
        <RoomChat state={state} />
      </div>
    </div>
  );
}

export default RoomLayout;
