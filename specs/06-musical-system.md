# Spec: Musical System

## 1. Overview

This spec details the musical theory and mapping logic that translates orbital mechanics into coherent generative music. The system ensures that no matter how chaotic the orbits become, the resulting audio remains harmonically pleasant and rhythmically interesting.

## 2. Design Principles

1. **Harmonic Coherence:** All triggered notes are quantized to a user-selected scale. No "wrong notes" can occur.
2. **Organic Rhythm:** Rhythms are derived from orbital periods, not grid-based sequencers. This produces natural syncopation and polyrhythms.
3. **Expressive Dynamics:** Timbre and volume respond to orbital velocity, so the same orbit sounds different at periapsis vs. apoapsis.
4. **Spatial Audio:** Stereo panning follows planet position, creating an immersive soundstage.

## 3. Pitch System

### 3.1 Scale Quantization Pipeline

```
Planet radial distance from sun
  → Normalize to [0, 1] within distance range
  → Reverse (close = high pitch, far = low pitch)
  → Map to scale index
  → Look up MIDI note number
  → Convert to frequency (Hz)
```

### 3.2 Distance Ranges

The distance range defines the musical range of the system:

| Distance | Pitch | Musical Effect |
|---|---|---|
| Close to sun (< 50px) | Highest notes (octave 6) | Fast-moving inner planets are bright and high |
| Far from sun (> 400px) | Lowest notes (octave 2) | Slow outer planets are deep bass tones |
| Mid-range (100–250px) | Mid-register (octaves 3–5) | Most musical activity lives here |

- `minDistance` and `maxDistance` are adjustable in the control panel (indirectly via the octave range control).
- The mapping is linear by default. An option for logarithmic mapping could be added (stretch goal).

### 3.3 Scale Definitions

Each mode is defined as an array of semitone intervals from the root:

```typescript
const SCALES: Record<ScaleMode, number[]> = {
  ionian:     [0, 2, 4, 5, 7, 9, 11],    // Major
  dorian:     [0, 2, 3, 5, 7, 9, 10],    // Minor + raised 6th
  phrygian:   [0, 1, 3, 5, 7, 8, 10],    // Minor + flat 2nd
  lydian:     [0, 2, 4, 6, 7, 9, 11],    // Major + sharp 4th
  mixolydian: [0, 2, 4, 5, 7, 9, 10],    // Major + flat 7th
  aeolian:    [0, 2, 3, 5, 7, 8, 10],    // Natural minor
  locrian:    [0, 1, 3, 5, 6, 8, 10],    // Diminished
};
```

### 3.4 Full Note Array Generation

Given a root note, mode, and octave range, the full set of available notes is:

```typescript
function generateNoteArray(root: string, mode: ScaleMode, octaveMin: number, octaveMax: number): number[] {
  const rootMidi = noteToMidi(root); // e.g., 'C' → 0
  const intervals = SCALES[mode];
  const notes: number[] = [];
  
  for (let octave = octaveMin; octave <= octaveMax; octave++) {
    for (const interval of intervals) {
      notes.push(rootMidi + interval + (octave * 12));
    }
  }
  
  return notes.sort((a, b) => a - b);
}
```

Example output for C Lydian, octaves 2–6:
```
[36, 38, 40, 42, 43, 45, 47,  // octave 2
 48, 50, 52, 54, 55, 57, 59,  // octave 3
 60, 62, 64, 66, 67, 69, 71,  // octave 4
 72, 74, 76, 78, 79, 81, 83,  // octave 5
 84, 86, 88, 90, 91, 93, 95]  // octave 6
```

### 3.5 Distance-to-Note Mapping

```typescript
function distanceToNote(normalizedDistance: number, notes: number[]): number {
  const index = Math.floor((1 - normalizedDistance) * (notes.length - 1));
  return notes[clamp(index, 0, notes.length - 1)];
}
```

The `1 - normalizedDistance` reversal ensures close = high pitch, far = low pitch.

### 3.6 Root Note Selection
Available roots: `C, C#, D, D#, E, F, F#, G, G#, A, A#, B`
- Dropdown in the control panel.
- Changing the root transposes all currently playing notes on the next trigger (no instant retuning of sustained notes).

## 4. Rhythm System

### 4.1 Source of Rhythm
Rhythm emerges naturally from orbital mechanics:
- Each planet's orbital period determines its base rhythmic cycle.
- Elliptical orbits produce **uneven** axis crossing intervals — fast near the sun, slow far away.
- This creates **natural swing and syncopation**.

