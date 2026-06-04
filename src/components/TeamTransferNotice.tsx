import { createPortal } from 'react-dom';
import './TeamTransferNotice.css';

const STORAGE_KEY = 'joko_transfer_notice_dismissed';

export function isTransferNoticeDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function TeamTransferNotice({ onDismiss }: { onDismiss: () => void }) {
  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* private browsing */
    }
    onDismiss();
  };

  return createPortal(
    <div className="transfer-notice-overlay" role="dialog" aria-modal="true" aria-labelledby="transfer-notice-title">
      <div className="transfer-notice-card">
        <button
          type="button"
          className="transfer-notice-close"
          onClick={handleDismiss}
          aria-label="Close notice"
        >
          ×
        </button>
        <p id="transfer-notice-title" className="transfer-notice-text">
          Joko is undergoing a transfer process of development teams. Team BEAM will be handing
          the project off to their sponsor for future development.
        </p>
      </div>
    </div>,
    document.body,
  );
}
