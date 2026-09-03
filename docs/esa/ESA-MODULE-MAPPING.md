# ESA Module Mapping

## Architecture Rule

ESA UI = self-contained modules for Extended Stay America property operations.
Ingestion (barcode, image, Agent X, IngeniosityLens, PianoWaver) = separate Ava007 console layer.

---

## Current ESA Modules

| Module | Component | Nav Tab | Status |
|--------|-----------|---------|--------|
| Inventory Dashboard | `InventoryCard`, `InventoryPulseOrb`, `StatPill` | Dashboard | ACTIVE |
| Part Card | `InventoryPartCard`, `StepperWheel` | Part Card | ACTIVE |
| ESA Maintenance | `ESAMaintenanceCard`, `ESAJobTracker`, `ESARequestForm` | ESA Maint. | ACTIVE |
| Maint. Complete | `MaintenanceRequestComplete` | Maint. Complete | ACTIVE |
| Exoskeleton | `ESAWebUI` | Exoskeleton | ACTIVE |
| Green Shield Operations | `ESAWebUI` sidebar/SOP data | Exoskeleton | ACTIVE |
| Console | `GrokConsole` | Console | ACTIVE |

---

## Reference -> ESA Module Mapping

### 1. Blurred Side Navigation Bar
**Source:** `blurred-side-navigation-bar.zip`
**Techniques:** Glassmorphism sidebar, collapsible labels, profile section, CTA button
**ESA Target:** Replace current tab bar with collapsible glassmorphism sidebar
- "Menus" group -> Dashboard, Part Card, ESA Maint., Maint. Complete
- "Service" group -> HVAC, Plumbing, Electrical, Grounds, Rooms
- Profile -> logged-in tech name + property
- CTA -> "New Work Order"
- Collapse to icon-only on mobile (200px -> 60px)

### 2. 3D Data Cards Menu (GSAP)
**Source:** `3d-data-cards-menu-gsap.zip`
**Techniques:** GSAP ScrollTrigger, 3D card tilt, pill platforms with dark tiles, hover lift
**ESA Target:** Property Overview Cards (hero section)
- Each pill = property category (HVAC, Plumbing, Electrical, Grounds, Rooms)
- Dark tiles inside pills = sub-categories or SOP codes
- Featured cards = priority work orders or property KPIs
- GSAP entrance animations for card grid

### 3. Color Gradient Feature Table
**Source:** `color-gradient-feature-table.zip`
**Techniques:** Gradient borders, inverted-radius corner, sparkle particles, live CSS var theming
**ESA Target:** Maintenance Plan Comparison (Standard vs. Premium)
- Feature rows = maintenance capabilities (24/7 emergency, HVAC, plumbing, pest control)
- Gradient border highlights premium tier
- Live theming per property brand colors
- Inverted-radius corner where thead meets tbody

### 4. Fancy Borders w/ Transparency
**Source:** `fancy-borders-w-transparency.zip`
**Techniques:** mask-image gradient borders, conic-gradient, backdrop-filter blur, adjustable radius
**ESA Target:** Property / Room detail cards
- Glassmorphism cards for room status
- Conic gradient borders with ESA gold/green palette
- Overlaid status panels on floor plans
- Configurable border radius per card type

### 5. Animated 3D Weather Widget
**Source:** `animated-3d-weather-widget.zip`
**Techniques:** Three.js 3D interactive element, staggered fadeInUp, shimmer, floating animation
**ESA Target:** Property Weather Impact Dashboard
- Weather panel showing conditions affecting maintenance priorities
- 3D property model or equipment visualization (Three.js)
- 7-day maintenance forecast strip
- Staggered card entrance animations

### 6. Social Feed Poll with Animation
**Source:** `social-feed-poll-with-animation.zip`
**Techniques:** Animated fill bars, CSS custom --percent var, sparkle winner glow, rAF counter
**ESA Target:** Maintenance Satisfaction Survey / Guest Feedback
- Guest/tenant feedback poll
- Animated fill bars for response distribution
- Crew performance voting

### 7. CSS Shimmer Button
**Source:** `css-shimmer-button-js-for-text.zip`
**Techniques:** @property Houdini, 5 shimmer effects, progressive activation, spring-easing hover
**ESA Target:** All ESA action buttons
- Progressive activation on form validation
- 5 states: pulse/pending, spin/processing, wipe/success, flicker/error, default/ready
- Spring-easing hover on all interactive elements

### 8. Interactive Music Player with Audio Equalizer
**Source:** `interactive-music-player-with-visual-audio-equalizer.zip`
**Techniques:** Web Audio API FFT, bar-chart visualizer, collapsible playlist
**ESA Target:** Property Health Status Visualizer
- Equalizer bars = maintenance categories (HVAC, plumbing, electrical)
- Real-time data-driven bar heights
- Collapsible task queue panel
- Transport controls = task navigation

---

## Cross-Cutting Techniques

| Technique | Sources | ESA Application |
|-----------|---------|-----------------|
| Glassmorphism (backdrop-filter: blur) | 4, 5, 6 | Sidebar, overlay cards, status panels |
| CSS custom properties for theming | 3, 4 | Per-property brand colors |
| mask-image gradient borders | 1, 3, 4 | Premium card borders |
| Staggered fadeInUp animations | 5 | Dashboard card loading |
| background-size fill bars | 1, 2 | Task completion progress |
| mix-blend-mode glow | 2, 7 | Active state highlights |
| Spring-easing linear() | 2, 7 | Hover/click interactions |
| @property Houdini | 7 | CSS-only status animations |
| Collapsible sidebar | 6 | Responsive navigation |
| rAF data-driven visuals | 1, 2 | Real-time visualizations |

---

## Removed from ESA

These components are ingestion-layer, NOT ESA modules:

| Component | Belongs To |
|-----------|-----------|
| `ESAInputInterface` | Ava007 main console (ingestion) |
| `CameraLens` | Ava007 main console (ingestion) |
| `IngeniosityLens` | Ava007 exoskeleton (ingestion) |
| `PianoWaver` / `PianoWaverPanel` | Ava007 audio system |
| `Ingeniosity007AudioSystem` | Ava007 audio system |

Committed as `207b69c`.
