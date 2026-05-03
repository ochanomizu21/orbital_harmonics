# Spec: Audio Engine

## 1. Overview

The audio engine translates simulation state into generative music using **Tone.js**. It is event-driven: the trigger system detects axis crossings and emits events, which the audio engine converts into scheduled synth notes with pitch, timbre, and dynamics derived from the planet's physical state at the moment of crossing.

## 2. Core Types

```typescript
type SynthType = 'sine' | 'triangle' | 'sawtooth' | 'square' | 'fm' | 'marimba' | 'bell' | 'pluck';

type ScaleMode = 
  | 'ionian' | 'dorian' | 'phrygian' | 'lydian' 
  | 'mixolydian' | 'aeolian' | 'locrian';

interface ScaleConfig {
  root: string;        // e.g. 'C', 'A', 'F#'
  mode: ScaleMode;
  octaveRange: [number, number]; // e.g. [2, 6]
}

interface PlanetVoice {
  planetId: string;
  synth: Tone.ToneAudioNode;
  gainNode: Tone.Gain;
  panNode: Tone.Panner;
  synthType: SynthType;
  muted: boolean;
  soloed: boolean;
}

interface TriggerEvent {
  planetId: string;
  axis: 'x' | 'y';
  crossingDirection: 1 | -1;  // positive or negative crossing
  distance: number;           // radial distance from sun at crossing
  velocity: number;           // speed at crossing
  angle: number;              // angle from sun at crossing
}
```

## 3. Audio Architecture

### 3.1 Signal Chain
```
Planet Synth Voice → Per-Planet Gain → Per-Planet Pan → Effects Bus → Master Gain → DAC
```

### 3.2 Master Output
- Single `Tone.Gain` node as master volume control.
- Connected to `Tone.Destination`.
- Volume controlled by a global master slider.

### 3.3 Effects Bus
Two global effects in series before the master output:

1. **Reverb** (`Tone.Reverb`)
   - Decay: 2.5s default
   - Wet/dry: 30% default, user-adjustable
   - Pre-decay: 0.01s

2. **Stereo Delay** (`Tone.FeedbackDelay`)
   - Delay time: synced to a musically useful duration (e.g., dotted eighth at current tempo)
   - Feedback: 0.3 default
   - Wet/dry: 20% default, user-adjustable

Signal routing:
```
Per-Planet Output → Reverb → Delay → Master Gain → Destination
```

A **limiter** (`Tone.Limiter`, -1dB) sits before Destination to prevent clipping when many planets trigger simultaneously.

## 4. Synthesizer Engines

Each planet is assigned one synth engine. The user selects the engine per-planet from the planet editor.

### 4.1 Pure Waveforms (`Tone.Synth`)
- **Sine**: Clean fundamental, `oscillator.type = 'sine'`
- **Triangle**: Softer harmonics, `oscillator.type = 'triangle'`

Envelope: Attack 0.01s, Decay 0.3s, Sustain 0.2, Release 0.5s.

### 4.2 Harsh Waveforms (`Tone.Synth`)
- **Sawtooth**: Rich harmonics, `oscillator.type = 'sawtooth'`
- **Square**: Hollow, buzzy, `oscillator.type = 'square'`

Envelope: Attack 0.005s, Decay 0.2s, Sustain 0.1, Release 0.3s.
These run through a **low-pass filter** (`Tone.Filter`) with cutoff modulated by planet velocity.

### 4.3 FM Synthesis (`Tone.FMSynth`)
- Harmonicity ratio: 1 (configurable in planet editor)
- Modulation index: 10 (velocity-modulated)
- Envelope: Attack 0.01s, Decay 0.5s, Sustain 0.3, Release 0.8s
- Produces metallic, bell-like, complex timbres.

### 4.4 Physical Models

#### Marimba (`Tone.PluckSynth` or custom)
- Short decay, woody attack.
- Use `Tone.PluckSynth` with adjusted resonance and dampening.

#### Bell (custom FM config)
- Long decay, bright attack.
- `Tone.FMSynth` with high harmonicity ratio (3.5) and high modulation index.

#### Pluck (`Tone.PluckSynth`)
- Configurable attack noise and resonance.

## 5. Trigger System

### 5.1 Axis Crossing Detection
The simulation space is divided by configurable trigger lines. The default is a horizontal and vertical line through the sun (X and Y axes).

**Detection algorithm** (per planet, per frame):
```
For each trigger line:
  Let prevDist = signed distance of prevPosition from line
  Let currDist = signed distance of currentPosition from line
  If prevDist and currDist have opposite signs:
    A crossing has occurred.
    Compute crossing position via linear interpolation.
    Emit TriggerEvent with current distance, velocity, angle.
```

