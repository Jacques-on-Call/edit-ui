// easy-seo/src/themes/theme.js

/**
 * A shared design system for the Easy-SEO application.
 * This ensures a consistent and cohesive user experience.
 */
export const theme = {
  colors: {
    primary: '#191970',       // Midnight Blue
    background: '#191970',    // Midnight Blue
    surface: '#1E1E1E',       // A slightly lighter dark gray for cards, panels, etc.
    text: '#FFFFFF',          // White
    textSecondary: '#D9D9D9', // Less focused text
    accent: '#D8F21D',        // Yellow Green
    button: '#000000',        // Black
    buttonText: '#FFFFFF',    // White
    success: '#32CD32',       // Lime Green for success states
    error: '#FF4500',         // OrangeRed for error states
  },
  typography: {
    fontFamily: '"Quicksand", sans-serif',
    h1: 'text-4xl font-bold',
    h2: 'text-3xl font-bold',
    body: 'text-base font-normal',
  },
  icons: {
    file: 'FileText',
    folder: 'Folder',
    repo: 'Github',
    home: 'Home',
    settings: 'Settings',
    logout: 'LogOut',
    login: 'LogIn',
    spinner: 'Loader',
    error: 'AlertTriangle',
    add: 'Plus',
    edit: 'Edit',
    delete: 'Trash2',
    save: 'Save',
    publish: 'CloudUpload',
  },
};
