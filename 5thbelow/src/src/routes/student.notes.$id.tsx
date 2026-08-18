import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Save,
  Trash2,
  Undo2,
  Redo2,
  Check,
  X,
  Bold,
} from "lucide-react";
import { BigButton, tone } from "@/components/kit";
import { subjects } from "@/lib/data";
import {
  PAGE_STYLES,
  type PageStyleId,
  type Stroke,
  type TextItem,
  type StickerItem,
  type NotebookData,
  type NotebookPage,
  type ToolType,
  loadNotebook,
  saveNotebook,
  createFreshPage,
} from "@/lib/notebookStorage";

export const Route = createFileRoute("/student/notes/$id")({
  head: () => ({
    meta: [
      { title: "Notebook Editor — SmartSlate Kids" },
      { name: "description", content: "Full-screen digital notebook with independent pages, flood fill, pen, brush, crayon, text, and stickers." },
      { property: "og:title", content: "Notebook Editor — SmartSlate Kids" },
      { property: "og:description", content: "Interactive ruled, border, and grid slate for young learners." },
    ],
  }),
  component: NoteEditor,
});

const penColors = ["#172554", "#4F7CFF", "#16A34A", "#EA580C", "#DB2777", "#9333EA", "#EAB308", "#000000", "#FFFFFF"];

const ALL_STICKERS = [
  "⭐", "🌟", "❤️", "😊", "🎉", "🌈", "🌸", "🚀",
  "🦋", "🐱", "🐶", "🌞", "🎈", "🍎", "🏆", "📚",
  "✨", "🎨", "🦄", "🌳", "☀️", "🎯", "🦖", "🐼",
  "🐬", "🍦", "🍭", "🍀", "💎", "🦁", "🐢", "⚽",
];

