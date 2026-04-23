import { useState } from 'react';

interface CopyButtonProps {
  text: string;
  label?: string;
}

export default function CopyButton({ text, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded border border-gray-300 hover:bg-gray-100 text-gray-600 transition-colors"
    >
      {copied ? '✓ Copied' : (label ?? 'Copy')}
    </button>
  );
}
