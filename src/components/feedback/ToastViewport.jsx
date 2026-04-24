import { createPortal } from 'react-dom';
import NotificationActions from '../NotificationActions';

function getToastLabel(tone) {
  return tone === 'error' ? 'Action failed' : 'Done';
}

function ToastViewport({ onDismiss, toasts }) {
  if (!toasts.length || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div aria-label="Notifications" className="toast-viewport" role="region">
      {toasts.map((toast) => (
        <div
          className={`toast-card toast-card-${toast.tone}`}
          key={toast.id}
          role={toast.tone === 'error' ? 'alert' : 'status'}
        >
          <div className="toast-card-head">
            <span className="toast-label">{getToastLabel(toast.tone)}</span>
            <button
              aria-label="Dismiss notification"
              className="toast-dismiss"
              onClick={() => onDismiss(toast.id)}
              type="button"
            >
              Close
            </button>
          </div>
          <p className="toast-message">{toast.message}</p>
          {toast.actions?.length ? <NotificationActions actions={toast.actions} /> : null}
        </div>
      ))}
    </div>,
    document.body
  );
}

export default ToastViewport;
