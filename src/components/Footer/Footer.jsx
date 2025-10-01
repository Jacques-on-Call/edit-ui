import { HomeIcon, PlusIcon } from '../../icons';
import Button from '../Button/Button';

function Footer({ currentPath, onGoHome, onCreate }) {
  const isAtRoot = currentPath === 'src/pages';

  const getFolderName = () => {
    if (isAtRoot) return '';
    const segments = currentPath.split('/');
    return segments[segments.length - 1];
  };

  const homeButtonClasses = `flex items-center bg-transparent border-none text-white cursor-pointer p-2 rounded transition-colors duration-200 ease-in-out hover:enabled:bg-white/10 disabled:text-[#a0cfff] disabled:cursor-default`;

  return (
    <footer className="fixed bottom-0 left-0 w-full flex justify-between items-center px-4 py-2 bg-blue text-white border-t border-[#002a52] z-[100] gap-4 box-border">
      <div className="flex-1 flex items-center"></div>

      <div className="flex-1 flex justify-center">
        {/*
          This button uses the 'primary' variant for its colors (green bg, light-green border)
          but adds the layout styles from the old 'fab' variant (shadow, translation) directly
          in the className to achieve the desired floating effect.
        */}
        <Button
          variant="primary"
          onClick={onCreate}
          className="w-14 h-14 rounded-full p-0 shadow-lg -translate-y-5 flex items-center justify-center"
          aria-label="Create new file or folder"
        >
          <PlusIcon />
        </Button>
      </div>

      <div className="flex-1 flex justify-end">
        <button
          onClick={onGoHome}
          className={homeButtonClasses}
          disabled={isAtRoot}
          aria-label="Go to home directory"
        >
          <HomeIcon />
          {!isAtRoot && (
            <span className="ml-2 text-sm font-medium">{getFolderName()}</span>
          )}
        </button>
      </div>
    </footer>
  );
}

export default Footer;