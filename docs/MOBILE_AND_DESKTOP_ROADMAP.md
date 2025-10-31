# easy-seo: Mobile and Desktop Roadmap

This document outlines the strategic roadmap for wrapping the `easy-seo` Preact single-page application (SPA) into native mobile and desktop applications, ensuring a clear path to the Apple App Store, Google Play Store, and various desktop app stores.

## 1. Proposed Cross-Platform Technology Stack

To efficiently bring the `easy-seo` application to both mobile and desktop platforms, a dual-stack approach is recommended. This strategy leverages the best modern tools for each environment, maximizing code reuse while ensuring a high-quality, native-like experience.

*   **For Mobile (iOS & Android): Capacitor**
    *   **What it is:** Capacitor is a modern, open-source framework for building native mobile apps with web technology. It acts as a spiritual successor to Cordova/PhoneGap but with a more modern, developer-friendly approach.
    *   **Why it's the right choice:**
        *   **Maximum Code Reuse:** We can use our existing Preact SPA as the entire UI for the mobile app with minimal changes.
        *   **True Native Access:** Capacitor provides a simple API to access native device features (like camera, haptics, and secure storage) if we need them in the future.
        *   **Performance:** It uses the underlying system WebView, which is highly performant on modern devices.
        *   **Future-Proof:** It's maintained by the team behind Ionic Framework and has a strong, active community.

*   **For Desktop (Windows, macOS, & Linux): Tauri**
    *   **What it is:** Tauri is a framework for building lightweight, secure, and performant desktop applications using a web frontend. Unlike Electron, it uses the operating system's native rendering engine (WebView2 on Windows, WebKit on macOS), which results in much smaller and more memory-efficient applications.
    *   **Why it's the right choice:**
        *   **Tiny Bundle Size:** Tauri apps are incredibly small because they don't bundle a full browser like Electron. A "Hello, World!" app can be under 2MB.
        *   **Security First:** Tauri is designed with security as a core principle, with features like API allowlisting and content security policies enabled by default.
        *   **Performance:** By leveraging the OS's native web renderer and a Rust backend, Tauri apps are fast and have a low memory footprint.
        *   **Modern and Growing:** Tauri is a rapidly growing project with a vibrant community, representing the next generation of desktop app development with web technologies.

## 2. Mobile App Deployment Roadmap (Capacitor)

This section provides a high-level, step-by-step guide for packaging the Preact SPA for both iOS and Android using Capacitor.

*   **Phase 1: Integration and Configuration**
    1.  **Add Capacitor to Project:** Integrate Capacitor into the existing `easy-seo` Preact project by installing the Capacitor CLI and core packages.
    2.  **Initialize Capacitor:** Run `npx cap init` to create the Capacitor configuration file (`capacitor.config.json`). This file will define the app's name, ID, and the location of the web build directory (`dist`).
    3.  **Add Native Platforms:** Add the iOS and Android platforms by running `npx cap add ios` and `npx cap add android`. This will create native Xcode and Android Studio projects in the `ios/` and `android/` directories.

*   **Phase 2: Mobile UI/UX Enhancements**
    1.  **Safe Area and Notch Handling:** The UI will be updated to respect mobile safe areas, ensuring that interactive elements are not obscured by device notches or home indicators. This will be handled with CSS environment variables (e.g., `env(safe-area-inset-bottom)`).
    2.  **Native Gestures:** The application will be tested to ensure smooth scrolling and responsiveness to standard mobile gestures. If necessary, Capacitor's APIs can be used to hook into native gesture events.
    3.  **Splash Screens and Icons:** High-resolution app icons and splash screens will be generated for all required device sizes using the `cordova-res` tool, which is fully compatible with Capacitor.

*   **Phase 3: App Store Compliance and Submission**
    1.  **Permissions and Privacy:** The `Info.plist` (iOS) and `AndroidManifest.xml` (Android) files will be updated to include any necessary permissions and privacy manifests (e.g., for accessing photos, if that feature is added in the future).
    2.  **Build and Test:** Native builds will be created using Xcode and Android Studio. These builds will be thoroughly tested on physical devices and simulators to ensure they meet quality standards.
    3.  **App Store Submission:**
        *   **iOS:** The final build will be submitted to the Apple App Store via App Store Connect, complete with all required metadata, screenshots, and privacy information.
        *   **Android:** The final build will be signed and submitted to the Google Play Store via the Google Play Console.

## 3. Desktop App Deployment Roadmap (Tauri)

This section provides a high-level, step-by-step guide for packaging the Preact SPA as a lightweight, secure, and performant desktop application for Windows, macOS, and Linux using Tauri.

*   **Phase 1: Integration and Configuration**
    1.  **Add Tauri to Project:** Integrate Tauri by installing the Tauri CLI and Rust (if not already installed).
    2.  **Initialize Tauri:** Run `npx tauri init` to create the `src-tauri` directory. This will contain the Rust backend and the Tauri configuration file (`tauri.conf.json`). This file will be configured to point to our Preact app's build output.
    3.  **API Allowlisting:** The `tauri.conf.json` file will be configured with a strict API allowlist. This is a key security feature of Tauri, ensuring that the frontend can only access the specific native functionalities that we explicitly permit.

*   **Phase 2: Desktop-Specific Features and UI**
    1.  **Custom Window and Menus:** Tauri's API will be used to create a custom, frameless window and native application menus (e.g., "File," "Edit"). This will make the application feel more at home on the desktop.
    2.  **File System Integration (Future):** If needed, Tauri's secure file system API can be used to provide direct access to local files, which could be a powerful feature for future versions of the editor.
    3.  **Offline Support:** The application will be configured to work seamlessly offline. Since the core UI is a local web application, this is a natural fit.

*   **Phase 3: Packaging and Distribution**
    1.  **Icon Generation:** Platform-specific icons (e.g., `.icns` for macOS, `.ico` for Windows) will be generated using the Tauri CLI.
    2.  **Build and Package:** The `npx tauri build` command will be used to compile the Rust backend and package the Preact frontend into a single, lightweight executable for each target platform (e.g., `.dmg` for macOS, `.msi` for Windows, `.AppImage` for Linux).
    3.  **Store Submission and Signing:** The final executables will be code-signed to ensure they are trusted by the operating systems. They can then be submitted to the Mac App Store and Microsoft Store, or distributed directly.
