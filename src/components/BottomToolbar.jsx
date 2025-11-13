export function BottomToolbar() {
  return (
    <footer
      className="fixed bottom-0 left-0 right-0 h-16 bg-gradient-to-r from-black to-blue-900 border-t border-blue-400"
      style={{
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}
    >
      <div className="flex items-center justify-center h-full">
        {/* Toolbar content will go here */}
      </div>
    </footer>
  );
}
