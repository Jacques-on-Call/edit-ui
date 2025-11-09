# File Registry

This document lists all significant files in the `easy-seo` project, along with their purpose.

---

### **Core Application Logic**

-   **`src/app.jsx`**: The main application component. Handles routing and global layout.
-   **`src/contexts/AuthContext.jsx`**: Manages global authentication state.
-   **`src/pages/LoginPage.jsx`**: The user login page.
-   **`src/pages/RepoSelectPage.jsx`**: The repository selection page.
-   **`src/pages/FileExplorerPage.jsx`**: The main file explorer page.

### **Utilities**

-   **`src/lib/fetchJson.js`**: A robust, centralized utility for making `fetch` requests to the backend API, with built-in error handling and automatic credential inclusion (sends cookies with all requests).

### **Components**

-   **`src/components/FileExplorer.jsx`**: The core file explorer component. Displays files and folders with metadata, search results, and README content.
-   **`src/components/FileTile.jsx`**: Renders a single file or folder tile with icon, name, and last-edited metadata. Handles click, long-press, and right-click interactions.
-   **`src/components/ReadmeDisplay.jsx`**: Renders the README.md file.
-   **`src/components/Icon.jsx`**: A wrapper for the lucide-preact icon library.
-   **`src/components/ContextMenu.jsx`**: Renders a right-click/long-press context menu with configurable options (Open, Delete, etc.).
-   **`src/components/CreateModal.jsx`**: Renders a modal for creating new files and folders. Accepts callbacks from parent component for file creation.
-   **`src/components/SearchBar.jsx`**: A debounced search input component for filtering files.

### **Hooks**

-   **`src/hooks/useFileManifest.js`**: Custom hook for fetching and managing the complete file manifest of a repository.
-   **`src/hooks/useSearch.js`**: Custom hook for performing client-side search across file names and content.
