# easy-seo: Performance Optimization Plan

This document outlines the strategies for ensuring the `easy-seo` application is fast, efficient, and resource-friendly, delivering a superior user experience on all platforms.

## 1. Frontend Performance Enhancements

This section details a multi-faceted strategy to optimize the Preact frontend, ensuring a fast, responsive, and fluid user experience.

*   **Bundle Size Optimization:**
    *   **Code-Splitting:** The application will be split into smaller, logical chunks using route-based code splitting. The File Explorer, Content Editor, and Visual Editor will each be loaded on demand, ensuring users only download the code they need for the specific view they are accessing.
    *   **Tree-Shaking and Dependency Analysis:** We will use a bundle analyzer tool (like `rollup-plugin-visualizer`) to inspect the final bundle and identify large or unnecessary dependencies. This will allow us to aggressively tree-shake unused code and replace heavy libraries with more lightweight alternatives where possible.

*   **Runtime Performance:**
    *   **Memoization:** Key components will be wrapped in `preact/memo` to prevent unnecessary re-renders. This is particularly important for components that display complex data, like the File Explorer list or the Visual Editor's properties panel.
    *   **Virtualized Lists:** The File Explorer will be refactored to use a virtualized list (e.g., using `react-window`). This will ensure that only the visible items in the file list are rendered to the DOM, providing a consistently smooth scrolling experience even with thousands of files.

*   **Perceived Performance:**
    *   **Skeleton Loaders:** When fetching data (e.g., loading the file list), the UI will display skeleton loaders that mimic the final layout. This makes the application feel faster and more responsive, as the user is never presented with a blank screen.
    *   **Optimistic UI Updates:** For actions like creating, renaming, or deleting a file, the UI will be updated instantly, *before* the API call completes. The application will then revert the change and show an error message only if the API call fails. This makes the interface feel instantaneous.

## 2. Backend and API Performance Strategies

This section outlines a plan to optimize the Cloudflare Worker backend, focusing on reducing API latency and improving overall efficiency.

*   **Implement a Caching Layer with Cloudflare KV:**
    *   **Strategy:** A caching layer will be introduced using Cloudflare's Key-Value (KV) store. Responses from the GitHub API that are not expected to change frequently (e.g., file lists for a specific directory, raw file content) will be cached for a short duration (e.g., 30-60 seconds).
    *   **Benefit:** This will dramatically reduce latency for repeated requests, provide a better user experience, and help the application stay within the GitHub API rate limits. The cache will be intelligently invalidated after any write operation (e.g., creating, updating, or deleting a file).

*   **Optimize JSON Payloads:**
    *   **Strategy:** A review of all API endpoints will be conducted to ensure they return only the data that is strictly necessary for the client. For example, the file list endpoint currently returns the full GitHub API response for each file. This will be trimmed down to include only the essential fields (`name`, `path`, `type`, `sha`).
    *   **Benefit:** Smaller payloads result in faster transfer times, which is especially important for users on slower mobile networks.

## 3. Astro Preview Build Optimizations

This section details the plan for accelerating the Astro preview build process, which is a critical component of the user's "edit-preview-publish" workflow.

*   **Optimize the GitHub Actions Workflow:**
    *   **Dependency Caching:** The `build-preview.yml` GitHub Actions workflow will be updated to include caching for `npm` dependencies. This will prevent the need to download and install all dependencies from scratch on every run, significantly reducing the build time.
    *   **Build Step Analysis:** A step-by-step analysis of the build process will be conducted to identify any bottlenecks. This will help us optimize the build command and remove any unnecessary steps.

*   **Investigate Astro's Incremental Build Capabilities:**
    *   **Strategy:** Research will be conducted into Astro's incremental build and caching capabilities. If Astro supports building only the files that have changed, this feature will be enabled in the preview build process.
    *   **Benefit:** An incremental build would be the single most significant performance improvement, as it would mean that small text changes could be previewed almost instantly, rather than requiring a full site rebuild.
