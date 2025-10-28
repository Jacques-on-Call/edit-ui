# SCHEMAS.md: Component & Schema Contracts

This document is the single source of truth for the data structures and component contracts used throughout the application. It is intended to prevent data-related bugs by providing a clear, centralized definition of the shapes of our data.

---

## 📂 API Schemas

This section defines the schemas for the JSON objects returned by our backend API.

### 1. **File Object (`/api/files/list`)**

This object represents a single file or directory as returned by the GitHub Contents API.

-   **Description:** A standard GitHub API file object.
-   **Endpoint:** `GET /api/files/list`
-   **Shape:** `Array<FileObject>`

| Key | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `name` | `String` | The name of the file or directory. | `"index.md"` |
| `path` | `String` | The full path to the file or directory. | `"src/pages/index.md"` |
| `sha` | `String` | The unique SHA-1 hash of the file. | `"a1b2c3d4..."` |
| `size` | `Number` | The size of the file in bytes. | `1234` |
| `type` | `String` | The type of the content. Can be `"file"` or `"dir"`. | `"file"` |
| `url` | `String` | The direct API URL to this file's content. | `"https://api.github.com/..."` |
| `html_url` | `String` | The URL to view this file on GitHub.com. | `"https://github.com/..."` |
| `git_url` | `String` | The Git blob/tree URL. | `"https://api.github.com/..."` |
| `download_url`| `String` &#124; `null` | The raw download URL for the file. `null` for directories. | `"https://raw.githubusercontent.com/..."` |

---

### 2. **User Object (`/api/me`)**

This object represents the authenticated user.

-   **Description:** A standard GitHub API user object.
-   **Endpoint:** `GET /api/me`
-   **Shape:** `UserObject`

| Key | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `login` | `String` | The user's GitHub username. | `"octocat"` |
| `id` | `Number` | The user's unique GitHub ID. | `12345` |
| `avatar_url` | `String` | The URL for the user's avatar image. | `"https://avatars.githubusercontent.com/..."` |
| `name` | `String` | The user's display name. | `"The Octocat"` |

---

## 📦 Component Prop Contracts

*This section is a work in progress and should be expanded as new, complex components are created.*
