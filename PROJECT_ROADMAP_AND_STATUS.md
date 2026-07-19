# Project Overview

This repository contains a browser-based rich-text document editor focused on Thai official documents. It provides an A4 editing preview, document templates, import and export workflows, and a separate conversion service for generating PDF and DOCX files.

# Current Status

- Status date: 2026-07-19
- Active branch for the permanent page-layout plan: `resolve_engin`.
- Frontend: implemented in `rich-text/` and builds successfully.
- Backend: implemented in `rich-text-back/` and builds successfully.
- The editor supports unrestricted positive per-paragraph and per-heading line spacing, with recommended values of 1.0, 1.15, 1.5, and 2.0.
- Latest verification: frontend build and lint, backend build, backend layout-manifest verification, document schema verification, layout contract verification, export-materialization verification, pagination-state verification, line-measurement verification, line-spacing verification, import-validation verification, and diff whitespace checks passed.
- The frontend production build reports a non-blocking warning because its main JavaScript bundle is larger than 500 kB.
- A phased sub-agent implementation plan exists for the proposed permanent page-layout architecture; Phase 1 canonical contract work and the first Phase 2 before-block export validation slice are implemented on `resolve_engin`.

# Architecture

## Frontend

- React 19 and TypeScript application built with Vite.
- Tiptap 3 provides the ProseMirror-based rich-text editor and editor commands.
- `DocumentEditorPage` coordinates templates, imports, exports, margins, pagination, and the editor UI.
- Custom Tiptap extensions provide font size, line height, image configuration, and pagination state.
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
- Bullet lists, ordered lists, horizontal rules, and editable tables.
- PNG/JPEG image import as embedded data URLs.
- Image alignment and corner resizing with preserved aspect ratio.
- Undo, redo, and clear-formatting commands.
- DOCX import through Mammoth with validation warnings.
- PDF import into an annotation mode with movable/resizable text and image overlays.
- PDF and DOCX export with progress, cancellation, retry-aware API handling, and localized error messages.
- Versioned document JSON schema and migration from legacy raw ProseMirror JSON.
- Versioned canonical page plan with document revision, layout fingerprint, page count, and logical break positions.
- Export requests now include the versioned document snapshot and render manifest page plan for backend validation.

## Backend Conversion

- HTML-to-PDF conversion.
- HTML-to-DOCX conversion through an intermediate ODT file.
- Thai font installation/registration support for Windows and Linux.
- Embedded image validation for type, signature, count, and total size.
- Conversion cancellation on client disconnect and configurable timeout handling.
- Structured API error codes and safe download filenames.

# In Progress

- Implementing the permanent page-layout migration for branch `resolve_engin` using `plan/page-layout/19072026-permanent-page-layout-implementation-plan.md`.
- Phase 1 canonical contract and stable page-plan wiring are implemented.
- Phase 2 before-block export materialization and backend layout-plan validation are mostly implemented, with focused frontend materialization, backend manifest validation, and explicit legacy rollback gates; mid-paragraph materialization remains planned.
- Phase 0 baseline evidence is recorded in `MD/summaryAgent/resolve_engin/19072026-phase-0-baseline-report.md`.

# Roadmap / Planned Features

- Continue the page-layout plan with mid-paragraph break materialization, renderer PoC, production Preview/PDF, DOCX compatibility, and staged rollout.
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
- The canonical page plan currently materializes before-block breaks only; text-offset/mid-paragraph export splitting remains unimplemented.
- Backend validates `renderManifest.pagePlan` metadata, manifest size, break count, document revision, break order, duplicate positions, and referenced layout IDs before conversion, but does not yet use the plan for rendering beyond validating the frontend-materialized HTML.
- `npm run verify:export-parity` currently reaches PDF inspection but fails on the `thai-text` fixture because expected Thai text tokens are missing or out of order in the generated PDF output.

# Important Decisions

- Keep `DOCUMENT_PAGE_SPEC` as the shared source for A4 dimensions, default margins, and base typography.
- Store user-selected line height as an optional string node attribute on paragraphs and headings. The renderer remains compatible with earlier numeric attributes, and documents without the attribute use the 1.5 default.
- Accept any finite positive line-height value without an upper bound; reject empty, zero, negative, nonnumeric, and infinite values to keep generated CSS valid.
- Render line height as unitless inline CSS so preview measurement and LibreOffice export receive the same selected value.
- Use Tiptap extensions and native form controls instead of adding another UI or editor dependency.
- Use a versioned JSON envelope for editor documents and a render manifest for export layout metadata.
- Accept only embedded PNG/JPEG data URLs in backend conversion to avoid fetching arbitrary external resources.
- Use LibreOffice for server-side PDF and DOCX generation to preserve a single HTML-based conversion path.
- Do not build a complete custom text, PDF, or DOCX rendering engine. The proposed permanent architecture owns the document layout contract, page plan, break policies, and export adapters while delegating text shaping and final rendering to established engines.
- Treat visual parity and editable-document parity as separate contracts: the proposed print preview/PDF path targets visual parity in a pinned environment, while editable DOCX targets content and logical page-break parity only within declared supported viewers.
- For parallel agent work in the shared workspace, use exclusive file ownership and let the root agent integrate and rerun phase gates.
- Do not commit or push unless the user explicitly requests that exact action.

# Change History

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
- Added `plan/page-layout/19072026-permanent-page-layout-implementation-plan.md` for branch `resolve_engin`, defining phase dependencies, bounded sub-agent work packages, exclusive file ownership, acceptance gates, rollout, and rollback.
- Implemented the first permanent page-layout slice on `resolve_engin`: canonical layout contract, document revision, page-plan state wiring, before-block export materialization, render manifest page-plan transport, backend layout-plan validation, and layout-contract verification.
- Locked the Phase 0 baseline report for `resolve_engin` and fixed the Node ESM import path used by `verify:import-validation`.
- Added `verify:export-materialization` to prove canonical before-block breaks are materialized into export HTML without prematurely handling text-offset breaks.
- Added backend `verify:layout-manifest` and extracted layout manifest validation into a pure module with manifest size and break-count caps.
- Added `VITE_LEGACY_LAYOUT_EXPORT=true` as an explicit rollback path that skips canonical layout materialization and backend layout-manifest validation for legacy export requests.
