/** Kniffel: Einträge, Rückgängig, Spalten, Zugreihenfolge, Sperre und digitale Würfel. */

import { randomInt } from "node:crypto";
import {
  CATEGORIES,
  MAX_ROLLS,
  allowedValues,
  canEditColumn,
  nextTurn,
  type Category,
} from "../../../shared/kniffel";
import { MAX_UNDO } from "../config";
import { addColumn, setTurn, syncLastEntry } from "../games/kniffel";
import { cleanName, type KniffelStep } from "../state";
import { broadcast } from "../view";
import type { Handlers } from "./context";

export function registerKniffelHandlers({ socket, ctx, reply }: Handlers) {
  // Ohne Sperre darf jeder jede Spalte bearbeiten – wie ein Block, der auf dem Tisch liegt.
  socket.on("kniffel:set", (data) => {
    const c = ctx();
    const sheet = c?.room.kniffel;
    const column = String(data?.column ?? "");
    const category = String(data?.category ?? "") as Category;
    const target = sheet?.columns.find((col) => col.id === column);
    if (!c || !sheet || !target || !canEditColumn(sheet, target, c.player.id)) return;
    if (!CATEGORIES.includes(category)) return;

    const cells = (sheet.cells[column] ??= {});
    const step: KniffelStep = {
      column,
      category,
      before: cells[category],
      current: sheet.current,
      roll: sheet.roll && structuredClone(sheet.roll),
    };
    if (data?.value === null) delete cells[category];
    else {
      const value = Number(data?.value);
      if (!allowedValues(category).includes(value)) return;
      const isNew = cells[category] === undefined;
      cells[category] = value;
      // Ein neuer Eintrag beendet den Zug dieser Spalte; Korrekturen ändern nichts an der Reihenfolge.
      if (isNew) setTurn(sheet, nextTurn(sheet, column));
    }
    // Nach dem Löschen eines Eintrags kann wieder jemand dran sein.
    if (sheet.current === null) setTurn(sheet, nextTurn(sheet, column));

    if (cells[category] !== step.before) {
      c.room.kniffelHistory.push(step);
      if (c.room.kniffelHistory.length > MAX_UNDO) c.room.kniffelHistory.shift();
      syncLastEntry(c.room);
    }
    broadcast(c.room);
  });

  // Letzten Eintrag zurücknehmen – inklusive Zug und digitalem Wurf von davor.
  socket.on("kniffel:undo", () => {
    const c = ctx();
    const sheet = c?.room.kniffel;
    const step = c?.room.kniffelHistory.at(-1);
    const column = sheet?.columns.find((col) => col.id === step?.column);
    if (!c || !sheet || !step || !column || !canEditColumn(sheet, column, c.player.id)) return;

    c.room.kniffelHistory.pop();
    const cells = (sheet.cells[step.column] ??= {});
    if (step.before === undefined) delete cells[step.category];
    else cells[step.category] = step.before;
    sheet.current = step.current;
    sheet.roll = step.roll;
    syncLastEntry(c.room);
    broadcast(c.room);
  });

  socket.on("kniffel:add", (data, cb) => {
    const c = ctx();
    const name = cleanName(data?.name);
    if (!c || !c.room.kniffel || !name) return;
    if (!addColumn(c.room, name)) return reply(cb, { ok: false, error: "room_full" });
    reply(cb, { ok: true });
    broadcast(c.room);
  });

  socket.on("kniffel:remove", (data) => {
    const c = ctx();
    const sheet = c?.room.kniffel;
    if (!c || !c.isHost || !sheet) return;
    const column = String(data?.column ?? "");
    if (sheet.current === column) {
      const next = nextTurn(sheet, column);
      setTurn(sheet, next === column ? null : next);
    }
    sheet.columns = sheet.columns.filter((col) => col.id !== column);
    delete sheet.cells[column];
    c.room.kniffelHistory = c.room.kniffelHistory.filter((step) => step.column !== column);
    syncLastEntry(c.room);
    broadcast(c.room);
  });

  socket.on("kniffel:reset", () => {
    const c = ctx();
    const sheet = c?.room.kniffel;
    if (!c || !c.isHost || !sheet) return;
    sheet.cells = {};
    setTurn(sheet, sheet.columns[0]?.id ?? null);
    sheet.roll = null;
    c.room.kniffelHistory = [];
    syncLastEntry(c.room);
    broadcast(c.room);
  });

  // Manuell festlegen, wer dran ist – falls die automatische Reihenfolge nicht passt.
  socket.on("kniffel:turn", (data) => {
    const c = ctx();
    const sheet = c?.room.kniffel;
    const column = String(data?.column ?? "");
    if (!c || !sheet || !sheet.columns.some((col) => col.id === column)) return;
    setTurn(sheet, column);
    broadcast(c.room);
  });

  socket.on("kniffel:lock", (data) => {
    const c = ctx();
    if (!c || !c.isHost || !c.room.kniffel) return;
    c.room.kniffel.locked = Boolean(data?.locked);
    broadcast(c.room);
  });

  // Digitale Würfel: der Server würfelt, damit alle denselben Wurf sehen.
  const rollContext = () => {
    const c = ctx();
    const sheet = c?.room.kniffel;
    const column = sheet?.columns.find((col) => col.id === sheet.current);
    if (!c || !sheet || !column || !canEditColumn(sheet, column, c.player.id)) return undefined;
    return { room: c.room, sheet };
  };

  socket.on("kniffel:roll", () => {
    const r = rollContext();
    if (!r) return;
    const roll = (r.sheet.roll ??= {
      dice: [1, 1, 1, 1, 1],
      held: [false, false, false, false, false],
      count: 0,
    });
    if (roll.count >= MAX_ROLLS || (roll.count > 0 && roll.held.every(Boolean))) return;
    roll.dice = roll.dice.map((d, i) => (roll.count > 0 && roll.held[i] ? d : randomInt(1, 7)));
    roll.count++;
    broadcast(r.room);
  });

  socket.on("kniffel:hold", (data) => {
    const r = rollContext();
    const roll = r?.sheet.roll;
    const index = Number(data?.index);
    if (!r || !roll || roll.count === 0 || roll.count >= MAX_ROLLS) return;
    if (!Number.isInteger(index) || index < 0 || index > 4) return;
    roll.held[index] = !roll.held[index];
    broadcast(r.room);
  });
}
