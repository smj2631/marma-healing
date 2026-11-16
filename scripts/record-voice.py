"""
Pre-records every spoken line with a Piper voice (LibriTTS, CC BY 4.0).
Usage: python scripts/record-voice.py LINES_JSON MODEL_ONNX SPEAKER_ID
Writes public/voice/<hash>.m4a and public/voice/manifest.json.
"""
import hashlib, io, json, os, re, subprocess, sys, wave
import numpy as np
from piper import PiperVoice, SynthesisConfig

lines = json.load(open(sys.argv[1]))
model, speaker = sys.argv[2], int(sys.argv[3])
v = PiperVoice.load(model, config_path=model + '.json')
SR = v.config.sample_rate
out = os.path.join(os.path.dirname(__file__), '..', 'public', 'voice')
os.makedirs(out, exist_ok=True)
for f in os.listdir(out):
    os.remove(os.path.join(out, f))

key = lambda s: re.sub(r'[^a-z0-9]+', ' ', s.lower()).strip()
manifest = {}
for line in lines:
    k = key(line)
    if not k or k in manifest:
        continue
    short = len(k.split()) <= 2
    cfg = SynthesisConfig(speaker_id=speaker, length_scale=1.08 if short else 1.18, noise_scale=0.5, noise_w_scale=0.6)
    b = io.BytesIO()
    with wave.open(b, 'wb') as w:
        v.synthesize_wav(line, w, syn_config=cfg)
    b.seek(0)
    w = wave.open(b)
    x = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(np.float32) / 32768
    # trim silence, keep a short pad, soft fade at the edges
    loud = np.where(np.abs(x) > 0.02)[0]
    if len(loud):
        x = x[max(0, loud[0] - int(0.03 * SR)): loud[-1] + int(0.08 * SR)]
    f = min(len(x) // 4, int(0.01 * SR))
    x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f)
    x = x / max(1e-6, np.abs(x).max()) * 0.85
    name = hashlib.sha1(k.encode()).hexdigest()[:10] + '.m4a'
    raw = (x * 32767).astype('<i2').tobytes()
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-',
                    '-af', 'highpass=f=70,lowpass=f=9000', '-c:a', 'aac', '-b:a', '48k', '-movflags', '+faststart',
                    os.path.join(out, name)], input=raw, check=True)
    manifest[k] = name
json.dump(manifest, open(os.path.join(out, 'manifest.json'), 'w'), indent=0)
print(len(manifest), 'clips')
