# easy-SEO: Strategic Roadmap

This document outlines the strategic direction for the easy-SEO application. It defines the target user, the problem we are solving, the technical solution, and the value proposition. It also details a phased development roadmap to guide the refinement and refactoring of the application.

## 1. The 4Ws Canvas: A Risk-Reduction System

This framework helps us identify and mitigate the biggest risks in the project by clarifying our core assumptions.

*   **WHO is the user?**
    *   The "Frustrated Founder": A non-technical solopreneur or small business owner who is an expert in their own field but finds existing website building and SEO tools (like WordPress or Wix) to be complex and overwhelming. They are likely not familiar with developer tools like GitHub.

*   **WHAT is the problem?**
    *   Building a website and implementing a coherent SEO strategy is too complicated. Users get lost in technical details, leading to unstructured websites with poor content funnels and orphaned pages. They need a guided experience that simplifies content creation and ensures it aligns with a sound SEO structure.

*   **WHERE is the solution deployed?**
    *   The solution is a headless CMS powered by a React/Vite/Tailwind SPA (to be migrated to Preact) for the frontend editor, and a Cloudflare Worker for the backend. The user's actual website is an Astro site stored in a GitHub repository, deployed via Cloudflare Pages. The architecture must be built on technologies with generous free tiers to minimize initial capital expenditure.

*   **WHY is this valuable?**
    *   **Simplicity:** It removes the technical barrier to creating a well-structured, SEO-optimized website.
    *   **Guidance:** It leads the user through a structured content creation process, preventing common mistakes like orphaned pages.
    *   **Automation:** The "one-click" setup wizard automates the creation of the GitHub repository and Cloudflare deployment, hiding the complexity from the user.
    *   **Scalability:** It offers a "Pro" tier with advanced, AI-driven SEO insights from the Priority Intelligence Engine, providing a clear upgrade path for users who want to take their SEO to the next level.

## 2. Project Roadmap: From Refactoring to Release

This roadmap is divided into three distinct phases, each with a clear goal. This agile-like approach ensures we build a stable foundation before adding new features.

### Phase 1: Foundational Refactoring
*   **Goal:** Create a stable and consistent technical foundation.
*   **Key Actions:**
    *   Migrate the `easy-SEO` application from React to Preact to align with the `priority-engine-ui` stack and improve performance.
    *   Completely remove the `@craftjs/core` dependency and all related components to eliminate the source of current instability.

### Phase 2: Rebuild the Core Visual Editor
*   **Goal:** Build the new, intuitive, and user-friendly layout dashboard.
*   **Key Actions:**
    *   Refactor and improve the existing drag-and-drop interface with a robust, vanilla JavaScript approach to enhance stability and mobile-friendliness.
    *   Create the initial set of essential UI components (e.g., Text, Image, Hero Section, etc.).
    *   Implement the settings panels required to edit the properties (e.g., color, spacing, content) of these components.

### Phase 3: Enhance and Polish
*   **Goal:** Refine the user experience and add more creative power.
*   **Key Actions:**
    *   Implement the live preview feature, allowing users to see their changes in a frameless iframe that displays the Astro `preview build` output for faster iteration.
    *   Fix existing UX bugs, such as the file explorer's double-touch menu.
    *   Continuously add more advanced content editing tools and UI components based on real-world usage and feedback.
