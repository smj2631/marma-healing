/** Left hand, palm facing you, thumb on the right. */
export const HAND_THUMB = { tip: { x: 262, y: 160 }, ctrl: { x: 252, y: 222 }, base: { x: 204, y: 258 } };

const FINGERS = [
  { x: 108, top: 120 },
  { x: 140, top: 92 },
  { x: 172, top: 84 },
  { x: 203, top: 104 },
];

export function LeftHand({ relaxed = 0 }: { relaxed?: number }) {
  const curl = relaxed * 18;
  return (
    <g>
      {/* wrist */}
      <path d="M112 300 L108 360 L214 360 L212 300 Z" fill="var(--skin-shade)" />
      {/* outlines then fills, so fingers merge cleanly into the palm */}
      {FINGERS.map((f, i) => (
        <line key={`o${i}`} x1={f.x} y1={210} x2={f.x} y2={f.top + curl} stroke="var(--line)" strokeWidth={31} strokeLinecap="round" />
      ))}
      <path d={`M206 266 Q252 222 ${262 - relaxed * 10} ${160 + curl}`} fill="none" stroke="var(--line)" strokeWidth={37} strokeLinecap="round" />
      <path d="M92 196 Q90 300 120 316 L206 316 Q236 300 232 196 Z" fill="var(--line)" />
      {FINGERS.map((f, i) => (
        <line key={`f${i}`} x1={f.x} y1={212} x2={f.x} y2={f.top + curl} stroke="var(--skin)" strokeWidth={28} strokeLinecap="round" />
      ))}
      <path d={`M206 266 Q252 222 ${262 - relaxed * 10} ${160 + curl}`} fill="none" stroke="var(--skin)" strokeWidth={34} strokeLinecap="round" />
      <path d="M94 198 Q92 298 121 313 L205 313 Q234 298 230 198 Z" fill="var(--skin)" />
      {/* creases */}
      {FINGERS.map((f, i) => (
        <path key={`c${i}`} d={`M${f.x - 9} ${f.top + 38 + curl} q9 4 18 0`} fill="none" stroke="var(--line)" strokeWidth={1} opacity={0.5} />
      ))}
      <path d="M110 232 Q160 220 214 236" fill="none" stroke="var(--line)" strokeWidth={1.2} opacity={0.45} />
      <path d="M200 250 Q170 270 160 312" fill="none" stroke="var(--line)" strokeWidth={1.2} opacity={0.45} />
      {/* thumb mound */}
      <ellipse cx={196} cy={268} rx={26} ry={30} fill="var(--skin-shade)" opacity={0.5} />
    </g>
  );
}
