"use client";

import { useState } from "react";

type CopyLinkButtonProps = {
  stampName: string;
};

export default function CopyLinkButton({ stampName }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button type="button" className="share-btn" onClick={copyLink} aria-live="polite">
      <svg className="share-icon share-icon-link" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M10.59 13.41a1.98 1.98 0 0 0 2.82 0l3.18-3.18a2 2 0 0 0-2.83-2.83l-1.06 1.06a1 1 0 1 1-1.42-1.42l1.06-1.06a4 4 0 0 1 5.66 5.66l-3.18 3.18a4 4 0 0 1-5.66 0 1 1 0 0 1 1.42-1.41ZM13.41 10.59a1.98 1.98 0 0 0-2.82 0l-3.18 3.18a2 2 0 0 0 2.83 2.83l1.06-1.06a1 1 0 1 1 1.42 1.42l-1.06 1.06A4 4 0 0 1 6 12.36l3.18-3.18a4 4 0 0 1 5.66 0 1 1 0 0 1-1.42 1.41Z" />
      </svg>
      {copied ? "Copied" : "Copy Link"}
      <span className="sr-only"> for {stampName}</span>
    </button>
  );
}
