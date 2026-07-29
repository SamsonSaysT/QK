"""Synthesises four dark placeholder tracks. Replace with real music Quinn owns."""
import os, subprocess
import numpy as np

SR = 32000
OUT = "site/assets/audio"
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(666)


def t(n):
    return np.arange(n) / SR


def env(n, a, d, s, r, sus=0.6):
    e = np.zeros(n)
    ai, di, ri = int(a * SR), int(d * SR), int(r * SR)
    ai, di, ri = min(ai, n), min(di, max(0, n - ai)), min(ri, n)
    si = max(0, n - ai - di - ri)
    segs = [np.linspace(0, 1, ai, endpoint=False),
            np.linspace(1, sus, di, endpoint=False),
            np.full(si, sus),
            np.linspace(sus, 0, ri)]
    e = np.concatenate(segs)[:n]
    return np.pad(e, (0, max(0, n - len(e))))


def lp(x, cut):
    """one-pole lowpass, vectorised via exponential smoothing kernel"""
    a = np.exp(-2 * np.pi * cut / SR)
    k = a ** np.arange(int(min(4000, 6 / max(1e-6, 1 - a))))
    k /= k.sum()
    return np.convolve(x, k, mode="same")


def reverb(x, secs=1.6, wet=0.35, pre=0.02):
    n = int(secs * SR)
    ir = rng.normal(0, 1, n) * np.exp(-np.linspace(0, 6.5, n))
    ir = lp(ir, 3200)
    ir[:int(pre * SR)] = 0
    ir /= np.abs(ir).sum() / 6
    L = len(x) + n
    N = 1 << (L - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, N) * np.fft.rfft(ir, N))[:len(x)]
    return (1 - wet) * x + wet * y


def place(buf, sig, at):
    i = int(at * SR)
    j = min(len(buf), i + len(sig))
    if i < len(buf):
        buf[i:j] += sig[:j - i]


def norm(x, peak=0.89):
    x = np.tanh(x * 1.05)
    m = np.abs(x).max()
    return x * (peak / m) if m else x


def fade(x, s=1.5):
    n = int(s * SR)
    x[:n] *= np.linspace(0, 1, n)
    x[-n:] *= np.linspace(1, 0, n)
    return x


def encode(x, name):
    pcm = (norm(x) * 32767).astype("<i2").tobytes()
    path = f"{OUT}/{name}.mp3"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "s16le", "-ar", str(SR),
                    "-ac", "1", "-i", "pipe:0", "-codec:a", "libmp3lame",
                    "-b:a", "72k", path], input=pcm, check=True)
    print(f"  {os.path.getsize(path)//1024:>4} KB  {name}.mp3  ({len(x)/SR:.0f}s)")


# ------------------------------------------------------- 01 midnight mass
def midnight_mass(dur=62):
    n = int(dur * SR)
    ti = t(n)
    out = np.zeros(n)
    for f, amp in ((55, .30), (82.4, .20), (110, .16), (164.8, .09), (220, .05)):
        for det in (-.14, 0, .17):
            out += amp * np.sin(2 * np.pi * (f + det) * ti + 2 * np.sin(2 * np.pi * .043 * ti))
    out *= .34 + .16 * np.sin(2 * np.pi * .028 * ti)
    for i, at in enumerate(np.arange(3, dur - 6, 7.5)):
        bn = int(5.2 * SR)
        bt = t(bn)
        base = 220 if i % 3 else 164.8
        bell = sum(a * np.sin(2 * np.pi * base * r * bt) * np.exp(-bt * dk)
                   for r, a, dk in ((1, .5, .9), (2.01, .28, 1.5), (2.98, .18, 2.2),
                                    (4.17, .10, 3.4), (5.43, .06, 4.6)))
        place(out, bell * .5, at)
    out += lp(rng.normal(0, 1, n), 900) * .012
    return fade(reverb(out * .5, 2.6, .42), 2.5)


