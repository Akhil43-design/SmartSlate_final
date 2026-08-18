const bookCoverThemes: Record<string, { bg: string; spine: string; accent: string; label: string }> = {
  maths: {
    bg: "from-blue-600 to-indigo-700",
    spine: "bg-blue-900",
    accent: "bg-blue-400/30",
    label: "Mathematics",
  },
  science: {
    bg: "from-emerald-600 to-teal-700",
    spine: "bg-emerald-900",
    accent: "bg-emerald-400/30",
    label: "Science",
  },
  english: {
    bg: "from-purple-600 to-violet-800",
    spine: "bg-purple-950",
    accent: "bg-purple-400/30",
    label: "English",
  },
  social: {
    bg: "from-amber-600 to-orange-700",
    spine: "bg-amber-950",
    accent: "bg-amber-400/30",
    label: "EVS / Social",
  },
  art: {
    bg: "from-pink-500 to-rose-600",
    spine: "bg-pink-950",
    accent: "bg-pink-300/30",
    label: "Art & Drawing",
  },
};

export function DigitalBookCover({
  book,
  onOpen,
}: {
  book: Subject;
  onOpen: (book: Subject) => void;
}) {
  const theme = bookCoverThemes[book.id] || {
    bg: "from-sky-600 to-blue-700",
    spine: "bg-sky-950",
    accent: "bg-sky-400/30",
    label: book.name,
  };

  return (
    <div className="group relative flex flex-col items-center select-none">
      {/* 3D ILLUSTRATED PHYSICAL SCHOOL BOOK */}
      <div
        onClick={() => onOpen(book)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onOpen(book)}
        className="relative w-48 sm:w-56 h-64 sm:h-72 cursor-pointer transition-all duration-300 transform group-hover:-translate-y-3 group-hover:rotate-1 group-active:scale-95"
      >
        {/* RIGHT & BOTTOM PAPER PAGE THICKNESS EFFECT */}
        <div className="absolute inset-y-1 -right-2 sm:-right-3 w-4 bg-amber-50 rounded-r-lg border-y border-r border-amber-200 shadow-md transform skew-y-1" />
        <div className="absolute -bottom-2 sm:-bottom-3 inset-x-2 h-4 bg-amber-50 rounded-b-lg border-x border-b border-amber-200 shadow-lg transform skew-x-1" />

        {/* MAIN HARDCOVER NOTEBOOK BODY */}
        <div
          className={`relative h-full w-full rounded-r-2xl rounded-l-md bg-gradient-to-br ${theme.bg} shadow-2xl p-4 flex flex-col justify-between overflow-hidden border-t border-white/20`}
        >
          {/* NOTEBOOK SPINE (LEFT EDGE BAND WITH STITCHING) */}
          <div
            className={`absolute top-0 bottom-0 left-0 w-6 sm:w-7 ${theme.spine} border-r border-black/20 shadow-inner flex flex-col justify-between py-4 items-center`}
          >
            <div className="w-1 h-3 bg-white/30 rounded-full" />
            <div className="w-1 h-3 bg-white/30 rounded-full" />
            <div className="w-1 h-3 bg-white/30 rounded-full" />
            <div className="w-1 h-3 bg-white/30 rounded-full" />
            <div className="w-1 h-3 bg-white/30 rounded-full" />
          </div>

          {/* FRONT COVER EMBOSSED BORDER */}
          <div className="absolute inset-y-2 right-2 left-8 sm:left-9 border border-white/20 rounded-r-xl pointer-events-none" />

          {/* TOP COVER BADGE */}
          <div className="pl-6 sm:pl-7 flex items-center justify-between z-10">
            <span className="rounded-full bg-black/30 backdrop-blur-xs px-2.5 py-0.5 font-display text-[10px] font-extrabold uppercase tracking-wider text-white">
              Grade 1–5
            </span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 font-display text-[10px] font-extrabold text-white">
              {book.notes || 3} Pages
            </span>
          </div>

          {/* CENTER EMBLEM & SUBJECT TITLE */}
          <div className="pl-6 sm:pl-7 my-auto text-center z-10 space-y-1.5">
            <div className="mx-auto size-16 sm:size-20 grid place-items-center rounded-2xl bg-white/95 shadow-soft transform group-hover:scale-110 transition-transform">
              <span className="text-4xl sm:text-5xl">{book.emoji}</span>
            </div>
            <h3 className="font-display text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-white drop-shadow-md">
              {book.name}
            </h3>
            <p className="font-sans text-xs font-bold text-white/85 line-clamp-1">
              Digital School Notebook
            </p>
          </div>



          {/* BOTTOM OPEN BUTTON */}
          <div className="pl-6 sm:pl-7 z-10 text-center">
            <div className="w-full rounded-xl bg-white text-foreground py-2 font-display text-xs sm:text-sm font-extrabold uppercase shadow-soft group-hover:bg-yellow group-hover:text-yellow-950 transition-colors flex items-center justify-center gap-1.5">
              <span>Open Book</span>
              <span>📖</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Bookshelf({
  books,
  onOpenBook,
}: {
  books: Subject[];
  onOpenBook: (book: Subject) => void;
}) {
  return (
    <div className="relative py-6 px-2">
      {/* BOOK GRID ON SHELF */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8 justify-items-center items-end">
        {books.map((b) => (
          <DigitalBookCover key={b.id} book={b} onOpen={onOpenBook} />
        ))}
      </div>

      {/* WOODEN BOOKSHELF LEDGE */}
      <div className="mt-2 w-full">
        {/* TOP SHELF SURFACE */}
        <div className="h-4 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 rounded-t-sm shadow-md border-t border-amber-500/50" />
        {/* FRONT SHELF PLANK */}
        <div className="h-6 bg-gradient-to-b from-amber-800 to-amber-950 rounded-b-md shadow-xl border-t border-black/30 flex items-center justify-center">
          <div className="h-0.5 w-full bg-white/10" />
        </div>
      </div>
    </div>
  );
}
