import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

function ConfirmDialog({ confirmation, onCancel, onConfirm }) {
  const dialogRef = useRef(null);
  const confirmButtonRef = useRef(null);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    if (!confirmation) {
      return undefined;
    }

    const previousElement = document.activeElement;
    const dialogNode = dialogRef.current;
    const focusTimeoutId = window.setTimeout(() => {
      confirmButtonRef.current?.focus();
    }, 0);

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
        return;
      }

      if (event.key !== 'Tab' || !dialogNode) {
        return;
      }

      const focusableNodes = dialogNode.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableNodes.length) {
        return;
      }

      const firstNode = focusableNodes[0];
      const lastNode = focusableNodes[focusableNodes.length - 1];

      if (event.shiftKey && document.activeElement === firstNode) {
        event.preventDefault();
        lastNode.focus();
      } else if (!event.shiftKey && document.activeElement === lastNode) {
        event.preventDefault();
        firstNode.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(focusTimeoutId);
      document.removeEventListener('keydown', handleKeyDown);

      if (previousElement instanceof HTMLElement) {
        previousElement.focus();
      }
    };
  }, [confirmation, onCancel]);

  if (!confirmation || typeof document === 'undefined') {
    return null;
  }

  const {
    cancelLabel,
    confirmLabel,
    message,
    title,
    tone
  } = confirmation;

  return createPortal(
    <div
      className="confirm-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        aria-describedby={message ? messageId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className={`confirm-dialog confirm-dialog-${tone}`}
        ref={dialogRef}
        role="dialog"
      >
        <h2 id={titleId}>{title}</h2>
        {message ? (
          <p className="confirm-message" id={messageId}>
            {message}
          </p>
        ) : null}
        <div className="confirm-actions">
          <button className="button button-muted" onClick={onCancel} type="button">
            {cancelLabel}
          </button>
          <button className="button button-primary" onClick={onConfirm} ref={confirmButtonRef} type="button">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ConfirmDialog;