# ------------------------------------------------------- 02 chrome teeth
def chrome_teeth(dur=54):
    n = int(dur * SR)
    out = np.zeros(n)
    bpm, beat = 138, 60 / 138
    for b in range(int(dur / beat)):
        at = b * beat
        if b % 4 in (0, 2) or b % 16 == 14:
            kn = int(.34 * SR)
            kt = t(kn)
            out_k = np.sin(2 * np.pi * (140 * np.exp(-kt * 26) + 44) * kt) * np.exp(-kt * 11)
            place(out, out_k * .85, at)
        if b % 8 == 4:
            sn = int(.30 * SR)
            st = t(sn)
            place(out, lp(rng.normal(0, 1, sn), 5200) * np.exp(-st * 15) * .42, at)
        for h in range(4):
            hn = int(.07 * SR)
            ht = t(hn)
            amp = .10 if h % 2 else .17
            place(out, lp(rng.normal(0, 1, hn), 9000) * np.exp(-ht * 90) * amp, at + h * beat / 4)
        if b % 8 == 6:
            mn = int(.9 * SR)
            mt = t(mn)
            metal = sum(np.sin(2 * np.pi * f * mt) for f in (431, 617, 823, 1187, 1601))
            place(out, metal * np.exp(-mt * 4.5) * .09, at)
    ti = t(n)
    seq = [41.2, 41.2, 49, 43.7, 41.2, 36.7, 49, 55]
    bass = np.zeros(n)
    for b in range(int(dur / (beat * 2))):
        f = seq[b % len(seq)]
        bn = int(beat * 1.9 * SR)
        bt = t(bn)
        sq = np.tanh(np.sin(2 * np.pi * f * bt) * 3.2) * env(bn, .006, .1, 0, .12, .55)
        place(bass, sq, b * beat * 2)
    out += lp(bass, 340) * .5
    out += lp(rng.normal(0, 1, n), 600) * .01
    out *= .55 + .45 * np.clip(np.sin(2 * np.pi * .017 * ti) * 2, -1, 1) * .3 + .3
    return fade(reverb(out * .55, 1.1, .22), 1.2)


# ------------------------------------------------------- 03 parking lot seance
def parking_lot(dur=58):
    n = int(dur * SR)
    out = np.zeros(n)
    scale = [220, 246.9, 261.6, 293.7, 311.1, 349.2, 415.3, 440]
    idx = [0, 2, 4, 6, 4, 2, 0, 3, 5, 7, 5, 3]
    step = 0.30
    for k in range(int(dur / step)):
        f = scale[idx[k % len(idx)]] * (0.5 if (k // 24) % 2 else 1)
        nn = int(0.9 * SR)
        nt = t(nn)
        v = np.tanh(np.sin(2 * np.pi * f * nt) + .35 * np.sin(2 * np.pi * f * 2 * nt))
        place(out, lp(v, 1500) * np.exp(-nt * 3.4) * .17, k * step)
    ti = t(n)
    pad = sum(np.sin(2 * np.pi * f * ti + .6 * np.sin(2 * np.pi * .07 * ti)) * a
              for f, a in ((110, .3), (164.8, .18), (207.7, .12)))
    out += lp(pad, 700) * (.22 + .1 * np.sin(2 * np.pi * .033 * ti))
    hiss = lp(rng.normal(0, 1, n), 6500) * .026
    crack = np.zeros(n)
    for at in rng.uniform(0, dur - .1, 320):
        cn = int(.006 * SR)
        crack_sig = rng.normal(0, 1, cn) * np.exp(-t(cn) * 700)
        place(crack, crack_sig * rng.uniform(.1, .5), at)
    return fade(reverb(out + hiss + crack * .5, 2.0, .34), 2.0)


# ------------------------------------------------------- 04 no signal no salvation
def no_signal(dur=50):
    n = int(dur * SR)
    ti = t(n)
    out = np.zeros(n)
    out += .16 * np.sin(2 * np.pi * 60 * ti) + .09 * np.sin(2 * np.pi * 120 * ti) \
        + .04 * np.sin(2 * np.pi * 180 * ti)
    out += .30 * np.sin(2 * np.pi * 36.7 * ti + 1.1 * np.sin(2 * np.pi * .019 * ti))
    out += .12 * np.sin(2 * np.pi * 73.4 * ti)
    stat = lp(rng.normal(0, 1, n), 7000) * .04
    gate = (np.sin(2 * np.pi * .09 * ti) > .55).astype(float)
    k = np.ones(int(.05 * SR)) / int(.05 * SR)
    out += stat * (0.3 + np.convolve(gate, k, mode="same"))
    for at in rng.uniform(1, dur - 2, 26):
        gn = int(rng.uniform(.03, .16) * SR)
        gt = t(gn)
        tone = np.sign(np.sin(2 * np.pi * rng.uniform(300, 2400) * gt))
        place(out, tone * np.exp(-gt * 9) * .10, at)
    for at in np.arange(4, dur - 4, 11):
        sn = int(2.4 * SR)
        st = t(sn)
        place(out, np.sin(2 * np.pi * (900 - 640 * st / 2.4) * st) * np.exp(-st * 1.4) * .07, at)
    return fade(reverb(out * .62, 1.9, .3), 1.8)


print("audio:")
encode(midnight_mass(), "01-midnight-mass")
encode(chrome_teeth(), "02-chrome-teeth")
encode(parking_lot(), "03-parking-lot-seance")
encode(no_signal(), "04-no-signal-no-salvation")
