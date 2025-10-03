function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000]">
      <div className="bg-white p-6 rounded-lg shadow-xl w-[90%] max-w-md text-center">
        <p className="m-0 mb-6 text-base text-gray-800">{message}</p>
        <div className="flex justify-center gap-3">
          <button className="py-2 px-5 text-base rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300" onClick={onCancel}>Cancel</button>
          <button className="py-2 px-5 text-base rounded-lg bg-red-600 text-white hover:opacity-90" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;