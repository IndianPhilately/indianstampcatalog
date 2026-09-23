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
    <button
      type="button"
      onClick={copyLink}
      className="p-1.5 hover:bg-slate-100 rounded-md text-slate-600 hover:text-slate-950 transition cursor-pointer flex items-center gap-1 text-xs"
      title="Copy Link"
      aria-label={`Copy Link for ${stampName}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
      {copied && <span className="font-semibold text-blue-700">Copied!</span>}
    </button>
  );
}