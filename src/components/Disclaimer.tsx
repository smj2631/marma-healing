import { useState } from 'react';
import { loadRaw, save } from '../lib/storage';
import { Sheet } from './Sheet';

export function Disclaimer() {
  const [open, setOpen] = useState(() => !loadRaw<boolean>('disclaimerAccepted'));
  const accept = () => {
    save('disclaimerAccepted', true);
    setOpen(false);
  };
  return (
    <Sheet open={open} onClose={accept} title="Before you begin">
      <p className="text-lg leading-relaxed">
        Marma Healing is a <b>complementary wellness practice</b>, not medical advice or treatment.
      </p>
      <p className="mt-3 leading-relaxed opacity-80">
        If you have any eye condition, an infection, or have had eye surgery or injury, please consult a doctor before practising. Use light pressure only and stop if anything hurts.
      </p>
      <button className="btn-primary mt-6 w-full" onClick={accept}>
        I understand
      </button>
    </Sheet>
  );
}
