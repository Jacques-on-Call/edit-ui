# Snag List 
This is a critical update. We are seeing Partial Fixes mixed with Critical 
## Regressions (Data Loss on Rename). The "Move" logic is acting like a "Copy & Crash," and the Mobile experience is fighting the browser's native behaviors.
Here is the 

# Gap Analysis and Recovery Plan for the Council, updated for January 2, 2026.


## [BUG-002] Move File "Zombie Copy" (500 Error)
• Status: [FIXED - 2026-01-02]
### user reports: Tried to move a file: 
An Error Occurred
Failed to move _Test-4-loss.astro: HTTP error! status: 500.
Even though error pops on screen it appears in GitHub as copy:
content/pages
    Consider/
       _Test-4-loss.json
 _Test-4-loss.json
 home-from-json.json
 index.json
But as you can see the logic failed to delete from source when it lands in destination.
Tried to rename a file and the issue that I had before is aging back. Rename results in a blank new file so data is lost.

• The Issue: File appears in destination but remains in source. Error 500 triggered.
• What was Tried & Failed: A standard mv or rename command. This failed because the logic likely didn't account for the .json sidecar file or file system permissions on the Cloudflare/Server environment.
• Gap Analysis: The operation is not "Atomic." If the second half of the move (the delete) fails, the first half (the copy) stays, creating duplicates.
• Recovery Plan:
• Target: server/api/move.js
• Instruction: Implement a try-catch-rollback. If the delete from source fails, the agent must delete the copy from the destination to prevent "Zombie files." Move the .astro and .json as a single unit.


The "Zombie Copy" (Move Error 500):


   * The Crime: The moveFile API endpoint is failing to execute the "Atomic Move." It performs fs.copyFile successfully (hence the file appears in the new folder) but crashes on fs.unlink (delete source) or fs.rename.
   * The Evidence: "HTTP error! status: 500" + Duplicate files exist.
   * Suspect: The backend likely tries to move the .astro file and the .json sidecar separately. If the first succeeds and the second fails, the whole operation 500s, leaving the file system in a "half-moved" state.
 * The "Amnesiac Rename" (Data Loss):
   * The Crime: Renaming a file deletes the content.
   * The Cause: The API is treating rename as create new file with name Y. It is not reading the content of file X before creating file Y.
   * Severity: CRITICAL. This destroys user work.
The "Recovery" Snag List (Action Plan)
Priority A: Stop Data Loss (Rename & Move)
Step 1: Fix the "Amnesiac" Rename
 * Target: server/api/files.js (or wherever the Node fs logic lives).
 * The Fix: The rename function MUST use fs.renameSync (which keeps content) OR it must explicitly:
   * Read Content of Old Path.
   * Write Content to New Path.
   * Only then Delete Old Path.
 * Acceptance Test: Create test.astro with text "Hello World". Rename to renamed.astro. Open renamed.astro. Text "Hello World" must be present.

Fix the "Zombie" Move (Error 500)
 * Target: server/api/move.js.
 * The Fix: Wrap the move operation in a try/catch block that handles the .json sidecar file gracefully.
   // Logic must check:
// 1. Does destination exist? If yes, ABORT (don't overwrite).
// 2. Move .astro file.
// 3. Check for .json file. If exists, move it too.
// 4. If .json move fails, LOG it but do not fail the whole request.

 * Acceptance Test: Move _Test-4-loss.astro to a folder. The file disappears from source and appears in destination. No 500 Error.
Priority B: UI/UX Cleanup

The "Data Sanctity" Rule: You are forbidden from using fs.writeFile with an empty string during a Rename operation. You must verify content exists in the new file before unlinking the old one.

## [BUG-003] Rename File "Data Wipe"
• Status: [FIXED - 2026-01-02]
• The Issue: Renaming results in a blank file. Original data is lost.
• What was Tried & Failed: Using a createNewFile function with the new name and then deleting the old one. This failed because the agent didn't "Handshake" the data—it deleted the old file before the new one actually wrote the content to disk.
• Gap Analysis: The agent is treating a "Rename" as a "Create New" instead of a "Move."
• Recovery Plan: * Target: FileExplorer.jsx / api/rename
• Instruction: Use fs.renameSync which is a native OS-level rename that preserves the file's inode/content. Never "create and delete" for a rename.



——-

## [BUG-004] Mobile Toolbar & Selection Focus
• Status: [NEW]
• The Issue: Toolbar only appears after losing focus. Triple-tap works, but double-tap (one word) doesn't.
• What was Tried & Failed: Standard onSelect event handlers. These fail on mobile because mobile selection triggers different OS-level menus that conflict with our Preact toolbar.
• Gap Analysis: We are fighting the mobile native "Copy/Paste" popup.
• Recovery Plan: * Target: SidePanelToolbar.jsx
• Instruction: Shift from onSelect to selectionchange listener on the document level. Add a 200ms debounce to wait for the mobile selection handles to stabilize before showing the toolbar.


The "Phantom Bullet" (Slide-out Toolbar):
### user reports: Add slide-out toolbar did a strange thing when I tried to bullet a line 
it added a huge amount of space not sure if lines or what because I can’t select or place curser. Tap and backspace eventually after many attempts removed it almost like it’s a bock as the space shrunk and the line of content jumps back into position.

SidePanelToolbar still not opening on mobile. I select text and no style editing options appear. But oddly the moment content looses select focus sidePanelToolbar appears so still can’t apply styles to text. Okay finally seeing the trigger- tripple tap selects whole line and style is applied to whole line so kinda working but one word is double tap select so that needs fixing.

   * The Crime: Adding a bullet point creates unselectable whitespace.
   * The Cause: CSS Layout Collision. The <ul> or <li> tag likely has a flex or grid property conflicting with the editor's text container, or a rogue min-height that forces the content block down.

