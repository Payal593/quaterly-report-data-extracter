"use client";

import { useEffect, useRef } from "react";

export default function ContentModal({
  children,
  eyebrow,
  isOpen,
  meta,
  onClose,
  title,
}) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="news-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <section
        aria-labelledby="content-modal-title"
        aria-modal="true"
        className="news-modal"
        role="dialog"
      >
        <header className="news-modal__header">
          <div>
            {eyebrow && <p>{eyebrow}</p>}
            <h2 id="content-modal-title">{title}</h2>
            {meta && <span>{meta}</span>}
          </div>
          <button
            aria-label="Close dialog"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            ×
          </button>
        </header>
        <div className="news-modal__content">{children}</div>
      </section>
    </div>
  );
}
