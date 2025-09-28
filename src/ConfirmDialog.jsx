import styles from './ConfirmDialog.module.css';
import Button from './components/Button/Button';

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.confirmDialogContent} onClick={(e) => e.stopPropagation()}>
        <p>{message}</p>
        <div className={styles.modalActions}>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
