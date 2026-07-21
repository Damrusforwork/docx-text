# Project Overview

This repository contains a browser-based rich-text document editor focused on Thai official documents. It provides an A4 editing preview, document templates, import and export workflows, and a separate conversion service for generating PDF and DOCX files.

# Current Status

- Status date: 2026-07-21
- Frontend: implemented in `rich-text/` and builds successfully.
- Backend: implemented in `rich-text-back/` and builds successfully.
- The editor supports unrestricted positive per-paragraph and per-heading line spacing, with recommended values of 1.0, 1.15, 1.5, and 2.0.
- Latest verification: frontend TypeScript typecheck, build and lint, backend build, document schema verification, line-spacing export verification, and signature-layout export verification passed.
- The frontend production build reports a non-blocking warning because its main JavaScript bundle is larger than 500 kB.

# Architecture

## Frontend

- React 19 and TypeScript application built with Vite.
- Tiptap 3 provides the ProseMirror-based rich-text editor and editor commands.
- `DocumentEditorPage` coordinates templates, imports, exports, margins, pagination, and the editor UI.
- Custom Tiptap extensions provide font size, line height, paragraph margin, image and table configuration, draggable tables, and pagination state.
- `DOCUMENT_PAGE_SPEC` is the canonical A4 page, margin, gap, and default typography configuration.
- Pagination measures rendered editor lines and stores calculated page-break decorations.
- The renderer produces versioned document JSON, normalized export HTML, and a render manifest used by the export API.
- Client-side PDF annotation uses `pdfjs-dist` for rendering and `pdf-lib` for writing overlays into a downloaded PDF.

## Backend

- NestJS 11 and TypeScript application exposed under `/api`.
- `POST /api/convert/pdf` converts normalized HTML to PDF.
- `POST /api/convert/docx` converts normalized HTML to ODT and then DOCX.
- LibreOffice runs headlessly as the document conversion engine.
- Embedded PNG and JPEG data URLs are materialized in a temporary directory before conversion.
- Generated DOCX image relationships are rewritten so images are embedded in the document package.
- Request size, embedded image count/size, conversion timeout, CORS, and port are configurable through environment variables.

# Current Features

## Frontend Editor

- A4 multi-page preview with current-page and total-page status.
- Adjustable page margins through presets, numeric inputs, and draggable ruler edges.
- Thai official-document templates, including internal memorandum, sealed official letter, and internal note.
- Font family and font size controls.
- Per-paragraph and per-heading line spacing with an unrestricted positive custom value and an adjacent select containing recommended values.
- Paragraph and heading levels 1-3.
- Bold, italic, underline, strikethrough, highlight, and text color.
- Left, center, right, and justified text alignment.
- Percentage-based left paragraph margins for stable right-half signature blocks across editing and export.
- Bullet lists, ordered lists, horizontal rules, and editable tables with a 10-by-10 hover grid, column resizing, whole-table drag-and-drop, and left/center/right alignment.
- PDF and DOCX exports materialize measured table and column widths plus table-specific borders and cell padding so LibreOffice preserves the browser layout.
- PNG/JPEG image import as embedded data URLs.
- Image alignment and corner resizing with preserved aspect ratio.
- Undo, redo, and clear-formatting commands.
- DOCX import through Mammoth with validation warnings.
- PDF import into an annotation mode with movable/resizable text and image overlays.
- PDF and DOCX export with progress, cancellation, retry-aware API handling, and localized error messages.
- Versioned document JSON schema and migration from legacy raw ProseMirror JSON.

## Backend Conversion

- HTML-to-PDF conversion.
- HTML-to-DOCX conversion through an intermediate ODT file.
- Thai font installation/registration support for Windows and Linux.
- Embedded image validation for type, signature, count, and total size.
- Conversion cancellation on client disconnect and configurable timeout handling.
- Structured API error codes and safe download filenames.

# In Progress

- None recorded after the 2026-07-19 line-spacing toolbar change.

# Roadmap / Planned Features

- No committed planned features are currently represented in the source repository.
- Consider lazy-loading PDF and document-processing modules if production bundle size becomes a delivery concern.
- Consider adding automated browser interaction coverage for toolbar commands and visual pagination.
- Proposed, not implemented: introduce a versioned Document Layout Core with stable node identities, canonical page plans, layout fingerprints, and target-specific page-break materializers.
- Proposed, not implemented: evaluate Vivliostyle and pinned Chromium against Thai golden documents, then use the selected paged engine for authoritative print preview and PDF output.
- Proposed, not implemented: preserve the canonical logical page plan in editable DOCX through explicit OOXML page breaks and a declared Microsoft Word/LibreOffice compatibility matrix.

# Known Issues

- PDF and DOCX export requires LibreOffice to be installed and executable on the backend host.
- The default PDF.js worker URL uses a remote CDN and therefore requires network access unless `VITE_PDF_WORKER_URL` is configured locally.
- Embedded editor images use Base64 data URLs, increasing editor state and request size for image-heavy documents.
- The frontend production bundle exceeds Vite's default 500 kB chunk warning threshold.
- Verification scripts cover document logic and export behavior, but there is no automated end-to-end browser suite in the repository.
- `npm run verify:import-validation` currently fails under Node ESM because `importValidation.ts` imports `../config` without a file extension; the Vite application build itself succeeds.
- The full golden-export suite can fail its Thai text-order assertion because LibreOffice/PDF.js may split Thai glyphs into separate text items with control characters; the table-specific geometry fixture passes independently.

