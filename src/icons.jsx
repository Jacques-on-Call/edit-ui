import React from 'react';

// Individual Icon Components (named exports)
export const BackIcon = ({ className = 'w-6 h-6', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

export const SearchIcon = ({ className = 'w-6 h-6', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export const EditIcon = ({ className = 'w-6 h-6', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
  </svg>
);

export const HomeIcon = ({ className = 'w-6 h-6', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M5 10v11a2 2 0 002 2h10a2 2 0 002-2V10" />
  </svg>
);

export const PlusIcon = ({ className = 'w-6 h-6', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

export const FolderIcon = ({ className = 'w-6 h-6', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

export const FileIcon = ({ className = 'w-6 h-6', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export const EyeIcon = ({ className = 'w-6 h-6', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

export const TypeIcon = ({ className = 'w-6 h-6', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7V4h16v3M9 20h6M12 4v16" />
  </svg>
);

export const UndoIcon = ({ className = 'w-6 h-6', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 15l-3-3m0 0l3-3m-3 3h8a5 5 0 015 5v1" />
  </svg>
);

export const RedoIcon = ({ className = 'w-6 h-6', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 15l3-3m0 0l-3-3m3 3H8a5 5 0 00-5 5v1" />
  </svg>
);

export const BoldIcon = ({ className = 'w-6 h-6', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6V4zm0 8h9a4 4 0 014 4 4 4 0 01-4 4H6v-8z" />
  </svg>
);

export const ItalicIcon = ({ className = 'w-6 h-6', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4h6M7 20h6M14 4L10 20" />
  </svg>
);

export const UnderlineIcon = ({ className = 'w-6 h-6', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 3v8a6 6 0 006 6 6 6 0 006-6V3M4 21h16" />
  </svg>
);

export const ListIcon = ({ className = 'w-6 h-6', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
  </svg>
);

export const MinusIcon = ({ className = 'w-6 h-6', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
  </svg>
);

export const BookOpenIcon = ({ className = 'w-6 h-6', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.25278C12 6.25278 12 2.75 12 2.75C12 2.75 17.5 2.75 17.5 2.75C17.5 2.75 17.5 13.25 17.5 13.25C17.5 13.25 12 13.25 12 13.25" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.25278C12 6.25278 12 2.75 12 2.75C12 2.75 6.5 2.75 6.5 2.75C6.5 2.75 6.5 13.25 6.5 13.25C6.5 13.25 12 13.25 12 13.25" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 17.75C16 17.75 12 15.75 8 17.75" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.25278V13.25" />
  </svg>
);

export const ChevronUpIcon = ({ className = 'w-6 h-6', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
  </svg>
);

export const ChevronDownIcon = ({ className = 'w-6 h-6', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
  </svg>
);

// Generic Icon Component (default export)
const Icon = ({ name, ...props }) => {
  switch (name) {
    case 'back':
      return <BackIcon {...props} />;
    case 'search':
      return <SearchIcon {...props} />;
    case 'edit':
      return <EditIcon {...props} />;
    case 'home':
      return <HomeIcon {...props} />;
    case 'plus':
      return <PlusIcon {...props} />;
    case 'folder':
      return <FolderIcon {...props} />;
    case 'file':
      return <FileIcon {...props} />;
    case 'eye':
      return <EyeIcon {...props} />;
    case 'type':
      return <TypeIcon {...props} />;
    case 'corner-up-left':
      return <UndoIcon {...props} />;
    case 'corner-up-right':
      return <RedoIcon {...props} />;
    case 'bold':
      return <BoldIcon {...props} />;
    case 'italic':
      return <ItalicIcon {...props} />;
    case 'underline':
      return <UnderlineIcon {...props} />;
    case 'list':
      return <ListIcon {...props} />;
    case 'minus':
      return <MinusIcon {...props} />;
    case 'book-open':
      return <BookOpenIcon {...props} />;
    case 'chevron-up':
      return <ChevronUpIcon {...props} />;
    case 'chevron-down':
      return <ChevronDownIcon {...props} />;
    default:
      return null; // Or a default icon
  }
};

export default Icon;