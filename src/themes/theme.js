// easy-seo/src/themes/theme.js

/**
 * A shared design system for the Easy-SEO application.
 * This ensures a consistent and cohesive user experience.
 */
export const theme = {
  colors: {
    primary: '#191970',       // Midnight Blue
    background: '#121212',    // A very dark gray, almost black
    surface: '#1E1E1E',       // A slightly lighter dark gray for cards, panels, etc.
    text: '#FFFFFF',          // High-contrast white for readability
    textSecondary: '#A9A9A9', // A muted gray for secondary text
    accent: '#00BFFF',        // Deep Sky Blue, a complementary accent
    success: '#32CD32',       // Lime Green for success states
    error: '#FF4500',         // OrangeRed for error states
  },
  typography: {
    fontFamily: '"Inter", sans-serif', // A clean, modern sans-serif font
    h1: 'text-4xl font-bold',
    h2: 'text-3xl font-bold',
    body: 'text-base font-normal',
  },
  icons: {
    // A centralized list of icon names from lucide-preact
    // This helps maintain consistency and avoids typos.
    // Example: import { theme } from '../themes/theme'; <Icon name={theme.icons.file} />
    file: 'FileText',
    folder: 'Folder',
    repo: 'Github',
    home: 'Home',
    settings: 'Settings',
    logout: 'LogOut',
    login: 'LogIn',
    spinner: 'Loader',
    error: 'AlertTriangle',
  },
};
