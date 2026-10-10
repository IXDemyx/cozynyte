import { useCallback, useEffect, useRef, type PointerEvent } from "react";
import { CANVAS_HEIGHT, CANVAS_WIDTH, applyOps, type DrawOp } from "../../../../shared/draw";
import type { Ack } from "../../../../shared/types";
import { socket } from "../../lib/socket";
import { renderAll, renderOp } from "./renderer";

export type Tool = "pen" | "eraser" | "fill";

interface Options {
  /** Laufender Zug – Befehle anderer Züge werden ignoriert. */
  turn: number;
  /** Darf ich gerade zeichnen (Zeichner und Zeichenphase)? */
  canDraw: boolean;
  tool: Tool;
  color: number;
  size: number;
}

/** Zwischen zwei Paketen werden Punkte gesammelt – etwa 25 Pakete pro Sekunde. */
const FLUSH_MS = 40;

/**
 * Leinwand eines Zugs: zeichnet empfangene Befehle, holt nach dem Neuladen die bisherige
 * Zeichnung und lässt den Zeichner malen. Eigene Striche erscheinen sofort, die Punkte gehen
 * gebündelt an den Server.
 */
export function useDrawing({ turn, canDraw, tool, color, size }: Options) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ops = useRef<DrawOp[]>([]);
  const nextId = useRef(1);
  const stroke = useRef<{ id: number; c: number; s: number; pending: number[] } | null>(null);
  const turnRef = useRef(turn);
  turnRef.current = turn;

  const context = () => canvasRef.current?.getContext("2d", { willReadFrequently: true });

  const replaceAll = useCallback((list: DrawOp[]) => {
    ops.current = list.map((op) => (op.t === "line" ? { ...op, p: [...op.p] } : op));
    nextId.current = Math.max(nextId.current, ...list.map((op) => op.id + 1));
    const ctx = context();
    if (ctx) renderAll(ctx, ops.current);
  }, []);

  // Neuer Zug: leere Leinwand, dann den bisherigen Stand holen (falls schon gezeichnet wurde).
  useEffect(() => {
    stroke.current = null;
    nextId.current = 1;
    replaceAll([]);
    socket.emit("draw:sync", (res: Ack<{ turn: number; ops: DrawOp[] }>) => {
      if (res.ok && res.turn === turnRef.current) replaceAll(res.ops);
    });
  }, [turn, replaceAll]);

  // Befehle der anderen bzw. die ganze Zeichnung nach einem Rückgängig.
  useEffect(() => {
    const onOps = ({ turn: t, ops: incoming }: { turn: number; ops: DrawOp[] }) => {
      if (t !== turnRef.current) return;
      const ctx = context();
      for (const op of incoming) {
        const last = ops.current[ops.current.length - 1];
        const from =
          op.t === "line" && last?.t === "line" && last.id === op.id ? last.p.length / 2 : 0;
        applyOps(ops.current, [op]);
        const target = ops.current[ops.current.length - 1];
        if (ctx && target) renderOp(ctx, target, from);
      }
    };
    const onSync = ({ turn: t, ops: list }: { turn: number; ops: DrawOp[] }) => {
      if (t === turnRef.current) replaceAll(list);
    };
    socket.on("draw:ops", onOps);
    socket.on("draw:sync", onSync);
    return () => {
      socket.off("draw:ops", onOps);
      socket.off("draw:sync", onSync);
    };
  }, [replaceAll]);

  /** Gesammelte Punkte des laufenden Strichs verschicken. */
  const flush = useCallback(() => {
    const current = stroke.current;
    if (!current || !current.pending.length) return;
    const op = {
      id: current.id,
      t: "line" as const,
      c: current.c,
      s: current.s,
      p: current.pending,
    };
    current.pending = [];
    socket.emit("draw:ops", { turn: turnRef.current, ops: [op] });
  }, []);

  useEffect(() => {
    if (!canDraw) return;
    const timer = setInterval(flush, FLUSH_MS);
    return () => clearInterval(timer);
  }, [canDraw, flush]);

  /** Bildschirmposition → logische Koordinaten (0–800, 0–600). */
  const point = (event: { clientX: number; clientY: number }): [number, number] => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((event.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    return [
      Math.round(Math.min(CANVAS_WIDTH, Math.max(0, x))),
      Math.round(Math.min(CANVAS_HEIGHT, Math.max(0, y))),
    ];
  };

  /** Eigenen Befehl übernehmen, zeichnen und verschicken. */
  const commit = (op: DrawOp) => {
    ops.current.push(op);
    const ctx = context();
    if (ctx) renderOp(ctx, op);
    socket.emit("draw:ops", { turn: turnRef.current, ops: [op] });
  };

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!canDraw || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.preventDefault();
    const [x, y] = point(event);
    if (tool === "fill") {
      commit({ id: nextId.current++, t: "fill", c: color, x, y });
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    const c = tool === "eraser" ? -1 : color;
    const id = nextId.current++;
    stroke.current = { id, c, s: size, pending: [x, y] };
    const op: DrawOp = { id, t: "line", c, s: size, p: [x, y] };
    ops.current.push(op);
    const ctx = context();
    if (ctx) renderOp(ctx, op);
  };

  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const current = stroke.current;
    if (!current) return;
    const op = ops.current[ops.current.length - 1];
    if (op?.t !== "line" || op.id !== current.id) return;
    const ctx = context();
    // Auch die Zwischenpunkte schneller Bewegungen mitnehmen – sonst werden Kurven eckig.
    const events = event.nativeEvent.getCoalescedEvents?.() ?? [event.nativeEvent];
    for (const e of events.length ? events : [event.nativeEvent]) {
      const [x, y] = point(e);
      const lx = op.p[op.p.length - 2];
      const ly = op.p[op.p.length - 1];
      if (Math.abs(x - lx) + Math.abs(y - ly) < 2) continue;
      const from = op.p.length / 2;
      op.p.push(x, y);
      current.pending.push(x, y);
      if (ctx) renderOp(ctx, op, from);
    }
  };

  const onPointerUp = () => {
    flush();
    stroke.current = null;
  };

  const undo = () => {
    if (!canDraw || !ops.current.length) return;
    flush();
    stroke.current = null;
    // Sofort lokal zurücknehmen; der Server schickt danach den gültigen Stand an alle.
    ops.current.pop();
    const ctx = context();
    if (ctx) renderAll(ctx, ops.current);
    socket.emit("draw:undo");
  };

  const clear = () => {
    if (!canDraw) return;
    flush();
    stroke.current = null;
    commit({ id: nextId.current++, t: "clear" });
  };

  return {
    canvasRef,
    undo,
    clear,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
  };
}
