/** Source asset dimensions (notebook.png after trim). */
export const NOTEBOOK_WIDTH = 736;
export const NOTEBOOK_HEIGHT = 608;
/** Display height: tuned to fit the full import page on iPhone 15 Plus. */
export const NOTEBOOK_DISPLAY_HEIGHT = 590;

/** Processed page-flag button art (after trim). */
export const PAGE_FLAG_WIDTH = 1472;
export const PAGE_FLAG_HEIGHT = 460;
export const PAGE_FLAG_ASPECT_RATIO = PAGE_FLAG_WIDTH / PAGE_FLAG_HEIGHT;
/** Display width for Import / Extract buttons (same size). */
export const PAGE_FLAG_DISPLAY_WIDTH = 168;
export const STATUS_STRIP_WIDTH = 483;
export const STATUS_STRIP_HEIGHT = 139;
export const STATUS_STRIP_ASPECT_RATIO =
  STATUS_STRIP_WIDTH / STATUS_STRIP_HEIGHT;

/** Row rhythm for ruled form lines (CSS px). */
export const NOTEBOOK_ROW_HEIGHT = 38;

/** Visible ruled line — border on row cells (reliable vs 1px divs). */
export const notebookRowBorderClassName =
  "border-b border-solid border-[#222222]/65";
/** White writing area inset on notebook art (percent of container). */
export const notebookWritingArea = {
  paddingTop: "5%",
  paddingRight: "7%",
  paddingBottom: "6%",
  paddingLeft: "14%",
} as const;

export const notebookInputClassName =
  "w-full border-0 bg-transparent px-0 text-sm italic text-[#222222] placeholder:text-[#222222]/55 focus:outline-none focus:ring-0 [background:transparent]";

export const notebookTextareaClassName =
  "w-full resize-none border-0 bg-transparent px-0 py-0 text-sm italic text-[#222222] placeholder:text-[#222222]/55 focus:outline-none focus:ring-0 [background:transparent]";

export const notebookLabelClassName =
  "block text-[0.8125rem] font-bold italic leading-snug text-[#222222]/70";

/** Parenthetical hint on labels — regular weight per reference. */
export const notebookLabelOptionalClassName = "font-normal";

/**
 * Transcript paste area: one placeholder row + ruled lines below (reference).
 */
export const NOTEBOOK_TEXTAREA_RULED_LINES = 2;

/** Status strip — narrower than notebook, per reference. */
export const STATUS_STRIP_DISPLAY_WIDTH_PERCENT = 78;

/** Status strip text overlay — right of binder rings on sticky-notes art. */
export const statusStripTextInset = {
  left: "24%",
  right: "5%",
  top: "22%",
  bottom: "16%",
} as const;

/** Idle title — horizontally centered in strip (clear of left rings). */
export const statusStripIdleTextInset = {
  left: "22%",
  right: "22%",
  top: "22%",
  bottom: "16%",
} as const;

export const STATUS_STRIP_IDLE_MESSAGE = "Import/Extract Result";
