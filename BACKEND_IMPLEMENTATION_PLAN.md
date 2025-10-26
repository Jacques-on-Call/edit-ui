# easy-seo: Backend Implementation Plan

This document outlines the plan for refactoring and implementing the Cloudflare Worker backend to align with the `ARCHITECTURAL_BLUEPRINT.md`.

## 1. Refactor API Endpoints for Blueprint Alignment

The first step is to restructure the existing API endpoints to match the RESTful contract defined in the architectural blueprint. This will involve the following changes:

*   **Endpoint Renaming:**
    *   `/api/get-file-content` will be renamed to `/api/files/content`.
    *   `/api/file` (GET) will be renamed to `/api/files/get`.
    *   `/api/files` (DELETE) will be renamed to `/api/files/delete`.
    *   `/api/rename-file` will be refactored to be a `PATCH` request to `/api/files/rename`.
    *   `/api/duplicate-file` will be refactored to be a `POST` request to `/api/files/duplicate`.

*   **Handler Splitting:**
    *   The `handleCreateOrUpdateFileRequest` function will be split into two distinct handlers:
        *   `handleCreateFileRequest` for `POST` requests to `/api/files/create`.
        *   `handleUpdateFileRequest` for `PUT` requests to `/api/files/update`.

*   **Request Router Refactoring:**
    *   The main request router in the `fetch` function will be updated to reflect these new endpoint names and handlers. This will create a more organized and intuitive API structure.

## 2. Implement Missing Folder Management Endpoints

To provide full file management capabilities, the following folder management endpoints will be implemented:

*   **/api/folders/create:**
    *   **Logic:** This endpoint will accept a `repo` and `path` in the request body.
    *   **Implementation:** To create an "empty" directory in a Git repository, the handler will create a new, empty file named `.gitkeep` at the specified path using the GitHub API. This is a standard convention that forces Git to track the directory.

*   **/api/folders/delete:**
    *   **Logic:** This endpoint will accept a `repo` and `path` to the folder that needs to be deleted.
    *   **Implementation:** The handler will perform a recursive deletion. It will first list the contents of the target directory. Then, it will iterate through the contents, deleting each file individually. If a subdirectory is encountered, it will recursively call the deletion logic on that subdirectory before deleting the parent. This ensures the entire folder structure is removed.

## 3. Modularize the Worker Codebase

To improve maintainability and scalability, the monolithic `cloudflare-worker-code.js` will be broken down into a more organized and modular structure. The proposed new file structure will be:

*   **`index.js`:** The main entry point for the Cloudflare Worker. This file will be responsible for routing incoming requests to the appropriate handlers.
*   **`src/router.js`:** This module will contain the request routing logic, mapping API endpoints to their corresponding handler functions.
*   **`src/handlers/`:** This directory will contain the individual handler functions for each API endpoint (e.g., `src/handlers/files.js`, `src/handlers/auth.js`).
*   **`src/services/`:** This directory will house the business logic for interacting with external services, such as:
    *   `src/services/github.js`: A dedicated module for all interactions with the GitHub API.
    *   `src/services/d1.js`: A module for all D1 database operations.
*   **`src/auth.js`:** This module will contain all authentication and session management logic.

## 4. Enhance Security and Error Handling

To ensure the backend is robust and secure, the following enhancements will be implemented:

*   **Formalize Authentication Flow:**
    *   The `/api/auth/github` endpoint will be formally implemented to initiate the GitHub OAuth flow, redirecting the user to the GitHub authorization page.
    *   The `/api/auth/callback` handler will be updated to include state validation to prevent CSRF attacks.

*   **Standardized Error Handling:**
    *   A centralized error handling mechanism will be implemented. This will ensure that all API responses, including errors, follow a consistent JSON format (e.g., `{ "error": { "message": "...", "status": 400 } }`).
    *   Error logging will be improved to provide more detailed and actionable information for debugging.

*   **Input Validation:**
    *   All incoming request bodies and parameters will be validated to prevent common security vulnerabilities, such as injection attacks.

## 5. Isolate and Review D1 Database Features

To streamline the application and focus on the core GitHub-as-a-CMS functionality, the D1 database features will be isolated and reviewed.

*   **Isolate D1 Logic:**
    *   All D1 database-related logic, including layout templates and page assignments, will be moved into a dedicated `src/services/d1.js` module. This will decouple it from the main application logic.

*   **Strategic Review Proposal:**
    *   A strategic review of the D1 features will be proposed to determine their necessity for the initial market launch.
    *   **Recommendation:** To simplify the product and reduce maintenance overhead, it is recommended to deprecate the D1-based graphical layout editor in favor of the unified `.astro` file editing experience. This aligns with the "Astro-first" principle and streamlines the user journey.
