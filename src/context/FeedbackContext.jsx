import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import ConfirmDialog from '../components/feedback/ConfirmDialog';
import ToastViewport from '../components/feedback/ToastViewport';

const FeedbackContext = createContext(null);

export function FeedbackProvider({ children }) {
  const nextToastIdRef = useRef(1);
  const timeoutIdsRef = useRef(new Map());
  const [toasts, setToasts] = useState([]);
  const [confirmation, setConfirmation] = useState(null);

  const dismissToast = useCallback((toastId) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== toastId));

    const timeoutId = timeoutIdsRef.current.get(toastId);

    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeoutIdsRef.current.delete(toastId);
    }
  }, []);

  useEffect(() => (
    () => {
      timeoutIdsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      timeoutIdsRef.current.clear();
    }
  ), []);

  const notify = useCallback((options = {}) => {
    const {
      actions = [],
      durationMs,
      message = '',
      tone = 'success'
    } = options;

    if (!message) {
      return '';
    }

    const toastId = `toast-${nextToastIdRef.current++}`;
    const normalizedActions = (Array.isArray(actions) ? actions : [actions]).filter(Boolean);

    setToasts((currentToasts) => [
      ...currentToasts,
      {
        actions: normalizedActions,
        id: toastId,
        message,
        tone
      }
    ]);

    const nextDuration = durationMs ?? (tone === 'success' ? 3200 : 0);

    if (nextDuration > 0) {
      const timeoutId = window.setTimeout(() => {
        dismissToast(toastId);
      }, nextDuration);

      timeoutIdsRef.current.set(toastId, timeoutId);
    }

    return toastId;
  }, [dismissToast]);

  const confirm = useCallback((options = {}) => new Promise((resolve) => {
    setConfirmation((currentConfirmation) => {
      currentConfirmation?.resolve(false);

      return {
        cancelLabel: options.cancelLabel || 'Cancel',
        confirmLabel: options.confirmLabel || 'Confirm',
        message: options.message || '',
        resolve,
        title: options.title || 'Confirm action',
        tone: options.tone || 'danger'
      };
    });
  }), []);

  const closeConfirmation = useCallback((result) => {
    setConfirmation((currentConfirmation) => {
      currentConfirmation?.resolve(result);
      return null;
    });
  }, []);

  const value = useMemo(() => ({
    confirm,
    dismissToast,
    notify
  }), [confirm, dismissToast, notify]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <ToastViewport onDismiss={dismissToast} toasts={toasts} />
      <ConfirmDialog
        confirmation={confirmation}
        onCancel={() => closeConfirmation(false)}
        onConfirm={() => closeConfirmation(true)}
      />
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);

  if (!context) {
    throw new Error('useFeedback must be used inside a FeedbackProvider.');
  }

  return context;
}