### 4.2 Polyrhythms
- Multiple planets at different distances produce different orbital periods.
- Since these periods are generally not integer-related, the result is **evolving polyrhythms** that phase in and out of alignment.
- Example: A planet at distance 100px and another at 200px will have roughly a √2 ratio of periods (from Kepler's third law), producing a complex polyrhythm.

### 4.3 N-Body Rhythmic Variation
- With N-body enabled, gravitational perturbations cause orbits to **precess** (slowly rotate).
- This means the same planet's axis crossings gradually shift in time, creating **evolving patterns** that never exactly repeat.
- With N-body disabled, orbits are perfectly repeating → **looping rhythms**.

### 4.4 Trigger Lines and Rhythmic Density

| Trigger Lines | Crossings per orbit | Rhythmic density |
|---|---|---|
| 2 (X + Y, default) | 4 per orbit | Medium — each planet is a quarter-note pulse |
| 3 lines | 6 per orbit | Higher — triplet feel |
| 4 lines | 8 per orbit | Dense — sixteenth-note feel |
| 6 lines | 12 per orbit | Very dense — complex patterns |

- More trigger lines = more notes per orbit = more rhythmic activity.
- The user can tune density by adding/removing/rotating trigger lines.

### 4.5 Gravity as Tempo
- Higher gravity → faster orbits → more triggers per second → higher tempo.
- Lower gravity → slower orbits → fewer triggers → lower tempo.
- The relationship is non-linear (Kepler's third law: T ∝ r^(3/2) / √G).
- Typical range at default settings: ~30–180 triggers per minute across all planets.

## 5. Dynamics & Expression

### 5.1 Velocity-to-Volume
- Orbital velocity at the crossing point is mapped to note velocity (volume).
- Fast crossings (periapsis): louder, more accented.
- Slow crossings (apoapsis): quieter, gentler.
- Mapping: `volume = lerp(0.2, 1.0, normalizedVelocity)`

### 5.2 Velocity-to-Timbre
Different synth engines respond to velocity differently:

| Synth | Velocity Response |
|---|---|
| **Sine / Triangle** | Faster → shorter attack (more percussive pluck). Slower → longer attack (pad-like). |
| **Sawtooth / Square** | Faster → higher filter cutoff (brighter). Slower → lower cutoff (darker, muffled). Filter range: 200Hz–8000Hz. |
| **FM Synthesis** | Faster → higher modulation index (more metallic harmonics). Slower → lower index (purer tone). Range: 1–20. |
| **Pluck / Marimba** | Faster → longer decay. Slower → shorter, more damped. |

### 5.3 Spatial Panning
- Planet angle relative to sun at crossing → stereo pan.
- `pan = cos(angle)` mapped to `[-1, 1]`.
- Planets on the left side of the canvas pan left, right side pan right.
- Creates a spatial mix where each planet occupies a distinct stereo position.

## 6. Musical Defaults

The default settings are chosen to sound good immediately with no configuration:

| Setting | Default | Rationale |
|---|---|---|
| Root | C | Most neutral starting point |
| Mode | Lydian | Dreamy, ethereal; avoids minor second (clash); the #4 creates a "floating" quality |
| Octave range | 3–5 | Mid-register; avoids sub-bass rumble and piercing highs |
| Default synth | FM | Most versatile; velocity-responsive; interesting at all speeds |
| Reverb | 30% wet | Adds space without mud |
| Delay | 20% wet | Creates echo patterns that fill gaps between triggers |
| Gravity | 1.0 | Moderate tempo with typical planet distances |

## 7. Edge Cases

### 7.1 Very Fast Planets
- Fast planets trigger very frequently, potentially overwhelming the audio.
- **Guard:** Minimum 100ms between triggers from the same planet on the same line.
- Very fast crossings get progressively quieter (volume caps at a threshold).

### 7.2 Escaped Planets
- Planets that drift far from the sun trigger rarely and at very low pitches.
- The auto-removal system (see physics spec) handles this.

### 7.3 No Planets
- When no planets exist, the audio is silent. The reverb tail may fade out.
- The sun does not produce audio.

### 7.4 Scale Change During Playback
- Changing the scale or root note takes effect on the **next** trigger event.
- Currently sustained notes are not interrupted (they ring out naturally).

### 7.5 Simultaneous Triggers
- Multiple planets crossing lines at the same time produce chords.
- The limiter in the effects chain prevents clipping.
- If CPU is struggling, the lowest-velocity simultaneous trigger is dropped first.

## 8. Musical Glossary (for Developers)

| Term | Meaning in This App |
|---|---|
| **Trigger** | A planet crossing a trigger line, causing a note to play |
| **Trigger line** | An invisible line through the sun; crossings produce notes |
| **Quantization** | Mapping a raw distance value to the nearest in-scale note |
| **Voice** | A synth + gain + pan chain belonging to one planet |
| **Periapsis** | Closest point to sun in an orbit (fastest, highest pitch, loudest) |
| **Apoapsis** | Farthest point from sun in an orbit (slowest, lowest pitch, quietest) |
| **Precession** | Gradual rotation of an elliptical orbit, caused by N-body perturbations |
| **Polyrhythm** | Multiple overlapping rhythmic patterns at different speeds |
