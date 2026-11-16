import { useState } from 'react';
import { useInstall } from '../lib/install';
import { DownloadIcon, ShareIcon } from './Icons';
import { Sheet } from './Sheet';

export function InstallButton({ className = '' }: { className?: string }) {
  const { canPrompt, installed, ios, prompt } = useInstall();
  const [help, setHelp] = useState(false);
  if (installed) return null;
  return (
    <>
      <button className={`btn-ghost ${className}`} onClick={() => (canPrompt ? void prompt() : setHelp(true))}>
        <DownloadIcon width={20} height={20} /> Install app
      </button>
      <Sheet open={help} onClose={() => setHelp(false)} title="Add to Home Screen">
        {ios ? (
          <ol className="space-y-3 text-lg">
            <li>1. Open this page in <b>Safari</b>.</li>
            <li className="flex flex-wrap items-center gap-1">
              2. Tap the <b>Share</b> button <ShareIcon width={20} height={20} className="inline" /> in the toolbar.
            </li>
            <li>3. Scroll and choose <b>Add to Home Screen</b>.</li>
            <li>4. Tap <b>Add</b>. Marma Healing will open full screen and work offline.</li>
          </ol>
        ) : (
          <ol className="space-y-3 text-lg">
            <li>1. Open your browser menu (⋮ or ⋯).</li>
            <li>2. Choose <b>Install app</b> or <b>Add to Home screen</b>.</li>
            <li>3. Confirm. The app then works fully offline.</li>
          </ol>
        )}
      </Sheet>
    </>
  );
}
