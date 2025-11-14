# Data Schemas

This document defines the structure of key data objects used in the `easy-seo` application.

---

### **`page.json`**

This object represents the structure of a page being edited in the content editor.

-   **`meta`** `(object)`: Contains metadata for the page.
    -   **`title`** `(string)`: The title of the page.
    -   **`slug`** `(string)`: The URL-friendly slug for the page.
    -   **`initialContent`** `(string)`: The initial HTML content for the page.
-   **`children`** `(array)`: An array of block objects that make up the page's structure.
    -   **`id`** `(string)`: A unique identifier for the block.
    -   **`type`** `(string)`: The type of the block (e.g., `hero`, `section`, `paragraph`).
    -   **`props`** `(object)`: A set of properties specific to the block type.
    -   **`children`** `(array)`: A nested array of child block objects.
