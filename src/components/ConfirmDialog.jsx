import Icon from './Icon';

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-sm">
        <h2 className="text-lg font-bold mb-4">Are you sure?</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex items-center justify-end space-x-4">
          <button
            onClick={onCancel}
            className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center"
          >
            <Icon name="trash" className="mr-2" size={16} />
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
