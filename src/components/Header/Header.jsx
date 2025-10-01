// This is a simple layout component. It provides the styled container.
// The actual content (like the SearchBar) will be passed in as a child.
function Header({ children }) {
  return (
    <header className="flex items-center py-3 px-4 bg-gray-200 border-b border-gray-300 w-full box-border">
      {children}
    </header>
  );
}

export default Header;