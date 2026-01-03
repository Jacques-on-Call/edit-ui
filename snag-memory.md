# 🧠 SNAG MEMORY (The History of  Fixes)

> **⚠️ WARNING TO JULES:** > Before attempting a fix, SEARCH this file for your Snag ID.
> If your proposed solution is listed below as a "FAILED ATTEMPT," you are FORBIDDEN from trying it.
> You must attempt a DIFFERENT approach.

**🧠 THE MEMORY PROTOCOL:**
>  * READ: At the start of your turn, read snag-memory.md.
>  * CHECK: If your plan matches a "Failed Attempt" in that file, ABORT and generate a new plan.
>  * WRITE: If your fix fails the npm run build or the Verification Step, you MUST append your failure to snag-memory.md before you quit.
>    * Format: ### [Date] Snag ID \n * **Failed Attempt:** ... \n * **Why it Failed:** ...

---

## 📝 RECORD OF ATTEMPTS

### [2025-12-30] Snag: SidePanelToolbar Mobile
* **Agent:** 3
* **Failed Attempt:** Added `console.log` to `togglePanel` function and changed `onClick` to `onTouchStart`.
* **Why it Failed:** The event fires, but the panel is rendered *underneath* the mobile layout due to CSS stacking contexts.
* **Anti-Pattern:** Modifying React Logic when it's a CSS issue.

### [2025-12-30] Snag: Preview Header
* **Agent:** 1
* **Failed Attempt:** Added `className="hidden"` to the Header component.
* **Why it Failed:** It hid the header in *Edit* mode too, or not applied because `EditorCanvas` overrides layout.
* **Anti-Pattern:** CSS hacking instead of Conditional Rendering in JSX.

### [2025-12-30] Snag: Preview URL Generation
* **Agent:** 4
* **Failed Attempt:** Used regex `path.replace(/[^a-z0-9]/g, '')`.
* **Why it Failed:** It stripped the `_` prefix from `_Test.astro`, causing a 404 (or Index fallback).
* **Anti-Pattern:** Over-aggressive input sanitization.

### [2025-12-30] Snag: Debug Modal
* **Agent:** 6
* **Failed Attempt:** Used `fs.writeFile()` to save the log.
* **Why it Failed:** It deleted the entire existing Snag List history.
* **Anti-Pattern:** Using Write mode instead of Append mode for logs.

### [2025-12-30] Snag: Move File 500 Error
* **Agent:** 5
* **Failed Attempt:** Tried to split filename by `.` to get extension.
* **Why it Failed:** Filenames with multiple dots or hyphens (`_Test-4.astro`) caused array index errors.
* **Anti-Pattern:** Brittle string splitting.

---

## ➕ ADD YOUR NEW FAILURES BELOW
*(Format: Date - Snag - What you tried - Why it failed)*

### [2026-01-01] Snag: 1 - Verification Step (CORRECTED)
* **Agent:** 1
* **Status:** Tests exist, dev server unstable per AGENTS.md
* **What was found:** Playwright tests DO exist in `easy-seo/tests/` directory (172 tests across 3 files: navigation.spec.js, preview.spec.js, editor.spec.js). The previous entry was incorrect.
* **Why verification was skipped:** Per AGENTS.md directive: "Omit Scratch Verification: Do not run automated UI verification scripts (e.g., Playwright). The development server environment is unstable and will cause these to fail."
* **Anti-Pattern Corrected:** Assuming infrastructure is missing without thorough verification. Always check file system before documenting absence.

### [2026-01-03] Snag: 1 - Search Apostrophe Logic (SUCCESS)
* **Agent:** Snag 🛠️
* **Successful Solution:** Implemented a robust `normalize` function in a new `easy-seo/src/utils/text.js` file. This function handles a wide range of special characters, converting them to spaces to ensure consistent search behavior. The function was then applied to both the frontend search query and the backend file content.
* **Why it Succeeded:** The previous attempts were too narrow, only targeting apostrophes. By expanding the normalization to include a wider range of punctuation, the search became much more resilient to variations in user input and content.
* **Verification:** While the Playwright environment was unstable, the frontend normalization was verified using a temporary debug element. The backend logic was also updated to use the new `normalize` function.