### 5.2 Configurable Trigger Lines
- Default: 2 lines (X and Y axes through sun) → 4 trigger points per orbit.
- User can add up to 6 trigger lines (radial lines at arbitrary angles through the sun).
- User can rotate trigger lines by dragging their endpoints.
- Each additional line increases rhythmic density and polyrhythmic complexity.
- Trigger lines are visually rendered as subtle glowing lines through the sun.

### 5.3 Debounce
- A planet cannot trigger on the same line twice in succession within 100ms.
- This prevents double-triggers from very slow crossings or numerical jitter near the line.

## 6. Pitch Mapping

### 6.1 Distance → Pitch
When a trigger event fires:
1. Compute the planet's radial distance from the sun.
2. Map this distance to a pitch using the current scale.

**Mapping logic:**
- Define a distance range: `minDistance = 50px`, `maxDistance = 400px` (user-adjustable via zoom or config).
- Normalize the distance to `[0, 1]` within this range.
- Reverse the mapping: close = high pitch, far = low pitch.
- Map the normalized value to an index in the current scale's note array across the configured octave range.
- The result is a MIDI note number, converted to frequency via `Tone.Frequency`.

### 6.2 Scale Quantization
- Scales are defined as intervals from the root note (in semitones).
- Example (Dorian): `[0, 2, 3, 5, 7, 9, 10]`
- Full note array is generated by stacking the scale pattern across `octaveRange`.
- The normalized distance maps to an index into this full array.
- This guarantees every triggered note is in-scale, regardless of orbit shape.

### 6.3 Supported Scales (Standard Modes)

| Mode | Intervals | Character |
|---|---|---|
| Ionian (Major) | 0-2-4-5-7-9-11 | Bright, happy |
| Dorian | 0-2-3-5-7-9-10 | Minor with raised 6th, jazzy |
| Phrygian | 0-1-3-5-7-8-10 | Dark, Spanish, exotic |
| Lydian | 0-2-4-6-7-9-11 | Dreamy, floating |
| Mixolydian | 0-2-4-5-7-9-10 | Bluesy major |
| Aeolian (Minor) | 0-2-3-5-7-8-10 | Sad, natural minor |
| Locrian | 0-1-3-5-6-8-10 | Unstable, dissonant |

- Root note is selectable (C through B, including sharps/flats).
- Default: **C Lydian** (dreamy, avoids minor second, works well with generative audio).

## 7. Velocity → Timbre Modulation

A planet's speed at the moment of triggering modulates synth parameters:

| Synth Type | Velocity Mapping |
|---|---|
| Sine / Triangle | Velocity → envelope attack (faster = shorter attack, more percussive) |
| Sawtooth / Square | Velocity → low-pass filter cutoff (faster = brighter) |
| FM | Velocity → modulation index (faster = more metallic/harmonic) |
| Pluck / Bell | Velocity → decay length (faster = longer sustain) |

**Velocity range:** Normalized to `[0, 1]` based on a configurable min/max speed range.

## 8. Velocity → Volume (Dynamics)

- Faster crossings are louder. Volume scales linearly with normalized velocity.
- Per-planet gain is also user-adjustable in the planet editor.

## 9. Per-Planet Panning

- The angle of the planet relative to the sun at the crossing point is mapped to stereo pan.
- Left side of canvas → pan left. Right side → pan right.
- Uses `Tone.Panner` (linear panning law).

## 10. Voice Lifecycle

### 10.1 Voice Creation
When a planet is spawned:
1. Create a synth instance of the default type (`fm`).
2. Connect: Synth → Gain → Pan → Effects Bus.
3. Store in `PlanetVoice` map keyed by `planetId`.

### 10.2 Voice Updates
When the user changes a planet's synth type in the editor:
1. Dispose the old synth.
2. Create a new synth of the selected type.
3. Reconnect to the existing gain/pan nodes.

### 10.3 Voice Disposal
When a planet is deleted or escapes:
1. Trigger a quick release on the synth (if sustaining).
2. Dispose all audio nodes.
3. Remove from voice map.

### 10.4 Mute / Solo
- **Mute:** Set per-planet gain to 0 (do not dispose the synth — it may be unmuted).
- **Solo:** When any planet is soloed, only soloed planets produce sound. Non-soloed planets' gains are set to 0.
- Mute/solo state is managed in the central state store and reflected in the sidebar.

## 11. Audio Initialization

- Web Audio requires a user gesture to initialize. The app shows a **"Click to Start"** overlay on first load.
- On click: `Tone.start()` is called, initializing the audio context.
- The overlay fades out and the simulation begins.
- This is the only modal/overlay in the entire app.

## 12. CPU Budget

- Synth voices are pre-allocated and reused (no per-trigger allocation).
- Maximum recommended planets for stable audio: ~20. Beyond this, voice count may strain lower-end machines.
- The app monitors audio context `currentTime` vs. scheduled time and can skip trigger events if falling behind (graceful degradation).
