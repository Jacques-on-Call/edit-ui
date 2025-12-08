# Easy SEO: Visual Website Builder

## Vision Overview

A no-code website builder for non-technical business owners (lawyers, plumbers, contractors) who want modern, SEO-optimized websites without needing coding skills. Built on free tools (GitHub, Cloudflare, Astro) with a visual editor that makes website creation as simple as editing a document.

-----

## Core Components

### 1. File Explorer (Home Base)

**What you see:**

- Welcome card for first-time users explaining the basics
- Folder structure that mirrors your website’s visitor journey
- Visual indicators showing:
  - **Red/Orange/Green** SEO health scores per page
  - **Published status** for each page
  - **Last modified** info from GitHub
- Home button (bottom right) to navigate back from any folder

**How folders work:**

- Folders = URL structure
- Example: A “Get” folder creates URLs like `lawyer.com/get/legal-help.html`
- Users see actual URLs during creation and preview

**Future enhancement:**

- Interactive sitemap showing visitor flow as a visual flowchart
- Migration tool to import existing websites (especially from cPanel/WordPress)

-----

### 2. Content Editor (Where Words Happen)

**Philosophy:** Content first, design second.

**Powered by Lexical** - A rich text editor that shows exactly what visitors will see:

**Basic formatting:**

- Headings, bold, italic, underline
- Lists, quotes, code blocks
- Images, Tables and columns

**Smart features:**

- Auto-converts URLs to clickable links
- Drag-and-drop images with size/seo attributes controls
- Embed videos, audio, and other media
- Reusable content blocks (hero sections, features, quotes)
- Undo/redo with autosave

**Dual Toolbar System:**

The editor features a comprehensive, modern toolbar system with full rich-text editing capabilities:

- **Floating Context Toolbar:**
  - Appears automatically above selected text for immediate formatting access
  - **Text formatting:** Bold, Italic, Underline, Strikethrough, Inline Code
  - **Block format dropdown:** Convert text to Normal, H1, H2, H3, H4, H5, or H6
  - **Alignment dropdown:** Align text Left, Center, Right, or Justify
  - **Lists:** Quick creation of bullet and numbered lists
  - **Link insertion:** Add hyperlinks to selected text
  - **Color controls:** Text color picker and highlight color picker with predefined palette
  - **Clear formatting:** Remove all formatting with one click
  - Buttons highlight to show active formatting state
  - Follows the selection as you scroll with smart positioning
  - Mobile-optimized with visualViewport positioning for accurate placement during zoom
  - Disappears when no text is selected or selection is outside editor
  - Debug mode available for troubleshooting selection placement issues

- **Vertical Insert Toolbar:**
  - Accessed via hamburger icon in top-left corner
  - Slides out as a left sidebar with categorized insert actions
  - **Headings:** Insert H2, H3, H4, H5, H6 at cursor position
  - **Lists:** Create bullet or numbered lists
  - **Structure:** Add Horizontal Rule, Page Break, or Table
  - **Media:** Insert images with URL prompt
  - **Layout:** Insert Columns Layout or Collapsible sections
  - **Utility:** Insert current date in formatted text
  - **History:** Undo and Redo (only available in vertical toolbar)
  - Actions organized by category for easy discovery
  - Works at cursor position, no text selection needed
  - Auto-closes after inserting an element
  - Keyboard accessible (Escape to close)
  - Click outside or backdrop to dismiss

**Mobile-optimized:**

- Touch-friendly toolbar
- Tap-to-edit blocks
- Responsive interface for phones and tablets

**Workflow:**

1. Start with basic template
1. Edit content on left side
1. See design preview on right (mobile: two tabs)
1. Apply styles in Visual Editor

-----

### 3. Visual Editor (The Magic Layer)

**What it is:**
An interactive overlay where “what you see is what you get” - click, drag, and style your website in real-time.

**How it works:**

**The view:**

- Full-screen iframe showing your live preview
- Transparent overlay with bordered components on top
- Components update as you create content and apply styles

**Interactions:**

- **Single click** → Select element, show properties panel
- **Drag handles** → Move selected elements
- **Double click** → Edit content inline
- **Long press/right click** → Advanced options menu

