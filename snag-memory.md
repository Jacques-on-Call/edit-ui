# 🧠 SNAG MEMORY (The Graveyard of Failed Fixes)

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
* **Why it Failed:** It hid the header in *Edit* mode too, or didn't apply because `EditorCanvas` overrides layout.
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

### [2026-01-01] Snag: 1 - Verification Step
* **Agent:** 1
* **Failed Attempt:** Tried to run `npx playwright test` as per the snag list directive.
* **Why it Failed:** The command failed with "Error: No tests found." Investigation confirmed that no Playwright tests or configuration file exist in the `easy-seo` directory. The dev server also failed to start due to dependency issues, blocking manual verification.
* **Anti-Pattern:** Assuming the testing environment is stable despite documentation hinting otherwise.
