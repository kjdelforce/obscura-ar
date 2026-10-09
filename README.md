# OBSCURA // THE BLEED

**Target Deliverable:** Web-based Augmented Reality Survival Horror Game (Progressive Web App)  
**Primary Platform:** Mobile Web (Safari iOS 17+, Chrome for Android) with Desktop Simulator fallback  
**Core Technologies:** Next.js 15 (App Router), React 19, TypeScript, Three.js / React Three Fiber, WebRTC MediaStream API, DeviceOrientation Sensor API, Web Audio API, Tailwind CSS, Custom GLSL Shaders.

---

## 1. System Architecture & Core Loop

The player’s physical environment serves as the play space. The phone's camera feeds live video to the background, while the browser's 3D engine overlays a parallel dimension anchored to the physical world via device gyroscope sensors.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          HARDWARE SENSOR LAYER                         │
│  - getUserMedia (Rear Camera 1080p@60fps)                              │
│  - MediaStreamTrack (applyConstraints: torch toggle)                  │
│  - DeviceOrientation / DeviceMotion (Alpha, Beta, Gamma -> Quaternion) │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │                                 │
                   ▼                                 ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│          WEBGL RENDER PIPELINE       │  │      SPATIAL AUDIO ENGINE    │
│  - PerspectiveCamera (Sensor Sync)   │  │  - Web Audio AudioContext    │
│  - Entity Meshes & Shaders           │  │  - Binaural PannerNode (3D)  │
│  - GLSL Shaders: SigilUV, Glitch,    │  │  - Procedural EMF Noise Gen  │
│    Spectral Entity, VHS Vignette     │  │  - Synthesized Jumpscares    │
└──────────────────┬───────────────────┘  └──────────────┬───────────────┘
                   │                                     │
                   └──────────────────┬──────────────────┘
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        CENTRAL GAME STATE MACHINE                      │
│  - Entity Distance & Frustum Dot-Product Tracking                      │
│  - Torch State (ON / OFF) & Battery Depletion Curve                    │
│  - Sanity / Interference Meter                                         │
│  - Sigil Exorcism & Clue Decryption Engine                             │
└────────────────────────────────────────────────────────────────────────┘
```

### Primary Game Loop
1. **Explore:** Move through real space in darkness. Use directional 3D audio and static feedback on the phone's EMF gauge to locate hidden sigils.
2. **Illuminate vs. Conceal:**
   - **Torch ON:** Illuminates physical rooms, repels Photophobes, freezes The Watcher, but drains battery and alerts Sound Demons.
   - **Torch OFF:** Reveals glowing spectral sigils (UV shader) and avoids audio detection, but lets entities close distance unhindered.
3. **Decipher:** Aim the camera directly at a spectral sigil, hold the line of sight for 4 seconds without moving while listening for encroaching entities.
4. **Survive:** Catch entities in peripheral vision before they breach the 1.1-meter lethal perimeter.

---

## 2. Directory Hierarchy

```
obscura-game/
├── public/
│   ├── manifest.json
│   └── assets/
│       ├── models/
│       └── audio/
│           └── jumpscare_stinger.mp3
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── ARScene.tsx
│   │   │   ├── CameraFeed.tsx
│   │   │   ├── EntityRenderer.tsx
│   │   │   ├── OrientationController.tsx
│   │   │   └── SigilRenderer.tsx
│   │   ├── hud/
│   │   │   ├── BatteryIndicator.tsx
│   │   │   ├── CompassRadar.tsx
│   │   │   ├── EMFMeter.tsx
│   │   │   ├── GlitchOverlay.tsx
│   │   │   └── PermissionModal.tsx
│   │   └── GameContainer.tsx
│   ├── hooks/
│   │   ├── useCameraTorch.ts
│   │   ├── useDeviceOrientation.ts
│   │   ├── useGameLoop.ts
│   │   └── useSpatialAudio.ts
│   ├── lib/
│   │   ├── audio/
│   │   │   └── SoundManager.ts
│   │   ├── math/
│   │   │   └── sensorToQuaternion.ts
│   │   └── state/
│   │       └── gameState.ts
│   └── shaders/
│       ├── materials/
│       │   ├── SigilUVMaterial.ts
│       │   └── SpectralEntityMaterial.ts
│       └── postprocessing/
│           ├── ChromaticGlitch.ts
│           └── VHSVignette.ts
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
└── postcss.config.mjs
```

---

## 3. Installation & Running

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Development Server with HTTPS
Mobile browsers (Safari iOS and Chrome Android) block `getUserMedia` and `DeviceOrientationEvent` unless served over HTTPS.
```bash
npm run dev
```
*(Runs `next dev --experimental-https`)*

### Step 3: Access from Mobile Device
- Connect phone to the same local Wi-Fi network.
- Access `https://<YOUR_LOCAL_IP>:3000`.
- Accept the self-signed certificate in mobile Safari or Chrome.
- Tap **"INITIALIZE FEED"** and grant Camera and Motion sensor permissions.
- In Safari, tap Share -> "Add to Home Screen" to install as a full-screen PWA.

---

## 4. Standalone Playable WebApp
For immediate browser preview without installing Node dependencies, an all-in-one standalone HTML deliverable is also provided:
- File: `artifacts/file_generation/ttl=63d/output/obscura_ar_game.html`
- Contains self-contained Three.js rendering, Web Audio synthesis, camera stream handling, simulated desktop fallback, and tactical HUD.