// Helper: Convert array of points {x, y} to SVG Path data string 'd'
function pointsToSvgPath(pts: { x: number; y: number }[]): string {
  if (!pts || pts.length === 0) return "";
  if (pts.length === 1) {
    const p = pts[0]!;
    return `M ${p.x} ${p.y} L ${p.x + 0.1} ${p.y + 0.1}`;
  }
  let d = `M ${pts[0]!.x} ${pts[0]!.y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1]!;
    const curr = pts[i]!;
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;
    d += ` Q ${prev.x} ${prev.y}, ${midX} ${midY}`;
  }
  const last = pts[pts.length - 1]!;
  d += ` L ${last.x} ${last.y}`;
  return d;
}

export type PageCanvasHandle = {
  undo: () => void;
  redo: () => void;
  clear: () => void;
};

// -------------------------------------------------------------
// DECLARATIVE & ISOLATED SINGLE PAGE COMPONENT
// Renders SVG vector paths and text nodes strictly bound to page.
// Guaranteed 100% destruction on page change via React key.
// -------------------------------------------------------------
const SinglePageCanvas = forwardRef<
  PageCanvasHandle,
  {
    page: NotebookPage;
    tool: ToolType;
    color: string;
    isMathsBook: boolean;
    onUpdatePage: (updated: NotebookPage) => void;
    showStickerGallery: boolean;
    setShowStickerGallery: (show: boolean) => void;
    onShowToast: (msg: string) => void;
    setTool: (t: ToolType) => void;
  }
>(function SinglePageCanvas(
  {
    page,
    tool,
    color,
    isMathsBook,
    onUpdatePage,
    showStickerGallery,
    setShowStickerGallery,
    onShowToast,
    setTool,
  },
  ref
) {
  const transientCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<Stroke[]>(page.strokes || []);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);

  // Selection & drag state for text and stickers
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  const draggingObject = useRef<{ type: "sticker" | "text"; id: string; offsetX: number; offsetY: number } | null>(null);
  const isDrawing = useRef(false);
  const currentLiveStroke = useRef<Stroke | null>(null);

  const currentStyleOption = PAGE_STYLES.find((s) => s.id === page.style) || PAGE_STYLES[0]!;

  // PHASE 3 DEBUG LOG ON MOUNT
  useEffect(() => {
    console.log(`[SmartSlate] MOUNTED PAGE: id=${page.id}, pageNumber=${page.pageNumber}, style=${page.style}, strokes=${(page.strokes || []).length}, texts=${(page.texts || []).length}, stickers=${(page.stickers || []).length}`);
    strokesRef.current = page.strokes || [];
    setRedoStack([]);

    const canvas = transientCanvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width);
      canvas.height = Math.round(rect.height);
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      console.log(`[SmartSlate] UNMOUNTED PAGE: id=${page.id}`);
      const c = transientCanvasRef.current;
      if (c) {
        const ctx = c.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, c.width, c.height);
      }
    };
  }, [page.id]);

  // Keep strokes ref in sync
  useEffect(() => {
    strokesRef.current = page.strokes || [];
  }, [page.strokes]);

  // Expose Undo/Redo/Clear to parent toolbar
  useImperativeHandle(ref, () => ({
    undo: () => {
      if (strokesRef.current.length === 0) return;
      const last = strokesRef.current[strokesRef.current.length - 1]!;
      const updated = strokesRef.current.slice(0, -1);
      strokesRef.current = updated;
      setRedoStack((r) => [...r, last]);
      onUpdatePage({ ...page, strokes: updated });
    },
    redo: () => {
      if (redoStack.length === 0) return;
      const last = redoStack[redoStack.length - 1]!;
      setRedoStack((r) => r.slice(0, -1));
      const updated = [...strokesRef.current, last];
      strokesRef.current = updated;
      onUpdatePage({ ...page, strokes: updated });
    },
    clear: () => {
      strokesRef.current = [];
      setRedoStack([]);
      setSelectedStickerId(null);
      setSelectedTextId(null);
      setEditingTextId(null);
      const c = transientCanvasRef.current;
      if (c) {
        const ctx = c.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, c.width, c.height);
      }
      onUpdatePage({ ...page, strokes: [], texts: [], stickers: [] });
    },
  }));

  const getCanvasPos = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: Math.round(e.clientX - rect.left), y: Math.round(e.clientY - rect.top) };
  };

  // Helper to erase strokes intersecting with a point (x, y)
  const eraseStrokesAtPoint = (pos: { x: number; y: number }, radius: number = 24) => {
    const currentStrokes = strokesRef.current || [];
    const remaining = currentStrokes.filter((stk) => {
      const margin = (stk.width || 8) / 2 + radius;
      const marginSq = margin * margin;
      return !stk.points.some((p) => {
        const dx = p.x - pos.x;
        const dy = p.y - pos.y;
        return dx * dx + dy * dy <= marginSq;
      });
    });
    if (remaining.length !== currentStrokes.length) {
      strokesRef.current = remaining;
      onUpdatePage({ ...page, strokes: remaining });
    }
  };

  // POINTER HANDLERS
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (tool === "select") {
      setSelectedStickerId(null);
      setSelectedTextId(null);
      setEditingTextId(null);
      return;
    }

    const pos = getCanvasPos(e);

    // 🧽 ERASER TOOL
    if (tool === "eraser") {
      e.currentTarget.setPointerCapture(e.pointerId);
      isDrawing.current = true;
      eraseStrokesAtPoint(pos, 24);

      const canvas = transientCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.save();
          ctx.strokeStyle = "#EF4444";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 24, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }
      return;
    }

    // 🔤 TEXT TOOL (Click to place clean editable text box)
    if (tool === "text") {
      const newText: TextItem = {
        id: `txt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        content: "Type note...",
        x: pos.x,
        y: pos.y,
        color,
        size: "lg",
        bold: true,
      };
      const updatedTexts = [...(page.texts || []), newText];
      onUpdatePage({ ...page, texts: updatedTexts });
      setSelectedTextId(newText.id);
      setEditingTextId(newText.id);
      setTool("select");
      return;
    }

    // 🖼️ STICKER TOOL
    if (tool === "sticker") {
      setShowStickerGallery(true);
      return;
    }

    // DRAWING TOOLS (Pen, Brush, Crayon, Highlight)
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawing.current = true;
    setRedoStack([]);

    const strokeWidth = tool === "pen" ? 3 : tool === "brush" ? 12 : tool === "crayon" ? 8 : tool === "highlight" ? 24 : 32;

    const newStroke: Stroke = {
      type: tool,
      points: [pos],
      color,
      width: strokeWidth,
    };
    currentLiveStroke.current = newStroke;

    // Draw initial point on transient overlay
    const canvas = transientCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = strokeWidth;
        if (tool === "brush") ctx.globalAlpha = 0.55;
        if (tool === "highlight") ctx.globalAlpha = 0.35;
        if (tool === "crayon") ctx.globalAlpha = 0.75;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, strokeWidth / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pos = getCanvasPos(e);

    if (tool === "eraser") {
      if (!isDrawing.current) return;
      eraseStrokesAtPoint(pos, 24);

      const canvas = transientCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.save();
          ctx.strokeStyle = "#EF4444";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 24, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }
      return;
    }

    if (!isDrawing.current || !currentLiveStroke.current) return;
    currentLiveStroke.current.points.push(pos);

    const canvas = transientCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const pts = currentLiveStroke.current.points;
        const prev = pts[pts.length - 2] || pos;

        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = currentLiveStroke.current.width;
        if (tool === "brush") ctx.globalAlpha = 0.55;
        if (tool === "highlight") ctx.globalAlpha = 0.35;
        if (tool === "crayon") ctx.globalAlpha = 0.75;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        ctx.restore();
      }
    }
  };

  const handlePointerUp = () => {
    if (tool === "eraser") {
      isDrawing.current = false;
      const canvas = transientCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    if (isDrawing.current && currentLiveStroke.current) {
      const updated = [...strokesRef.current, currentLiveStroke.current];
      strokesRef.current = updated;
      onUpdatePage({ ...page, strokes: updated });

      // Wipe transient canvas now that SVG path is committed
      const canvas = transientCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    isDrawing.current = false;
    currentLiveStroke.current = null;
  };

  // DRAGGING TEXT & STICKERS
  const handleObjectPointerDown = (
    e: React.PointerEvent,
    type: "sticker" | "text",
    id: string,
    curX: number,
    curY: number
  ) => {
    e.stopPropagation();
    if (type === "sticker") {
      setSelectedStickerId(id);
      setSelectedTextId(null);
    } else {
      setSelectedTextId(id);
      setSelectedStickerId(null);
    }

    draggingObject.current = {
      type,
      id,
      offsetX: e.clientX - curX,
      offsetY: e.clientY - curY,
    };

    const handlePointerMoveGlobal = (moveEvt: PointerEvent) => {
      if (!draggingObject.current) return;
      const { type, id, offsetX, offsetY } = draggingObject.current;
      const newX = Math.max(10, moveEvt.clientX - offsetX);
      const newY = Math.max(10, moveEvt.clientY - offsetY);

      if (type === "sticker") {
        onUpdatePage({
          ...page,
          stickers: (page.stickers || []).map((s) => (s.id === id ? { ...s, x: newX, y: newY } : s)),
        });
      } else {
        onUpdatePage({
          ...page,
          texts: (page.texts || []).map((t) => (t.id === id ? { ...t, x: newX, y: newY } : t)),
        });
      }
    };

    const handlePointerUpGlobal = () => {
      draggingObject.current = null;
      window.removeEventListener("pointermove", handlePointerMoveGlobal);
      window.removeEventListener("pointerup", handlePointerUpGlobal);
    };

    window.addEventListener("pointermove", handlePointerMoveGlobal);
    window.addEventListener("pointerup", handlePointerUpGlobal);
  };

  const deleteSticker = (id: string) => {
    onUpdatePage({
      ...page,
      stickers: (page.stickers || []).filter((s) => s.id !== id),
    });
    setSelectedStickerId(null);
  };

  const deleteText = (id: string) => {
    onUpdatePage({
      ...page,
      texts: (page.texts || []).filter((t) => t.id !== id),
    });
    setSelectedTextId(null);
    setEditingTextId(null);
  };

  const addSticker = (emoji: string) => {
    const newSticker: StickerItem = {
      id: `stk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      content: emoji,
      x: 180,
      y: 180,
      size: 56,
    };

    onUpdatePage({
      ...page,
      stickers: [...(page.stickers || []), newSticker],
    });
    setSelectedStickerId(newSticker.id);
    setShowStickerGallery(false);
    setTool("select");
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        background: currentStyleOption.bgStyle,
        backgroundAttachment: "local",
      }}
    >
      {/* LAYER 1: MATHEMATICS SINGLE-LINE BORDER ON TOP, LEFT, RIGHT */}
      {page.style === "math_border" ? (
        <div className="absolute inset-x-5 top-5 bottom-0 border-t-2 border-l-2 border-r-2 border-slate-400/85 pointer-events-none rounded-t-xl z-0" />
      ) : null}

      {/* LAYER 2: COMMITTED DRAWINGS RENDERED AS DECLARATIVE SVG PATHS */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        {(page.strokes || []).map((stk, idx) => {
          const pathData = pointsToSvgPath(stk.points);
          if (!pathData) return null;

          if (stk.type === "pen") {
            return (
              <path
                key={`stroke-${idx}`}
                d={pathData}
                stroke={stk.color}
                strokeWidth={stk.width || 3}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            );
          } else if (stk.type === "brush") {
            return (
              <path
                key={`stroke-${idx}`}
                d={pathData}
                stroke={stk.color}
                strokeWidth={stk.width || 12}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity={0.55}
              />
            );
          } else if (stk.type === "crayon") {
            return (
              <path
                key={`stroke-${idx}`}
                d={pathData}
                stroke={stk.color}
                strokeWidth={stk.width || 8}
                strokeLinecap="round"
                strokeLinejoin="bevel"
                fill="none"
                opacity={0.75}
                strokeDasharray="2,1"
              />
            );
          } else if (stk.type === "highlight") {
            return (
              <path
                key={`stroke-${idx}`}
                d={pathData}
                stroke={stk.color}
                strokeWidth={stk.width || 24}
                strokeLinecap="butt"
                strokeLinejoin="miter"
                fill="none"
                opacity={0.35}
              />
            );
          }
          return null;
        })}
      </svg>

      {/* LAYER 3: TRANSIENT LIVE DRAWING CANVAS */}
      <canvas
        ref={transientCanvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`absolute inset-0 w-full h-full touch-none z-0 ${
          tool === "select" ? "cursor-default" : tool === "text" ? "cursor-text" : "cursor-crosshair"
        }`}
      />

      {/* LAYER 4: INTERACTIVE MOVABLE TEXT OBJECTS */}
      {(page.texts || []).map((txt) => {
        const isSelected = selectedTextId === txt.id;
        const isEditing = editingTextId === txt.id;
        const sizeClass =
          txt.size === "sm" ? "text-base" : txt.size === "md" ? "text-xl" : txt.size === "lg" ? "text-2xl" : "text-4xl";

        return (
          <div
            key={txt.id}
            style={{ left: `${txt.x}px`, top: `${txt.y}px` }}
            onPointerDown={(e) => handleObjectPointerDown(e, "text", txt.id, txt.x, txt.y)}
            className={`absolute z-10 select-none group touch-none ${
              isSelected ? "ring-2 ring-primary ring-offset-2 rounded-xl" : ""
            }`}
          >
            {isEditing ? (
              <div className="bg-card p-2 rounded-2xl shadow-pop border-2 border-primary">
                <input
                  type="text"
                  autoFocus
                  value={txt.content}
                  onChange={(e) => {
                    const val = e.target.value;
                    onUpdatePage({
                      ...page,
                      texts: (page.texts || []).map((t) => (t.id === txt.id ? { ...t, content: val } : t)),
                    });
                  }}
                  onBlur={() => setEditingTextId(null)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setEditingTextId(null);
                  }}
                  style={{ color: txt.color }}
                  className={`font-display font-extrabold bg-transparent outline-none ${sizeClass} ${
                    txt.bold ? "font-black" : "font-normal"
                  }`}
                />
                <div className="flex items-center gap-1 mt-1 pt-1 border-t border-border">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdatePage({
                        ...page,
                        texts: (page.texts || []).map((t) => (t.id === txt.id ? { ...t, bold: !t.bold } : t)),
                      })
                    }
                    className={`p-1 rounded ${txt.bold ? "bg-primary text-primary-foreground" : "bg-accent"}`}
                  >
                    <Bold className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdatePage({
                        ...page,
                        texts: (page.texts || []).map((t) =>
                          t.id === txt.id
                            ? { ...t, size: t.size === "sm" ? "md" : t.size === "md" ? "lg" : t.size === "lg" ? "xl" : "sm" }
                            : t
                        ),
                      })
                    }
                    className="px-2 py-0.5 text-xs font-bold bg-accent rounded"
                  >
                    Size: {txt.size.toUpperCase()}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteText(txt.id)}
                    className="p-1 rounded text-red-600 hover:bg-red-100 ml-auto"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDoubleClick={() => setEditingTextId(txt.id)}
                style={{ color: txt.color }}
                className={`font-display cursor-move px-2 py-1 ${sizeClass} ${
                  txt.bold ? "font-black" : "font-normal"
                }`}
              >
                {txt.content}
                {isSelected ? (
                  <div className="absolute -top-7 right-0 flex items-center gap-1 bg-card rounded-full shadow-xs px-2 py-0.5 border border-border">
                    <button
                      type="button"
                      onClick={() => setEditingTextId(txt.id)}
                      className="text-[10px] font-bold uppercase text-primary"
                    >
                      Edit
                    </button>
                    <button type="button" onClick={() => deleteText(txt.id)} className="text-red-500">
                      <X className="size-3" />
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        );
      })}

      {/* LAYER 5: INTERACTIVE MOVABLE STICKERS */}
      {(page.stickers || []).map((stk) => {
        const isSelected = selectedStickerId === stk.id;

        return (
          <div
            key={stk.id}
            style={{
              left: `${stk.x}px`,
              top: `${stk.y}px`,
              fontSize: `${stk.size}px`,
            }}
            onPointerDown={(e) => handleObjectPointerDown(e, "sticker", stk.id, stk.x, stk.y)}
            className={`absolute z-10 cursor-move select-none touch-none transition-transform ${
              isSelected ? "ring-2 ring-primary ring-offset-2 rounded-2xl scale-110 shadow-pop" : "hover:scale-105"
            }`}
          >
            <span>{stk.content}</span>
            {isSelected ? (
              <div className="absolute -top-8 right-0 flex items-center gap-1 bg-card rounded-full shadow-pop px-2 py-1 border border-border">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdatePage({
                      ...page,
                      stickers: (page.stickers || []).map((s) =>
                        s.id === stk.id ? { ...s, size: Math.min(96, s.size + 12) } : s
                      ),
                    });
                  }}
                  className="size-5 grid place-items-center text-xs font-extrabold bg-accent rounded-full"
                  title="Bigger"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdatePage({
                      ...page,
                      stickers: (page.stickers || []).map((s) =>
                        s.id === stk.id ? { ...s, size: Math.max(32, s.size - 12) } : s
                      ),
                    });
                  }}
                  className="size-5 grid place-items-center text-xs font-extrabold bg-accent rounded-full"
                  title="Smaller"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSticker(stk.id);
                  }}
                  className="size-5 grid place-items-center text-xs font-extrabold text-red-600 bg-red-100 rounded-full"
                  title="Delete"
                >
                  <X className="size-3" />
                </button>
              </div>
            ) : null}
          </div>
        );
      })}

      {/* STICKER GALLERY POPUP */}
      {showStickerGallery ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-[2.5rem] bg-card p-6 shadow-pop animate-pop-in">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="font-display text-2xl font-extrabold uppercase flex items-center gap-2">
                🖼️ Choose a Sticker
              </h2>
              <button
                type="button"
                onClick={() => setShowStickerGallery(false)}
                className="grid size-10 place-items-center rounded-full bg-accent hover:bg-accent/80"
              >
                <X className="size-6" />
              </button>
            </div>
            <p className="text-sm font-semibold text-muted-foreground mt-2">
              Tap any sticker to place and drag it around on Page {page.pageNumber}:
            </p>

            <div className="mt-4 grid grid-cols-6 sm:grid-cols-8 gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
              {ALL_STICKERS.map((stk) => (
                <button
                  key={stk}
                  type="button"
                  onClick={() => addSticker(stk)}
                  className="grid aspect-square place-items-center rounded-2xl bg-accent text-3xl transition-transform hover:scale-125 active:scale-95 shadow-xs"
                >
                  {stk}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
});

// -------------------------------------------------------------
// MAIN NOTEBOOK WRAPPER COMPONENT
// -------------------------------------------------------------
export function NoteEditor() {
  const { id } = useParams({ from: "/student/notes/$id" });
  const subject = subjects.find((s) => s.id === id) ?? {
    id: id || "custom",
    name: "Notebook",
    desc: "School Notebook",
    emoji: "📖",
    color: "blue" as const,
    notes: 3,
  };

  const isMathsBook = subject.id === "maths" || subject.id === "mathematics";
  const [notebook, setNotebook] = useState<NotebookData>(() => loadNotebook(subject.id, subject.notes || 3));
  const [activePageIndex, setActivePageIndex] = useState(0);

  // Active Tool & Palette State
  const [tool, setTool] = useState<ToolType>("pen");
  const [color, setColor] = useState<string>(penColors[1]!);
  const [showStickerGallery, setShowStickerGallery] = useState(false);
  const [showPageStyleModal, setShowPageStyleModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const pageCanvasRef = useRef<PageCanvasHandle | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Active Page Reference
  const currentPage: NotebookPage =
    notebook.pages[activePageIndex] ||
    notebook.pages[0] ||
    createFreshPage(1, isMathsBook ? "math_border" : "single");

  const currentStyleOption = PAGE_STYLES.find((s) => s.id === currentPage.style) || PAGE_STYLES[0]!;

  // UPDATE ONLY ACTIVE PAGE
  const handleUpdatePage = (updatedPage: NotebookPage) => {
    setNotebook((prev) => {
      const pages = [...prev.pages];
      pages[activePageIndex] = updatedPage;
      const updatedNotebook = { ...prev, pages };
      saveNotebook(subject.id, updatedNotebook);
      return updatedNotebook;
    });
  };

  // CHANGE ACTIVE PAGE
  const switchPage = (newIndex: number) => {
    if (newIndex < 0 || newIndex >= notebook.pages.length) return;
    const oldPage = notebook.pages[activePageIndex];
    const newPage = notebook.pages[newIndex];
    console.log(`[SmartSlate] PAGE SWITCH: From Page ${activePageIndex + 1} (${oldPage?.id}) to Page ${newIndex + 1} (${newPage?.id}) | Target Page Data:`, {
      id: newPage?.id,
      style: newPage?.style,
      strokes: (newPage?.strokes || []).length,
      texts: (newPage?.texts || []).length,
      stickers: (newPage?.stickers || []).length,
    });

    saveNotebook(subject.id, notebook);
    setActivePageIndex(newIndex);
  };

  // ADD NEW FRESH PAGE
  const handleAddNewPage = () => {
    const newPage = createFreshPage(notebook.pages.length + 1, isMathsBook ? "math_border" : "single");
    const updatedNotebook = {
      ...notebook,
      pages: [...notebook.pages, newPage],
    };
    setNotebook(updatedNotebook);
    saveNotebook(subject.id, updatedNotebook);
    setActivePageIndex(updatedNotebook.pages.length - 1);
    showToast(`Page ${updatedNotebook.pages.length} Created! ✨`);
  };

  const handleSave = () => {
    saveNotebook(subject.id, notebook);
    showToast("Notebook Saved! 💾");
  };

  const handleSelectPageStyle = (styleId: PageStyleId) => {
    handleUpdatePage({ ...currentPage, style: styleId });
    setShowPageStyleModal(false);
  };

  const ToolBtn = ({
    label,
    emoji,
    active,
    onClick,
  }: {
    label: string;
    emoji: string;
    active?: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex min-h-14 min-w-14 sm:min-h-16 sm:min-w-16 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 font-display text-[11px] sm:text-xs font-extrabold uppercase transition-all duration-150 active:scale-95 ${
        active
          ? "bg-primary text-primary-foreground shadow-soft scale-105"
          : "bg-card text-foreground shadow-xs hover:bg-accent"
      }`}
    >
      <span className="text-xl sm:text-2xl">{emoji}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden select-none animate-pop-in">
      {/* 1. TOP HEADER BAR */}
      <header className="flex shrink-0 items-center justify-between px-4 py-3 bg-card border-b border-border shadow-xs z-20">
        <div className="flex items-center gap-3">
          <Link
            to="/student"
            aria-label="Back to Home"
            className="grid size-11 place-items-center rounded-2xl bg-accent hover:bg-accent/80 transition-colors"
          >
            <ArrowLeft className="size-6 text-foreground" />
          </Link>
          <div className="flex items-center gap-2">
            <span className={`grid size-9 place-items-center rounded-xl text-lg ${tone[subject.color]}`}>
              {subject.emoji}
            </span>
            <span className="font-display text-xl sm:text-2xl font-extrabold uppercase tracking-tight truncate">
              {subject.name}
            </span>
          </div>
        </div>

        {/* MULTI-PAGE CONTROLS */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            disabled={activePageIndex <= 0}
            onClick={() => switchPage(activePageIndex - 1)}
            className="grid size-10 place-items-center rounded-xl bg-accent disabled:opacity-40 hover:bg-accent/80"
            title="Previous Page"
          >
            <ChevronLeft className="size-5" />
          </button>

          <span className="font-display text-sm sm:text-base font-extrabold px-2">
            Page {activePageIndex + 1} of {notebook.pages.length}
          </span>

          <button
            type="button"
            disabled={activePageIndex >= notebook.pages.length - 1}
            onClick={() => switchPage(activePageIndex + 1)}
            className="grid size-10 place-items-center rounded-xl bg-accent disabled:opacity-40 hover:bg-accent/80"
            title="Next Page"
          >
            <ChevronRight className="size-5" />
          </button>

          <button
            type="button"
            onClick={handleAddNewPage}
            className="hidden sm:flex items-center gap-1 rounded-xl bg-accent px-3 py-2 font-display text-xs font-extrabold uppercase hover:bg-accent/80"
          >
            <Plus className="size-4" /> Add Page
          </button>
        </div>

        {/* PAGE STYLE TRIGGER & SAVE BUTTON */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPageStyleModal(true)}
            className="flex items-center gap-1.5 rounded-2xl bg-accent px-3.5 py-2 font-display text-xs sm:text-sm font-extrabold uppercase hover:bg-accent/80 shadow-xs"
          >
            <span className="text-base">{currentStyleOption.emoji}</span>
            <span>{currentStyleOption.name}</span>
          </button>

          <BigButton color="green" onClick={handleSave} className="min-h-11 px-5 text-sm sm:text-base">
            <Save className="size-4" /> Save
          </BigButton>
        </div>
      </header>

      {/* 2. PAGE STYLE SELECTOR MODAL */}
      {showPageStyleModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[2.5rem] bg-card p-6 shadow-pop animate-pop-in">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="font-display text-2xl font-extrabold uppercase flex items-center gap-2">
                📄 Choose Page Style
              </h2>
              <button
                type="button"
                onClick={() => setShowPageStyleModal(false)}
                className="grid size-10 place-items-center rounded-full bg-accent hover:bg-accent/80"
              >
                <X className="size-6" />
              </button>
            </div>
            <p className="text-sm font-semibold text-muted-foreground mt-2">
              Select rule style for <strong>Page {activePageIndex + 1}</strong>:
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto">
              {PAGE_STYLES.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => handleSelectPageStyle(st.id)}
                  className={`flex flex-col gap-2 rounded-2xl p-4 text-left transition-all border-2 ${
                    currentPage.style === st.id
                      ? "border-primary bg-primary/10 shadow-soft"
                      : "border-border bg-accent hover:bg-accent/80"
                  }`}
                >
                  <div
                    className={`h-14 w-full rounded-xl border border-slate-300 shadow-xs ${
                      st.id === "math_border" ? "border-t-2 border-l-2 border-r-2 border-slate-400 bg-white" : ""
                    }`}
                    style={{ background: st.bgStyle }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-extrabold uppercase">{st.name}</span>
                    {currentPage.style === st.id ? <Check className="size-4 text-primary" /> : null}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* 3. MAIN CANVAS CONTAINER — STRICTLY KEYED TO UNIQUE PAGE ID TO FORCE 100% UNMOUNT ISOLATION */}
      <main className="flex-1 relative w-full h-full overflow-hidden">
        <SinglePageCanvas
          key={currentPage.id}
          ref={pageCanvasRef}
          page={currentPage}
          tool={tool}
          color={color}
          isMathsBook={isMathsBook}
          onUpdatePage={handleUpdatePage}
          showStickerGallery={showStickerGallery}
          setShowStickerGallery={setShowStickerGallery}
          onShowToast={showToast}
          setTool={setTool}
        />

        {/* TOAST NOTIFICATION */}
        {toastMessage ? (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-green text-green-950 px-6 py-2.5 font-display text-base font-extrabold uppercase shadow-pop animate-pop-in flex items-center gap-2 z-30">
            <Check className="size-5" /> {toastMessage}
          </div>
        ) : null}
      </main>

      {/* 4. BOTTOM DRAWING & TOOLBAR */}
      <footer className="shrink-0 bg-card/95 border-t border-border px-3 py-2 shadow-pop z-20">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2">
          {/* PRIMARY VISIBLE DRAWING TOOLS */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1">
            <ToolBtn label="Select" emoji="✋" active={tool === "select"} onClick={() => setTool("select")} />
            <ToolBtn label="Pen" emoji="✏️" active={tool === "pen"} onClick={() => setTool("pen")} />
            <ToolBtn label="Brush" emoji="🖌️" active={tool === "brush"} onClick={() => setTool("brush")} />
            <ToolBtn label="Crayon" emoji="🖍️" active={tool === "crayon"} onClick={() => setTool("crayon")} />
            <ToolBtn label="Highlight" emoji="🟡" active={tool === "highlight"} onClick={() => setTool("highlight")} />
            <ToolBtn label="Eraser" emoji="🧽" active={tool === "eraser"} onClick={() => setTool("eraser")} />
            <ToolBtn label="Text" emoji="🔤" active={tool === "text"} onClick={() => setTool("text")} />
            <ToolBtn label="Stickers" emoji="🖼️" active={showStickerGallery} onClick={() => setShowStickerGallery(true)} />
          </div>

          {/* PALETTE COLORS */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-border">
            {penColors.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Pick colour ${c}`}
                onClick={() => {
                  setColor(c);
                  if (tool === "eraser" || tool === "select") setTool("pen");
                }}
                style={{ backgroundColor: c }}
                className={`size-8 sm:size-9 rounded-full border-2 transition-transform active:scale-90 ${
                  color === c ? "border-foreground ring-2 ring-primary ring-offset-1 scale-110 shadow-soft" : "border-card shadow-xs"
                }`}
              />
            ))}
          </div>

          {/* UNDO / REDO / CLEAR */}
          <div className="flex items-center gap-1 pl-2 border-l border-border">
            <button
              type="button"
              onClick={() => pageCanvasRef.current?.undo()}
              title="Undo"
              className="grid size-10 place-items-center rounded-xl bg-accent hover:bg-accent/80 active:scale-95"
            >
              <Undo2 className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => pageCanvasRef.current?.redo()}
              title="Redo"
              className="grid size-10 place-items-center rounded-xl bg-accent hover:bg-accent/80 active:scale-95"
            >
              <Redo2 className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm("Clear all drawings and content on this page?")) {
                  pageCanvasRef.current?.clear();
                }
              }}
              title="Clear Current Page"
              className="grid size-10 place-items-center rounded-xl bg-accent hover:bg-red-100 text-red-600 active:scale-95"
            >
              <Trash2 className="size-5" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
