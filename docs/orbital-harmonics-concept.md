# Concept Document: Orbital Harmonics

## 1. Executive Summary
**Orbital Harmonics** is an interactive web application that bridges mathematical simulation and procedural audio. By mapping an N-body gravitational physics engine to a generative synthesizer, the application allows users to compose hypnotic, evolving polyrhythms simply by orchestrating planetary orbits. 

## 2. The Core Philosophy
The brain naturally recognizes mathematical patterns. Gravity inherently creates elliptical, repeating motions that shift (precess) slowly over time. Translating these orbital mechanics into sound results in audio that feels organic and breathing—like a cosmic clock. Orbital Harmonics turns chaotic math into generative music.

## 3. System Architecture

### 3.1 The Physics Engine (The Conductor)
The foundation of the app is a robust 2D physics simulation based on Newton's law of universal gravitation: `F = G(m1*m2)/r^2`.

* **The Anchor (Sun):** A central, massive body resides at the canvas center, providing the primary gravitational pull.
* **The Satellites (Planets):** Users spawn planetary bodies with specific masses and initial velocity vectors.
* **N-Body Dynamics:** Planets interact not just with the Sun, but with each other. This creates "slingshot" effects and complex orbital perturbations, translating to rhythmic variations.
* **Collision Rules:** To maintain continuous audio generation, physical collisions are disabled (planets ghost through each other), preserving complex orbital dances without destruction.

### 3.2 The Audio Engine (The Synthesizer)
Continuous physical data is translated into discrete musical events using an engine like Tone.js or the native Web Audio API.

* **The Trigger (Rhythm):** The simulation space is divided by invisible X and Y axes intersecting the Sun. Whenever a planet crosses an axis, an envelope is triggered (a note plays). Because orbits are elliptical, axis crossings happen at varying intervals, creating syncopated, phasing polyrhythms.
* **Pitch Mapping (Melody):** Pitch is determined by the planet's radial distance from the Sun at the exact moment of an axis crossing. 
    * *Close* = Higher pitch.
    * *Far* = Lower pitch.
    * *Quantization:* Distances are mathematically quantized to a selected musical scale (e.g., Dorian, Lydian, or Pentatonic) to ensure harmonic coherence.
* **Timbre & Modulation (Texture):** A planet's velocity directly modulates the synthesizer parameters. A planet at periapsis (moving fastest) might open a low-pass filter for a bright, aggressive tone, while a slow-moving planet at apoapsis creates a soft, muffled sound.

### 3.3 The User Interface (The Canvas)
The UI is designed to be minimal, dark, and highly tactile, focusing the user's attention entirely on the math and the music.

* **Visual Aesthetics:** Deep space aesthetic with glowing, fading orbital trails.
* **Interaction Design:** * Click and drag to spawn a planet. 
    * The initial click sets the coordinate.
    * Dragging extends a "rubber band" vector, setting trajectory and initial speed upon release.
* **Visual Feedback:** Axis crossings trigger a visual ripple or flash corresponding to the audio event.
* **Control Panel:**
    * *Gravity Strength:* Acts as the global tempo control.
    * *Scale Selector:* Changes the harmonic landscape (root note and mode).
    * *N-Body Toggle:* Enables or disables planet-to-planet gravity for either predictable looping or generative chaos.
    * *Synthesizer Engine Selection:* Swap between acoustic physical modeling (marimbas/bells) and synthetic generation (FM bass/sine waves).

## 4. Technical Stack Recommendations
* **Frontend Framework:** React or Vue.js for state management and UI overlays.
* **Rendering:** HTML5 `<canvas>` or WebGL (via PixiJS/Three.js) to handle dozens of glowing trails and particles efficiently at 60fps.
* **Audio:** Tone.js for simplified scheduling, scale quantization, and robust synthesizer nodes built on top of the Web Audio API.
* **Physics:** A custom lightweight verlet integration loop optimized for N-body gravity, or a modified version of Matter.js.

## 5. Future Expansion Paths
* **Multiplayer Orbits:** A shared canvas where multiple users can drop planets into the same solar system.
* **MIDI Out:** Outputting the generated triggers via WebMIDI to control external hardware synthesizers or DAWs like Ableton Live.
* **Recording:** The ability to render a 5-minute loop of the generative audio to a downloadable `.wav` file.