# Important Decisions

- Keep `DOCUMENT_PAGE_SPEC` as the shared source for A4 dimensions, default margins, and base typography.
- Store user-selected line height as an optional string node attribute on paragraphs and headings. The renderer remains compatible with earlier numeric attributes, and documents without the attribute use the 1.5 default.
- Accept any finite positive line-height value without an upper bound; reject empty, zero, negative, nonnumeric, and infinite values to keep generated CSS valid.
- Render line height as unitless inline CSS so preview measurement and LibreOffice export receive the same selected value.
- Keep percentage-based paragraph margins in editor data, but convert them to physical centimeters from the current writable page width during export because LibreOffice does not reliably honor percentage paragraph margins.
- Use Tiptap extensions and native form controls instead of adding another UI or editor dependency.
- Use a versioned JSON envelope for editor documents and a render manifest for export layout metadata.
- Accept only embedded PNG/JPEG data URLs in backend conversion to avoid fetching arbitrary external resources.
- Use LibreOffice for server-side PDF and DOCX generation to preserve a single HTML-based conversion path.
- Do not build a complete custom text, PDF, or DOCX rendering engine. The proposed permanent architecture owns the document layout contract, page plan, break policies, and export adapters while delegating text shaping and final rendering to established engines.
- Treat visual parity and editable-document parity as separate contracts: the proposed print preview/PDF path targets visual parity in a pinned environment, while editable DOCX targets content and logical page-break parity only within declared supported viewers.

# Change History

## 2026-07-21

- Replaced the fixed 3-by-3 table toolbar action with an accessible hover grid that inserts a selected table size up to 10 rows by 10 columns through the existing Tiptap table command.
- Added `http://localhost:5174` to the backend's default and example CORS origins so a Vite frontend running on port 5174 can call the conversion API without extra environment configuration.
- Added a draggable Tiptap table view and reused the toolbar alignment controls for left-, center-, and right-aligned tables.
- Materialized live browser table and column geometry into PDF/DOCX export HTML and inlined table-only border, padding, and header styles for LibreOffice compatibility.
- Added table export regression checks, including a PDF column-spacing assertion, and visually verified full-width bordered tables in generated PDF and DOCX output.
- Fixed right-half signature blocks shifting to the center during PDF/DOCX export by converting percentage paragraph margins to physical margins based on the current A4 content width.
- Added a rendered PDF signature-position assertion and visually verified the corrected right-half placement through both direct PDF and DOCX-to-PDF output.

## 2026-07-20

- Added validated percentage-based left margins for paragraphs and preserved horizontal paragraph margins in PDF/DOCX export HTML.
- Updated the internal memorandum signature block to center its lines within the right half of the document, matching Thai official-document layout.
- Added a signature-layout export verification script.
- Reduced the internal memorandum title spacing with template-local paragraph line height and the existing title font sizes, without changing global heading styles.
- Made every text-alignment toolbar action clear the template-only paragraph margin first, so left, center, right, and justified alignment use the full document width after user interaction.

## 2026-07-19

- Added a toolbar control for user-selected line spacing values: 1.0, 1.15, 1.5, and 2.0.
- Added a Tiptap line-height extension for paragraphs and headings.
- Preserved selected line height through editor HTML, pagination measurement, document JSON, and PDF/DOCX export HTML.
- Added validation for supported numeric line-height values and ignored unit-bearing imported values that cannot be safely interpreted as ratios.
- Added a line-spacing export verification script.
- Created this roadmap and status file as the repository's project-status source of truth.
- Added a `.gitignore` exception so the required root roadmap remains trackable while other generated Markdown stays ignored.
- Changed the line-spacing control to accept custom values from 0.5 to 3.0 in 0.05 increments while retaining recommended values.
- Aligned the custom line-spacing command and input value with Tiptap's string-based `setLineHeight` type contract, resolving the TypeScript declaration conflict.
- Replaced the invalid `type="string"` spacing input with a native `type="text"` and `datalist` autocomplete combo box while retaining custom values and validation.
- Replaced the line-spacing `datalist` with a composite text input and native select/options control, allowing both free entry and explicit preset selection.
- Removed the 0.5–3.0 line-spacing range restriction so users can enter any finite positive value.
- Added a Thai project integration guide and migration SOP under `MD/SOP`, covering transfer options, prerequisites, configuration, verification, acceptance, deployment, and rollback.
- Updated the Thai page-layout documentation to describe the implemented browser pagination pipeline, the current export-parity gap, and a phased single-source-of-truth design for PDF/DOCX page breaks.
- Rewrote the current-project structure analysis in Thai to match the latest frontend and backend source code, including editor orchestration, line spacing, image handling, versioned document data, import validation, rendering, conversion limits, environment configuration, current page-break parity limitations, removed features, and integration documentation. The analysis is intentionally exempt from the usual 200-line documentation guideline so it can serve as a detailed technical reference.
- Added a detailed Thai permanent page-layout solution proposing a Document Layout Core, canonical page plans, deterministic layout fingerprints, an authoritative paged preview/PDF pipeline, an editable DOCX strategy, phased migration, golden tests, security controls, rollout, and rollback. Linked the proposal from the existing page-layout analysis; all proposed architecture work remains explicitly unimplemented in the roadmap.
