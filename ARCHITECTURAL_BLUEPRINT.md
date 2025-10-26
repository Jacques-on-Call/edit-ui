# easy-seo: Architectural Blueprint

## 1. Vision and Guiding Principles

This document defines the official architecture for the `easy-seo` application, a headless CMS for Astro websites. It synthesizes the project's strategic vision with a robust technical framework to ensure the application is performant, maintainable, and ready for future expansion.

### Guiding Principles:

*   **User-Centric Design:** The architecture will prioritize a simple, intuitive user experience for non-technical users, as outlined in the `easy-SEO-strategy.md`.
*   **Decoupled and Modular:** The frontend, backend, and data store will be loosely coupled, allowing for independent development, testing, and scaling.
*   **Scalability and Performance:** The architecture will be designed to handle a growing user base and large content repositories without sacrificing performance.
*   **Cross-Platform Readiness:** The architecture will be designed to support future expansion to other platforms and devices with minimal refactoring.

## 2. Core Components

The `easy-seo` application is comprised of three core components, each with a distinct set of responsibilities:

### 2.1. File Explorer (The "Home Base")

*   **Responsibilities:**
    *   **Visual File Management:** Provide a clear, visual representation of the website's folder structure, mirroring the visitor's journey.
    *   **Status at a Glance:** Display visual indicators for SEO health (red/orange/green), publish status, and last modified information for each page.
    *   **Intuitive Actions:** Enable users to create, delete, and manage files and folders with simple, intuitive actions (e.g., long-press for options).
    *   **Smart Search:** Offer a user-friendly search that displays friendly names (frontmatter title or filename) and a highlighted snippet of the matching content.

### 2.2. Content Editor (The "Word Processor")

*   **Responsibilities:**
    *   **Rich Text Editing:** Provide a robust, yet intuitive, rich text editing experience powered by TinyMCE, with a focus on a "content-first" workflow.
    *   **Smart Content Creation:** Support the creation of reusable content blocks, auto-conversion of URLs to links, and easy embedding of media.
    *   **Mobile-First Design:** Ensure a fully responsive and touch-friendly interface for editing on mobile devices.
    *   **Real-Time Preview:** Offer an accurate, real-time preview of the content, which will be displayed in a dedicated, full-screen preview pane.

### 2.3. Visual Editor (The "Magic Layer")

*   **Responsibilities:**
    *   **Interactive Styling:** Provide a "what you see is what you get" (WYSIWYG) editing experience, allowing users to style their website by directly interacting with a live preview.
    *   **Component-Based Hierarchy:** Enable users to understand and manipulate the visual hierarchy of the page, from layouts and components down to individual elements and styles.
    *   **Context-Aware Settings:** Offer a dynamic settings panel that adapts to the selected element, providing fine-grained control over layout, style, and content.
    *   **Structured Style Storage:** Save design changes as structured JSON, which will be converted to Tailwind classes and CSS variables at render time.

## 3. Data and State Management

The application will employ a clear and consistent data flow to ensure data integrity and a predictable user experience.

*   **Single Source of Truth:** The user's GitHub repository is the definitive source of truth for all content, layouts, and website structure. This ensures version control, collaboration, and a clear audit trail.
*   **Client-Side State Management:** The Preact frontend will manage its state using a combination of local component state for UI-specific data and a lightweight global state management solution (e.g., Zustand or Preact's context API) for application-wide state, such as user authentication and session information.
*   **Data Synchronization and Flow:**
    1.  **Read Operations:** The frontend will fetch data from the GitHub repository via the Cloudflare Worker. The worker will handle the GitHub API requests, format the data, and return it to the client.
    2.  **Write Operations:** All create, update, and delete operations will be sent to the Cloudflare Worker, which will then commit the changes to the GitHub repository.
    3.  **Real-Time Updates:** To ensure the UI reflects the latest state of the repository, the application will re-fetch data after every write operation and will implement a "rebuild preview" mechanism to update the visual preview.

## 4. API and Backend Integration

The Cloudflare Worker serves as a lightweight, secure, and scalable backend for the `easy-seo` application. It acts as a proxy to the GitHub API, handling authentication and all file-based operations.

*   **API Contract:** The API will be defined with a clear and consistent RESTful contract, using JSON for all request and response bodies. Key endpoints will include:
    *   `/api/auth/github`: Initiates the GitHub OAuth flow.
    *   `/api/auth/callback`: Handles the OAuth callback from GitHub and sets a secure, HttpOnly session cookie.
    *   `/api/files`: Lists files and folders for a given path.
    *   `/api/files/content`: Retrieves the content of a specific file.
    *   `/api/files/create`: Creates a new file.
    *   `/api/files/update`: Updates an existing file.
    *   `/api/files/delete`: Deletes a file.
    *   `/api/folders/create`: Creates a new folder.
    *   `/api/folders/delete`: Recursively deletes a folder and its contents.
    *   `/api/search`: Searches for files and content within the repository.
    *   `/api/preview/trigger-build`: Initiates a new preview build via GitHub Actions.
    *   `/api/preview/build-status`: Polls for the status of a preview build.
*   **Authentication:** The worker will manage user authentication via a secure, HttpOnly session cookie, ensuring that all requests to the GitHub API are authenticated and authorized.
*   **GitHub Proxy:** The worker will abstract the complexities of the GitHub API, providing a simplified and secure interface for the frontend. It will handle all aspects of authentication, request signing, and data transformation.

## 5. Cross-Platform Readiness and Scalability

The architecture is designed to support future growth and expansion, ensuring the application remains robust and adaptable as the user base and feature set grow.

*   **Cross-Platform Readiness:**
    *   **Decoupled Frontend:** The Preact frontend is a standalone single-page application (SPA) that communicates with the backend via a well-defined API. This decoupling makes it straightforward to develop native mobile or desktop applications in the future that consume the same API, ensuring a consistent user experience across platforms.
    *   **Responsive Design:** The frontend will be built with a mobile-first, responsive design, ensuring a seamless experience on a wide range of devices, from desktops to tablets and smartphones.
*   **Scalability:**
    *   **Serverless Backend:** The use of Cloudflare Workers for the backend provides a highly scalable, serverless architecture. Cloudflare's global network ensures low-latency access for users worldwide, and the serverless model automatically scales with demand, eliminating the need for manual infrastructure management.
    *   **Distributed Data Store:** GitHub serves as a robust, scalable, and distributed data store. Its version control capabilities provide a built-in audit trail and disaster recovery, while its powerful API can handle a high volume of requests.
    *   **Stateless API:** The Cloudflare Worker is stateless, meaning that each API request is independent and does not rely on server-side session storage. This simplifies scaling and improves reliability.
