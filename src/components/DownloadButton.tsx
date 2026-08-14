import { useState, useRef } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { downloadElementAsHtml } from '@/lib/exportHtml';

interface DownloadButtonProps {
  /** Title shown in the exported HTML banner and used for the filename. */
  title: string;
  /** Optional subtitle shown under the title in the banner. */
  subtitle?: string;
  /** CSS class override for button styling. If omitted, a default style is used. */
  className?: string;
  /** Label shown next to the icon. Pass empty string to hide. */
  label?: string;
}

export function DownloadButton({
  title,
  subtitle,
  className,
  label = 'Export',
}: DownloadButtonProps) {
  const [exporting, setExporting] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleExport = () => {
    if (exporting) return;

    // Walk up to find the top-level screen container to export.
    // We look for the nearest ancestor that is a fixed-position full-screen
    // overlay, or fall back to the document body.
    let target: HTMLElement | null = buttonRef.current?.parentElement;
    while (target) {
      const style = window.getComputedStyle(target);
      if (style.position === 'fixed' && style.inset === '0px') break;
      // Also stop at modal containers that have rounded corners + shadow
      if (target.classList.contains('shadow-2xl') && style.position === 'fixed') break;
      target = target.parentElement;
    }

    // If we didn't find a fixed overlay, find the main dashboard container
    if (!target) {
      target = document.querySelector('.min-h-screen') as HTMLElement;
    }

    if (!target) return;

    setExporting(true);

    // Use a microtask delay so the spinner can render before the (synchronous) export work
    setTimeout(() => {
      try {
        downloadElementAsHtml(target!, { title, subtitle });
      } catch (e) {
        console.error('Export failed', e);
      } finally {
        setExporting(false);
      }
    }, 50);
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleExport}
      disabled={exporting}
      title={`Download this page as HTML`}
      className={
        className ??
        'flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50'
      }
    >
      {exporting ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Download className="w-3.5 h-3.5" />
      )}
      {label && <span className="hidden sm:inline">{exporting ? 'Exporting...' : label}</span>}
    </button>
  );
}
