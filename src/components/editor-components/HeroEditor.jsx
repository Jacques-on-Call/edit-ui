import { h } from 'preact';

export default function HeroEditor({ props, onChange }) {
  // This handler updates the parent with the full props object on any change.
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...props, [name]: value });
  };

  return (
    <div className="space-y-2">
      <div>
        <label className="block text-xs font-medium text-gray-300 mb-1">
          Title
        </label>
        <input
          type="text"
          name="title"
          value={props?.title || ''}
          onInput={handleInputChange}
          className="w-full p-2 rounded bg-gray-800 border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-300 mb-1">
          Subtitle
        </label>
        <input
          type="text"
          name="subtitle"
          value={props?.subtitle || ''}
          onInput={handleInputChange}
          className="w-full p-2 rounded bg-gray-800 border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
       <div>
        <label className="block text-xs font-medium text-gray-300 mb-1">
          Body
        </label>
        <textarea
          name="body"
          value={props?.body || ''}
          onInput={handleInputChange}
          rows="4"
          className="w-full p-2 rounded bg-gray-800 border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );
}
