import React from 'react';
import Button from './components/Button/Button';
import Modal from './components/Modal/Modal';

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <Modal
      title="Confirm Action"
      onClose={onCancel}
      actions={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            Confirm
          </Button>
        </>
      }
    >
      <div className="text-center text-base text-gray-700 leading-relaxed">
        {message}
      </div>
    </Modal>
  );
}

export default ConfirmDialog;