import styles from './ConfirmDialog.module.css';

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.confirmDialogContent}>
        <p>{message}</p>
        <div className={styles.modalActions}>
          <button className={styles.btnCancel} onClick={onCancel}>Cancel</button>
          <button className={styles.btnConfirm} onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
