# ⚡ CYBER SHIFT: APEX VANGUARD

> An original, high-octane 3D transforming robot action game built entirely with HTML, CSS, JavaScript (ES Modules), WebGL (Three.js), and the Web Audio API. Runs 100% client-side with zero backend dependencies and deploys directly to **GitLab Pages**.

---

## 🎮 Overview & Lore

In the year 2099, the **Null Syndicate** has initiated a hostile takeover of **Sector 09 (Neo-Kyoto)**. As the commander of the **Aegis Defense Initiative**, you deploy an advanced shapeshifting combat chassis capable of real-time transformation between a high-speed aerodynamic interceptor supercar and an armored combat robot frame.

### Vanguard Hero Frames
1. **Aegis Stryker (Apex Interceptor Frame / A-01)**
   - *Aesthetic*: Crimson Red, Titanium Steel, Gold Trim, Cyan Energy Core.
   - *Specialty*: Heavy armor reinforcement, twin heavy plasma cannons, high kinetic collision ram damage.
2. **Volt Phantom (Hyper-Recon Frame / V-02)**
   - *Aesthetic*: Electric Cyan, Deep Obsidian, Neon Violet Accents, Gold Visor.
   - *Specialty*: High aerodynamic top speed (170+ km/h), agile drift handling, rapid-fire pulse blasters.

### Null Syndicate Hostiles
1. **Scrap-Viper**: Fast quadruped/skimmer scout drone equipped with dual high-frequency blades. Flanks and charges in swarms.
2. **Null Sentinel**: Heavy bipedal artillery walker. Maintains distance, strafes laterally, and fires charged plasma railgun bursts.
3. **Titan Dreadnought**: Massive siege colossus boss. Fires homing micro-missile salvos and unleashes kinetic ground stomp shockwaves.

---

## 🕹️ Controls Guide

| Action | Keyboard / Mouse | Mobile / Touch |
| :--- | :--- | :--- |
| **Move / Steer** | <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or Arrow Keys | Virtual D-Pad (▲ ◀ ▼ ▶) |
| **Transform** | <kbd>T</kbd> | `MORPH` Button |
| **Melee Energy Blade** | <kbd>Left Click</kbd> or <kbd>J</kbd> | `BLADE` Button |
| **Ranged Plasma Blasters** | <kbd>Right Click</kbd> or <kbd>K</kbd> | `FIRE` Button |
| **Nitro Boost (Vehicle) / Thruster Dash (Robot)** | <kbd>Shift</kbd> | `BOOST` Button |
| **Handbrake Drift (Vehicle) / Jump (Robot)** | <kbd>Space</kbd> | Action Button |
| **EMP Shockwave Slam** | <kbd>E</kbd> | `E` HUD Button |
| **Switch Hero Frame** | <kbd>C</kbd> | Garage Cards / Bottom Bar |
| **Pause / Resume** | <kbd>Escape</kbd> or <kbd>P</kbd> | `Ⅱ PAUSE` Button |

---

## 🌟 Core Gameplay Systems

### 1. Mechanical Transformation System
- Press <kbd>T</kbd> anytime to shift forms instantly in real-time.
- Fully articulated 3D morphing: limbs fold into aerodynamic wheel-guards, the head retracts into a reinforced cowl, suspension wheels extend and align to the road, aerodynamic body shells slide into place, and an energy shockwave ring expands along the asphalt.
- **Vehicle Mode Perks**:
  - Top speeds exceeding 160–240 km/h with nitro boost.
  - Realistic arcade steering and drift mechanics (<kbd>Space</kbd> or aggressive cornering).
  - Kinetic ramming attack: ram into enemy robots at high velocity to deal massive kinetic impact damage and knock them flying!
- **Robot Mode Perks**:
  - Full omnidirectional combat mobility.
  - 3-hit melee sword combo with rising uppercuts and overhead ground cleaves.
  - Directional thruster dash with invulnerability frames (i-frames).
  - Jump thrusters for vertical leaping.

