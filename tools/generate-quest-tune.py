#!/usr/bin/env python3
"""Compose an original short horn/chime cadence; requires ffmpeg to encode MP3."""
import math
import pathlib
import struct
import subprocess
import tempfile
import wave

RATE = 32000
DURATION = 2.8
# Original rising cadence, with an open-fifth drone and a soft closing chime.
NOTES = [(0, 62, .36), (.3, 69, .36), (.6, 71, .36), (.9, 74, .55), (1.35, 74, 1.2)]

def horn(t, frequency, duration):
    if not 0 <= t < duration:
        return 0
    attack = min(1, t / .045)
    release = min(1, (duration-t) / .2)
    tone = sum(math.sin(2*math.pi*frequency*h*t)*v for h,v in [(1,1),(2,.28),(3,.16),(4,.06)])
    return tone*attack*release*math.exp(-t*.45)

samples = []
for i in range(int(RATE*DURATION)):
    t = i/RATE
    melody = sum(horn(t-start, 440*2**((midi-69)/12), length) for start,midi,length in NOTES)*.25
    drone = sum(horn(t, f, 2.55) for f in [146.8324,220])*.07
    chime_t = t-1.35
    chime = 0 if chime_t < 0 else math.sin(2*math.pi*1174.66*chime_t)*math.exp(-chime_t*4)*min(1,chime_t/.008)*.075
    fade = min(1,(DURATION-t)/.25)
    samples.append((melody+drone+chime)*fade)
peak = max(map(abs,samples))
output = pathlib.Path(__file__).resolve().parents[1]/'assets/audio/quest-complete.mp3'
with tempfile.TemporaryDirectory() as temporary:
    source = pathlib.Path(temporary)/'quest-complete.wav'
    with wave.open(str(source),'wb') as audio:
        audio.setparams((1,2,RATE,0,'NONE','not compressed'))
        audio.writeframes(b''.join(struct.pack('<h',round(sample/peak*.78*32767)) for sample in samples))
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(source),'-codec:a','libmp3lame','-b:a','64k',str(output)],check=True)