**Component hierarchy** (in order of control):

1. **Layout** - Grid, flex containers, sections (the foundation)
1. **Components** - Heroes, cards, buttons, tables (building blocks)
1. **Elements** - Text, images, icons (the content)
1. **Styles** - Colors, spacing, effects (the polish)

**Settings panel** (context-aware based on selection):

- **Layout tab:** Position, size, spacing, alignment
- **Style tab:** Colors, borders, shadows, effects
- **Content tab:** Text, images, links
- **Advanced tab:** Custom CSS, animations, responsive behavior

**Technical approach:**

- Design changes saved as structured JSON
- Converted to Tailwind classes and CSS variables at render time
- Iframe and overlay communicate via message bridge (same-origin)
- Drag operations computed in overlay, applied via commands to iframe
- “Preview mode” toggles interaction on/off to prevent conflicts

-----

## User Journey

### First-Time User:

1. **Welcome card** explains the concept
1. Click **“Create New Page”**
1. Choose a **basic template** to start
1. **Content Editor opens:** Write your content (left side shows editor, right side shows preview)
1. Switch to **Visual Editor:** Click elements to style them
1. Hit **“Preview”** to see it on desktop/tablet/mobile
1. Click **“Publish”** when ready - deploys automatically
1. SEO score appears (red/orange/green) in File Explorer

### Returning User:

1. Open **File Explorer**
1. See all pages with SEO scores and publish status
1. Single tap file → **Quick actions** (Edit, Preview, Duplicate, Delete)
1. Long press file → **Full options menu** (including “Preview Site”)
1. Navigate folders to manage different site sections
1. Home button always available to return to main view

-----

## Navigation & Toolbar

**Layout (top to bottom):**

- **Header:** App logo, current location breadcrumb
- **Toolbar:** Create button, Search, Filters
- **Main area:** File/folder grid with status indicators
- **Action buttons:** Context-sensitive based on selection

**Preview options:**

- Long press any file → “Preview Site” to see that specific page
- Preview button in header for full site preview
- Device switcher (desktop/tablet/mobile views)

-----

## Publish & SEO

### Publishing Flow:

1. Save draft → Triggers preview build
1. “Preview before publish” reminder in File Explorer
1. Click “Publish” → Deploys automatically to Cloudflare
1. Version history available for rollback

### SEO Features:

- **Built-in (free tier):** Astro’s automatic SEO optimization
- **Hints throughout app:** Google, voice search, and AI visibility tips
- **Basic dashboard:** Shows SEO health per page
- **Paid tier:** Full “Priority Intelligence” app for monitoring and guidance

-----

## Settings & Configuration

**Global settings:**

- Domain setup via Cloudflare
- Theme colors and fonts
- SEO defaults (meta descriptions, titles)
- Analytics integration (Priority Intelligence for paid users)

**Responsive testing:**

- Switch between desktop/tablet/mobile previews
- See exactly how visitors experience your site

-----

## Business Model

**Free Tier:**

- Basic templates
- Core editor and visual styling
- SEO optimization via Astro
- GitHub + Cloudflare hosting (free)
- Basic SEO dashboard

**Paid Tier:**

- Advanced layout templates
- Modern design varieties
- Priority Intelligence app (full SEO monitoring)
- Advanced analytics
- Collaboration features (future)
- Priority support

-----

## Target Audience

**Primary:** Non-technical business owners

- Lawyers, plumbers, contractors
- Know their business but not web development
- Want modern, professional websites
- Need easy ongoing management
- Value SEO and visitor experience

-----

## Key Innovations

1. **Content-first approach:** Write naturally, style later
1. **Visual hierarchy:** Understand layout → components → elements → styles
1. **Real-time preview:** See changes instantly in actual site context
1. **SEO baked in:** From folder structure to meta tags to AI visibility
1. **Free foundation:** GitHub + Cloudflare + Astro = $0 hosting
1. **Smart defaults:** Modern designs that work out of the box

-----

## Future Enhancements

- Website migration tool (cPanel/WordPress import)
- Interactive sitemap visualization
- Multi-user collaboration
- Template marketplace
- Advanced animation controls
- A/B testing integration​​​​​​​​​​​​​​​​
