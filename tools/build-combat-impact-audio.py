"""Build CC0 impact foley from unpacked Kenney Impact Sounds.
Usage: python tools/build-combat-impact-audio.py /path/to/impact-sounds
Requires ffmpeg. The directory must contain Audio/*.ogg and the pack's license.
"""
from pathlib import Path
import hashlib
import json
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[1]) / 'Audio'
# Recorded foley layers: source, playback pitch, gain, delay in ms.
RECIPES = {
    'flesh-hit': [('impactSoft_heavy_001', .86, .8, 0), ('impactPunch_medium_003', .92, .45, 8)],
    'arrow-pierce': [('impactSoft_medium_000', 1.18, .9, 0), ('impactWood_light_003', 1.2, .35, 0)],
    'throwing-pierce': [('impactSoft_heavy_002', .88, .9, 0), ('impactPunch_medium_002', .9, .45, 5)],
    'bolt-pierce': [('impactWood_medium_001', 1.12, .6, 0), ('impactSoft_medium_004', .95, .9, 6)],
    'slash-hit': [('impactSoft_heavy_004', 1.12, .8, 0), ('impactPunch_medium_004', 1.05, .3, 10)],
    'cavalry-hooves': [('impactWood_medium_000', .8, .7, delay) for delay in (0, 70, 190, 260)],
    'charge-hit': [('impactPunch_heavy_003', .72, .8, 0), ('impactWood_heavy_000', .8, .4, 12),
                   ('impactSoft_heavy_000', .82, .7, 8)],
}
manifest_path = ROOT / 'assets/audio/source-manifest.json'
manifest = json.loads(manifest_path.read_text())
for name, layers in RECIPES.items():
    inputs, filters = [], []
    for i, (source, pitch, gain, delay) in enumerate(layers):
        inputs += ['-i', str(SOURCE / (source + '.ogg'))]
        filters.append(f'[{i}:a]silenceremove=start_periods=1:start_threshold=-45dB,'
                       f'aresample=22050,asetrate={22050*pitch},aresample=22050,'
                       f'highpass=f=60,volume={gain},adelay={delay}:all=1[a{i}]')
    labels = ''.join(f'[a{i}]' for i in range(len(layers)))
    filters.append(f'{labels}amix=inputs={len(layers)}:normalize=0,alimiter=limit=0.9:level=false,'
                   'apad=whole_dur=0.55,atrim=duration=0.55,afade=t=out:st=0.48:d=0.07[out]')
    path = f'assets/audio/{name}.mp3'
    subprocess.run(['ffmpeg','-y','-v','error',*inputs,'-filter_complex',';'.join(filters),
                    '-map','[out]','-ac','1','-ar','22050','-b:a','64k',str(ROOT/path)],check=True)
    data = (ROOT/path).read_bytes()
    entry = dict(path=path,author='Kenney',license='CC0-1.0',source='https://kenney.nl/assets/impact-sounds',
                 original=[f'Audio/{layer[0]}.ogg' for layer in layers],
                 conversion='Layered recorded foley; silence trim, pitch/gain/delay per tools/build-combat-impact-audio.py; '
                            '60 Hz high-pass, limiter, 70 ms fade; mono MP3 22.05 kHz 64 kbps, 0.55 seconds',
                 bytes=len(data),sha256=hashlib.sha256(data).hexdigest())
    manifest['files'] = [entry0 for entry0 in manifest['files'] if entry0['path'] != path] + [entry]
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
