import type { ReactNode } from "react";
import { FaEraser, FaFillDrip, FaPaintBrush } from "react-icons/fa";
import { FiRotateCcw, FiTrash2 } from "react-icons/fi";
import { DRAW_COLORS, DRAW_SIZES } from "../../../../shared/draw";
import { useLanguage } from "../../lib/i18n";
import type { Tool } from "./useDrawing";

interface ToolbarProps {
  tool: Tool;
  color: number;
  size: number;
  onTool: (tool: Tool) => void;
  onColor: (color: number) => void;
  onSize: (size: number) => void;
  onUndo: () => void;
  onClear: () => void;
}

/** Werkzeugleiste des Zeichners: Farben, Strichstärken, Stift/Radierer/Füllen, Rückgängig, Löschen. */
function Toolbar(props: ToolbarProps) {
  const { tool, color, size, onTool, onColor, onSize, onUndo, onClear } = props;
  const { t } = useLanguage();
  const active = tool === "eraser" ? "#ffffff" : DRAW_COLORS[color];

  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
      {/* Farben – auf dem Handy in zwei Reihen. */}
      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-12">
        {DRAW_COLORS.map((hex, i) => (
          <button
            key={hex}
            type="button"
            aria-label={t.draw.color(i + 1)}
            aria-pressed={color === i}
            onClick={() => {
              onColor(i);
              if (tool === "eraser") onTool("pen");
            }}
            className={`h-7 w-7 rounded-full border border-black/15 transition enabled:active:scale-90 dark:border-white/20 ${
              color === i && tool !== "eraser"
                ? "scale-110 ring-2 ring-(--accent) ring-offset-2 ring-offset-(--bg-secondary)"
                : "hover:scale-110"
            }`}
            style={{ background: hex }}
          />
        ))}
      </div>

      <div className="flex items-center gap-1">
        {DRAW_SIZES.map((px, i) => (
          <ToolButton
            key={px}
            label={t.draw.size(i + 1)}
            active={size === i}
            onClick={() => onSize(i)}
          >
            <span
              className="rounded-full ring-1 ring-slate-400/70"
              style={{
                width: Math.max(4, Math.round(px * 0.6)),
                height: Math.max(4, Math.round(px * 0.6)),
                background: active,
              }}
            />
          </ToolButton>
        ))}
      </div>

      <div className="flex items-center gap-1">
        <ToolButton label={t.draw.tools.pen} active={tool === "pen"} onClick={() => onTool("pen")}>
          <FaPaintBrush aria-hidden="true" />
        </ToolButton>
        <ToolButton
          label={t.draw.tools.eraser}
          active={tool === "eraser"}
          onClick={() => onTool("eraser")}
        >
          <FaEraser aria-hidden="true" />
        </ToolButton>
        <ToolButton
          label={t.draw.tools.fill}
          active={tool === "fill"}
          onClick={() => onTool("fill")}
        >
          <FaFillDrip aria-hidden="true" />
        </ToolButton>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <ToolButton label={t.draw.tools.undo} onClick={onUndo}>
          <FiRotateCcw aria-hidden="true" />
        </ToolButton>
        <ToolButton label={t.draw.tools.clear} onClick={onClear} danger>
          <FiTrash2 aria-hidden="true" />
        </ToolButton>
      </div>
    </div>
  );
}

function ToolButton({
  label,
  active = false,
  danger = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border text-base transition active:scale-90 ${
        active
          ? "border-(--accent) bg-(--accent) text-slate-950"
          : `border-slate-300 text-(--text-secondary) dark:border-slate-700 ${
              danger
                ? "hover:border-red-500 hover:text-red-500"
                : "hover:border-(--accent) hover:text-(--accent)"
            }`
      }`}
    >
      {children}
    </button>
  );
}

export default Toolbar;