Target: src/components/SidePanelToolbar.jsx.
 * The Fix: The toolbar is firing on blur (loss of focus) instead of selectionchange.
   * Remove onBlur triggers for the toolbar.
   * Bind the toolbar visibility strictly to window.getSelection().toString().length > 0.
   * Note: Mobile requires listening to selectionchange on the document, not just the element.

The "CSS Containment" Rule: When fixing the "Phantom Bullet" (Slide-out toolbar), check the CSS display property. If the bullet logic adds a <ul>, ensure it has margin: 0; padding-left: 1.5rem; overflow: hidden;. It is likely inheriting a global style that blows up the height.


———
## [BUG-001] Search Apostrophe Logic
• Status: [PARTIAL]
The "Smart Quote" Blind Spot (Search):
### user reports: Search logic works for let but still not let’s
Nice to add if the search bar could have a little x on the right hand inside to clear search request and return to file explorer 
• The Issue: Search works for "let" but fails for "let’s" (smart quotes). Search bar lacks a clear button.
• What was Tried & Failed: Simple string .includes() matching. It failed because the browser and keyboards often swap ' (straight) for ’ (curly/smart), which are different character codes.
• Gap Analysis: The logic is currently "Char-Code Blind." It requires a normalization layer to flatten all punctuation before comparison.
• Recovery Plan: * Target: useSearch.js
• Instruction: Inject a regex filter replace(/[\u2018\u2019]/g, "'") on both the query and the file content.
• Feature Add: Add an <XIcon /> to the Search Input that clears the searchTerm state.


   * The Crime: Search finds let but misses let’s.
   * The Cause: String mismatch. The file contains a typographer's apostrophe (’ - U+2019), but the search bar sends a typewriter apostrophe (' - U+0027).

Smart Search & The "X" Button
 * Target: src/components/SearchBar.jsx & src/hooks/useSearch.js.
 * The Fix (Logic): Normalize both the search query and the file content before comparing.
   const normalize = (str) => str.toLowerCase().replace(/[\u2018\u2019]/g, "'"); // Converts ’ to '
// usage: if (normalize(fileContent).includes(normalize(query))) ...

 * The Fix (UI): Add a conditional "Clear" button inside the input wrapper.
   {searchTerm && (
  <button onClick={() => { setSearchTerm(''); setResults([]); }}>✕</button>
)}

———

## [BUG-005] Preview Routing (Index Page Loop)
• Status: [STALLED]
• The Issue: Preview shows the index.json instead of the actual file (e.g., _Test-4-loss).
• What was Tried & Failed: Passing the filename as a URL param. It failed because the Astro build doesn't recognize the new underscore file as a valid route dynamically.
• Gap Analysis: The Preview environment is looking at the deployed routes, not the local editor state.
• Recovery Plan: * Target: PreviewMode.jsx
• Instruction: Bypass the URL-based route for previews. Inject the current JSON content directly into the Iframe via postMessage. This is 100x faster than a rebuild.

User reports:
The header space in content editor if I scroll up I see it . This is app shell and is meant to collapse if not in use ie with tools but since we can’t keep it visible on mobile it’s not useful to tools.
And
Preview Mode the unnecessary header is not collapsed so taking up preview screen space. 
And 
And still not showing the content/pages file in preview.
edit.strategycontent.agency/editor/src%2Fpages%2F_Test-4-loss-2.astro looks like index page still  Incorrect Preview 
If I look in root/src/ I don’t see the preview folder which I believe is meant to be for each page that user previews which in my mind means quicker opening of preview when user looks again it’s the page the viewed before and the build preview trigger can update it when deployed page refreshes to show updates.
That said we need to speed this up somehow ?


: Mobile Toolbar & "Ghost Header"
 * 

Priority C: The Preview Engine
Step 5: Fix Preview URL & Caching
 * Target: src/pages/PreviewPage.jsx.
 * The Fix: The user sees the Index page because the Router cannot match the new filename (_Test-4-loss-2) to a route.
 * Proposed Logic (The "User's Cache Idea"):
   * When "Preview" is clicked:
     * Copy the current content to a fixed file: src/pages/preview/_temp_preview.astro.
     * Redirect the iframe to /preview/_temp_preview.
   * Why? This keeps the URL constant. The browser caches the path, but we force a reload. We don't need to wait for a full build of a new dynamic route.

## Debug Feature Modal 
User reports: 
Debug Modal and Log works now BUG] - 1/1/2026, 6:23:21 AM
Description: Build Error The live preview build took too long. Please try refreshing the preview manually
Page: _Test-4-loss
Component: Editor
Context: {"pageId":"_Test-4-loss","viewMode":"livePreview","editorMode":"json","saveStatus":"saved","syncStatus":"idle","selectionState":{"blockType":"paragraph","alignment":"","isBold":false,"isItalic":false,"isUnderline":false,"isStrikethrough":false,"isCode":false,"isHighlight":false,"isCollapsed":true,"hasH1InDocument":false,"textColor":null,"highlightColor":null}}
Status: [NEW]
Just needs to be in file explorer bottom action bar too, ei on every page and out of the way like in a corner.


 * The "Global Log" Rule: The User requested the Debug Log be accessible from the File Explorer Bottom Bar. Do not just leave it in the Editor. Add the warning icon/trigger to the BottomActionBar.jsx component so it is visible on every screen.

