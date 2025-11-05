import { memo } from 'preact/compat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Icon from './Icon';

const ReadmeDisplay = memo(({ content, onToggle, isVisible }) => {
  const customStyles = `
    .prose {
      color: #D9D9D9; /* Light gray text */
    }
    .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
      color: #FFFFFF; /* White headings */
    }
    .prose a {
      color: #D8F21D; /* Accent lime for links */
    }
    .prose a:hover {
      text-decoration: underline;
    }
    .prose code {
      background-color: rgba(0, 0, 0, 0.3);
      padding: 0.2em 0.4em;
      margin: 0;
      font-size: 85%;
      border-radius: 6px;
    }
    .prose pre {
      background-color: rgba(0, 0, 0, 0.4);
      padding: 1em;
      border-radius: 8px;
    }
    .prose blockquote {
      border-left-color: #D8F21D;
      color: #cccccc;
    }
    .prose hr {
      border-top-color: rgba(255, 255, 255, 0.2);
    }
  `;

  return (
    <>
      <style>{customStyles}</style>
      <div className="text-white rounded-lg overflow-hidden">
        <div
          className="px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-white/10"
          onClick={onToggle}
        >
          <h3 className="text-lg font-semibold flex items-center gap-3">
            <Icon name="BookOpen" className="text-accent-lime" />
            <span>README.md</span>
          </h3>
          <button className="text-white/60 hover:text-white">
            <Icon name={isVisible ? 'ChevronUp' : 'ChevronDown'} />
          </button>
        </div>
        {isVisible && (
          <div className="p-6 border-t border-white/10">
            <article className="prose max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </article>
          </div>
        )}
      </div>
    </>
  );
});

export default ReadmeDisplay;
