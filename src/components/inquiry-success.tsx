'use client';

import { useEffect, useId, useRef, type RefObject } from 'react';
import { Check, X } from 'lucide-react';

export function InquirySuccess({
  onDismiss,
  returnFocus,
}: {
  onDismiss: () => void;
  returnFocus: RefObject<HTMLButtonElement | null>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const done = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    const element = dialog.current;
    const previousFocus = returnFocus.current ?? document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element?.showModal();
    done.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus({ preventScroll: true });
    };
  }, [returnFocus]);

  return (
    <dialog
      ref={dialog}
      className="inquiry-success"
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onCancel={(event) => event.stopPropagation()}
      onClose={(event) => {
        event.stopPropagation();
        onDismiss();
      }}
    >
      <button
        type="button"
        className="inquiry-success-close"
        aria-label="Close confirmation"
        onClick={() => dialog.current?.close()}
      >
        <X size={20} aria-hidden="true" />
      </button>
      <span className="inquiry-success-icon" aria-hidden="true">
        <Check size={30} strokeWidth={1.6} />
      </span>
      <span className="inquiry-success-brand">UMIYA FLORIST</span>
      <h2 id={titleId} className="inquiry-success-title">
        Inquiry sent
      </h2>
      <p id={messageId} className="inquiry-success-message" role="status">
        Thank you. Your inquiry has been received. We’ll be in touch.
      </p>
      <button
        ref={done}
        type="button"
        className="button inquiry-success-done"
        onClick={() => dialog.current?.close()}
      >
        Done
      </button>
    </dialog>
  );
}
