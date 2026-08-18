import { subjects, type Subject } from "./data";
import { BookOpen } from "lucide-react";

export type PageStyleId = "white" | "math_border" | "single" | "double" | "four_rule" | "grid" | "dotted";

export type PageStyleOption = {
  id: PageStyleId;
  name: string;
  emoji: string;
  previewClass: string;
  bgStyle: string;
  hasMathBorder?: boolean;
};

export const PAGE_STYLES: PageStyleOption[] = [
  {
    id: "math_border",
    name: "Maths Border",
    emoji: "┌─┐",
    previewClass: "bg-white",
    bgStyle: "#ffffff",
    hasMathBorder: true,
  },
  {
    id: "white",
    name: "White Page",
    emoji: "◻",
    previewClass: "bg-white",
    bgStyle: "#ffffff",
  },
  {
    id: "single",
    name: "Single Rule",
    emoji: "─",
    previewClass: "bg-white",
    bgStyle: "repeating-linear-gradient(to bottom, #ffffff 0 31px, #CBD5E1 31px 32px)",
  },
  {
    id: "double",
    name: "Double Rule",
    emoji: "═",
    previewClass: "bg-white",
    bgStyle:
      "repeating-linear-gradient(to bottom, #ffffff 0 20px, #3B82F6 20px 21.5px, #ffffff 21.5px 33.5px, #3B82F6 33.5px 35px, #ffffff 35px 56px)",
  },
  {
    id: "four_rule",
    name: "Four Rule",
    emoji: "─",
    previewClass: "bg-white",
    bgStyle:
      "repeating-linear-gradient(to bottom, #ffffff 0 16px, #EF4444 16px 17.5px, #ffffff 17.5px 29.5px, #3B82F6 29.5px 31px, #ffffff 31px 43px, #3B82F6 43px 44.5px, #ffffff 44.5px 56.5px, #EF4444 56.5px 58px, #ffffff 58px 76px)",
  },
  {
    id: "grid",
    name: "Grid / Checks",
    emoji: "☐",
    previewClass: "bg-white",
    bgStyle:
      "linear-gradient(to right, #CBD5E1 1px, transparent 1px) 0 0 / 28px 28px #ffffff, linear-gradient(to bottom, #CBD5E1 1px, transparent 1px) 0 0 / 28px 28px",
  },
  {
    id: "dotted",
    name: "Dotted",
    emoji: "·",
    previewClass: "bg-white",
    bgStyle:
      "radial-gradient(circle, #94A3B8 1.5px, transparent 1.5px) 0 0 / 24px 24px #ffffff",
  },
];

export type ToolType = "select" | "pen" | "brush" | "crayon" | "highlight" | "fill" | "eraser" | "text" | "sticker";

export type Stroke = {
  type: ToolType;
  points: { x: number; y: number }[];
  color: string;
  width: number;
};

export type StickerItem = {
  id: string;
  content: string;
  x: number;
  y: number;
  size: number;
};

export type TextItem = {
  id: string;
  content: string;
  x: number;
  y: number;
  color: string;
  size: "sm" | "md" | "lg" | "xl";
  bold: boolean;
};

export type NotebookPage = {
  id: string;
  pageNumber: number;
  style: PageStyleId;
  strokes: Stroke[];
  texts: TextItem[];
  stickers: StickerItem[];
};

export type NotebookData = {
  subjectId: string;
  pages: NotebookPage[];
};

const STORAGE_CUSTOM_BOOKS = "smartslate-custom-books";

export function getAllBooks(): Subject[] {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_CUSTOM_BOOKS) : null;
    const custom: Subject[] = raw ? JSON.parse(raw) : [];
    const customWithIcons = custom.map((b) => ({ ...b, icon: BookOpen }));
    return [...subjects, ...customWithIcons];
  } catch (e) {
    console.error(e);
    return subjects;
  }
}

export function saveCustomBook(book: Subject): Subject[] {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_CUSTOM_BOOKS) : null;
    const custom: Subject[] = raw ? JSON.parse(raw) : [];
    const updated = [...custom, { ...book, icon: undefined }];
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_CUSTOM_BOOKS, JSON.stringify(updated));
    }
    return getAllBooks();
  } catch (e) {
    console.error(e);
    return getAllBooks();
  }
}

export function createFreshPage(pageNumber: number, defaultStyle: PageStyleId = "single"): NotebookPage {
  return {
    id: `page-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    pageNumber,
    style: defaultStyle,
    strokes: [],
    texts: [],
    stickers: [],
  };
}

export function loadNotebook(subjectId: string, initialPageCount: number = 3): NotebookData {
  const isMaths = subjectId === "maths" || subjectId === "mathematics";
  const defaultPageStyle: PageStyleId = isMaths ? "math_border" : "single";

  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(`smartslate-note-v4-${subjectId}`) : null;
    if (raw) {
      const parsed: NotebookData = JSON.parse(raw);
      if (parsed.pages && parsed.pages.length > 0) {
        // Deep clone to ensure zero shared array references
        const cleanPages: NotebookPage[] = parsed.pages.map((p, idx) => ({
          id: p.id || `page-${idx + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          pageNumber: p.pageNumber || idx + 1,
          style: p.style || defaultPageStyle,
          strokes: Array.isArray(p.strokes) ? JSON.parse(JSON.stringify(p.strokes)) : [],
          texts: Array.isArray(p.texts) ? JSON.parse(JSON.stringify(p.texts)) : [],
          stickers: Array.isArray(p.stickers) ? JSON.parse(JSON.stringify(p.stickers)) : [],
        }));
        return {
          subjectId,
          pages: cleanPages,
        };
      }
    }
  } catch (e) {
    console.error("Error loading notebook:", e);
  }

  // Generate initial fresh pages with unique isolated arrays
  const initialPages: NotebookPage[] = [];
  for (let i = 1; i <= Math.max(1, initialPageCount); i++) {
    initialPages.push(createFreshPage(i, defaultPageStyle));
  }

  return {
    subjectId,
    pages: initialPages,
  };
}

import { syncNoteToFirestore } from "@/firebase/services/notesService";

export function saveNotebook(subjectId: string, data: NotebookData): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(`smartslate-note-v4-${subjectId}`, JSON.stringify(data));
    }
    // Asynchronously synchronize with Cloud Firestore (without blocking local UI)
    syncNoteToFirestore(subjectId, data).catch((e) => {
      console.warn("[SmartSlate] Offline note save notice:", e);
    });
  } catch (e) {
    console.error("Error saving notebook:", e);
  }
}