### 2. Combat & Wave Survival
- **3-Hit Combo Chain**: Combos track consecutive strikes with rank grades and critical finishers.
- **Twin Plasma Blasters**: Arm-mounted projectile cannons with muzzle flares and impact sparks.
- **EMP Shockwave Slam**: Clear surrounding swarms with a 22-meter electrical burst.
- **Destructible Enemy Death**: Hostiles shatter into physical debris pieces with fiery multi-stage explosions and smoking scrap.
- **Interactive Pickups**:
  - 🟢 **Nanite Repair Core**: Restores +32 HP.
  - 🔵 **Overcharge Matrix**: Refills boost energy and activates 10 seconds of rapid overcharged firing!

### 3. Explorable Cyberpunk Metropolis
- 560×560 meter explorable grid with multi-lane highways, road markings, and crosswalks.
- Sloped jump ramps to launch the vehicle into the air.
- 48+ procedural illuminated skyscrapers with lit windows, rooftop communication spires, and flashing red aviation beacons.
- Giant glowing holographic billboards and boundary security forcefields.

### 4. Zero-Dependency Procedural Web Audio API
- Generates all sound effects directly in code:
  - Hydraulic servo transformation whirrs and magnetic latch locks.
  - Plasma laser blasts and blade slashes.
  - Dynamic vehicle engine pitch synthesizer scaled to vehicle speed and RPM.
  - Sub-bass explosion booms and resonant armor clangs.
  - Built-in procedural 16-step synthwave battle soundtrack!

---

## 📁 Project Architecture

```
kids_games/
├── index.html            # Kids games menu (links to every game)
├── cyber-shift.html      # Cyber Shift game entry point & HUD layout
├── styles.css            # Cyberpunk sci-fi UI styling & responsiveness
├── .gitlab-ci.yml        # GitLab Pages automated deployment pipeline
├── README.md             # Project documentation & deployment manual
├── assets/
│   ├── three.min.js      # Three.js 3D WebGL graphics engine
│   └── THREE-LICENSE.txt # MIT Open-Source License
├── src/
│   ├── main.js           # Core game coordinator & animation loop
│   ├── renderer.js       # WebGL rendering, soft shadows, sky dome & quality toggles
│   ├── camera.js         # 3rd-person chase camera, dynamic FOV & trauma screen shake
│   ├── world.js          # City grid generator, skyscrapers, ramps, pickups & collision
│   ├── player.js         # Transforming robot articulated model & physics states
│   ├── controller.js     # Keyboard, mouse, touch input & driving physics
│   ├── combat.js         # Melee combos, blasters, EMP shockwave & ramming physics
│   ├── enemies.js        # AI state machines for Viper, Sentinel, and Titan boss
│   ├── particles.js      # Explosions, hit sparks, boost flames & shockwave rings
│   ├── audio.js          # Procedural Web Audio synthesizer & synthwave BGM
│   └── ui.js             # HUD manager, radar canvas, reticle, and garage selector
```

---

## 🚀 GitLab Pages Deployment Guide

Deploying this game to GitLab Pages is 100% automated using the included `.gitlab-ci.yml`.

### Step-by-Step Instructions:

1. **Push to GitLab**:
   ```bash
   git add .
   git commit -m "Deploy Cyber Shift: Apex Vanguard to GitLab Pages"
   git push origin main
   ```

2. **GitLab CI/CD Automated Build**:
   - GitLab will automatically trigger the `pages` pipeline defined in `.gitlab-ci.yml`.
   - The job packages `index.html`, `cyber-shift.html`, `styles.css`, `src/`, and `assets/` into the `public/` directory artifact.

3. **Access Your Live Game**:
   - Navigate to your GitLab repository: **Settings** > **Pages**.
   - Your game will be live at:
     ```
     https://<username>.gitlab.io/<repository-name>/
     ```

---

## 💻 Local Development & Testing

Because the game uses standard modern ES Modules (`type="module"`), run a lightweight local static web server to avoid browser `file://` CORS restrictions:

### Option 1: Python (Built-in)
```bash
python -m http.server 8000
```
Open [http://localhost:8000](http://localhost:8000) in your browser.

### Option 2: Node.js / npx
```bash
npx serve .
```

---

## 🛡️ License & Originality Notice

This game is an original creation. All character designs, vehicle models, visual systems, procedural audio synthesizers, lore, and gameplay mechanics were designed from scratch. No copyrighted names, trademarks, or assets from third-party transforming robot franchises are used.

- Three.js is distributed under the MIT License (`assets/THREE-LICENSE.txt`).
- Game code & assets: Open-Source.
