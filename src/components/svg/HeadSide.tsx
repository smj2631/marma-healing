/** Side-profile head facing left, with the ear and the mastoid bulge behind it. */
export function HeadSide({ highlightBulge = true }: { highlightBulge?: boolean }) {
  return (
    <g>
      <path d="M150 262 L146 340 L236 340 L232 262 Z" fill="var(--skin-shade)" />
      <path d="M90 360 Q110 330 146 326 L236 326 Q270 332 286 360 Z" fill="var(--cloth)" />
      <path
        d="M160 52 C 108 52 78 88 76 132 C 75 144 72 152 64 170 C 60 178 66 182 74 184 C 72 194 74 200 78 204 C 74 210 76 216 82 220 C 84 236 92 250 110 252 C 128 254 140 256 146 266 L 232 266 C 252 236 262 200 258 160 C 254 96 214 52 160 52 Z"
        fill="var(--skin)"
        stroke="var(--line)"
        strokeWidth="1.4"
      />
      {/* hair */}
      <path d="M78 122 C 80 76 120 46 170 50 C 226 54 266 104 256 176 C 248 150 236 140 224 136 C 210 110 170 96 140 104 C 112 100 92 108 78 122 Z" fill="var(--hair)" />
      {/* eye + brow */}
      <path d="M86 146 Q96 140 106 146" fill="none" stroke="var(--hair)" strokeWidth="4" strokeLinecap="round" />
      <path d="M88 160 Q96 156 104 160" fill="none" stroke="var(--line)" strokeWidth="2" strokeLinecap="round" />
      <path d="M78 214 Q86 216 92 212" fill="none" stroke="var(--line)" strokeWidth="1.6" strokeLinecap="round" />
      {/* ear */}
      <path d="M176 160 C 196 154 204 176 198 194 C 194 206 188 210 184 222 C 180 232 168 230 170 218 C 172 206 164 190 168 174 C 170 166 172 162 176 160 Z" fill="var(--skin-shade)" stroke="var(--line)" strokeWidth="1.3" />
      <path d="M180 172 C 190 172 192 186 186 196" fill="none" stroke="var(--line)" strokeWidth="1.1" />
      {/* mastoid bulge */}
      <path d="M196 224 C 206 214 220 220 218 234 C 216 244 202 246 196 238" fill={highlightBulge ? 'rgba(244,162,38,0.18)' : 'none'} stroke="var(--line)" strokeWidth="1.1" strokeDasharray="3 3" />
    </g>
  );
}
