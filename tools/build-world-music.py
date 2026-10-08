#!/usr/bin/env python3
"""Rebuild Glorytales excerpts from the pinned, checksum-verified originals."""
import hashlib
import json
import pathlib
import subprocess
import tempfile
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
manifest = json.loads((ROOT / 'assets/audio/source-manifest.json').read_text())
with tempfile.TemporaryDirectory() as temporary:
    for entry in manifest['files']:
        if not entry['path'].startswith('assets/audio/world-'):
            continue
        revision = entry['source'].rsplit('/', 1)[1]
        url = f"https://raw.githubusercontent.com/0xabad1dea/glorytales/{revision}/tracks/{entry['original']}"
        data = urllib.request.urlopen(url, timeout=60).read()
        if hashlib.sha256(data).hexdigest() != entry['sourceSha256']:
            raise ValueError(f"Source checksum changed: {entry['original']}")
        source = pathlib.Path(temporary) / entry['original']
        source.write_bytes(data)
        duration = min(75, float(subprocess.check_output([
            'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
            '-of', 'default=nw=1:nk=1', str(source)])))
        subprocess.run([
            'ffmpeg', '-v', 'error', '-y', '-i', str(source), '-t', str(duration),
            '-af', f'loudnorm=I=-20:TP=-3:LRA=9,afade=t=in:st=0:d=1,afade=t=out:st={duration-2}:d=2',
            '-ac', '1', '-ar', '24000', '-b:a', '48k', '-map_metadata', '-1',
            str(ROOT / entry['path'])], check=True)
        print(entry['path'])
