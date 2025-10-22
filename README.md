# easy-seo: The Headless Editor for Astro

Welcome to the `easy-seo` directory. This is a standalone React (soon to be Preact) application that serves as a headless CMS for Astro websites. It provides a user-friendly interface for editing content and layouts, which are then saved directly to a GitHub repository.

## 🚀 Getting Started

This guide will help you set up the `easy-seo` editor for local development.

### Prerequisites

- [Node.js](https://nodejs.org/) version 22.4 or higher
- [npm](https://www.npmjs.com/) version 11 or higher

### Installation

1.  **Navigate to the directory:**
    ```bash
    cd easy-seo
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

## 📜 Available Scripts

In the `easy-seo` directory, you can run the following commands:

### `npm run dev`

Runs the editor in development mode.
Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

The page will automatically reload if you make edits.

### `npm run build`

Builds the editor for production to the `dist/` folder. It correctly bundles the application and optimizes it for the best performance.

### `npm test`

Launches the test runner in interactive watch mode.

## 🗂️ Project Architecture

The `easy-seo` application is a single-page application (SPA) that interacts with a Cloudflare Worker as its backend. The worker proxies requests to the GitHub API, allowing the editor to read and write files to your Astro project's repository.

For a more detailed explanation of the architecture, please see the [ARCHITECTURE.md](ARCHITECTURE.md) file.
