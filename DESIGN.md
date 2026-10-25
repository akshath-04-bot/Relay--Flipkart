---
name: Obsidian Kinetic
colors:
  surface: '#10131a'
  surface-dim: '#10131a'
  surface-bright: '#363940'
  surface-container-lowest: '#0b0e14'
  surface-container-low: '#191c22'
  surface-container: '#1d2026'
  surface-container-high: '#272a31'
  surface-container-highest: '#32353c'
  on-surface: '#e1e2eb'
  on-surface-variant: '#c0c7d6'
  inverse-surface: '#e1e2eb'
  inverse-on-surface: '#2e3037'
  outline: '#8a919f'
  outline-variant: '#404754'
  surface-tint: '#a7c8ff'
  primary: '#a7c8ff'
  on-primary: '#003060'
  primary-container: '#3091ff'
  on-primary-container: '#002a54'
  inverse-primary: '#005eb2'
  secondary: '#ffc07a'
  on-secondary: '#482900'
  secondary-container: '#fa9b00'
  on-secondary-container: '#623a00'
  tertiary: '#00e297'
  on-tertiary: '#003822'
  tertiary-container: '#00a56d'
  on-tertiary-container: '#00311d'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#a7c8ff'
  on-primary-fixed: '#001c3b'
  on-primary-fixed-variant: '#004788'
  secondary-fixed: '#ffddbb'
  secondary-fixed-dim: '#ffb868'
  on-secondary-fixed: '#2b1700'
  on-secondary-fixed-variant: '#673d00'
  tertiary-fixed: '#4dffb2'
  tertiary-fixed-dim: '#00e297'
  on-tertiary-fixed: '#002112'
  on-tertiary-fixed-variant: '#005234'
  background: '#10131a'
  on-background: '#e1e2eb'
  surface-variant: '#32353c'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 44px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 34px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.005em
  telemetry-lg:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.02em
  telemetry-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: -0.01em
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-tablet: 1.25rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system expresses a tactical, high-consequence crisis response utility disguised as an ultra-refined consumer instrument. It replaces the anxiety-inducing, spreadsheet-dense paradigm of conventional logistics software with a calm, deeply focused operational cockpit. The emotional tone is authoritative yet empathetic, composed under pressure, and unmistakably modern. 

The aesthetic is rooted in **tactical dark minimalism with bioluminescent telemetry**. Interfaces are built on deep obsidian voids where critical supply lines, transport vectors, and node statuses glow with organic kinetic clarity. Surfaces use soft, fluid contours rather than rigid boxes, balancing precision data display with humane, stress-reducing affordances.

## Colors

The palette operates on absolute dark luminance, prioritizing contrast, glanceability, and reduced ocular strain during continuous field or command operation.

- **Canvas & Neutrals**: Grounded in obsidian ink (`#0B0E14`), moving outward through deep carbon layers (`#141923`, `#1C2331`, `#283244`) to provide architectural depth without high-friction borders. Neutral text ranges from crisp ice white (`#F4F7FC`) to muted telemetry slate (`#7E8B9F`).
- **Primary (Signal Cobalt - `#0F8BFF`)**: Anchors primary interactive mechanisms, core network links, routed nodes, and active tracking paths.
- **Secondary (Emergency Amber - `#FF9F0A`)**: Signals bottlenecks, depleted reserves, high-priority dispatches, and pending human authorizations.
- **Tertiary (Bioluminescent Emerald - `#05E69A`)**: Designates healthy supply vectors, verified cold-chain continuity, and validated resource drop-offs.
- **Accent (Warm Sand - `#E5D4BA`)**: A stabilizing humanizing tone for medical manifests, triage metadata, and field notes, softening synthetic technical visual noise.

## Typography

The typographic hierarchy creates a strict operational dialogue between structural clarity and granular precision:

- **Headlines & Structural Anchors (`Plus Jakarta Sans`)**: Delivers geometric warmth, contemporary optimism, and crisp human legibility at large scales without corporate sterility.
- **Continuous Reading & Interfaces (`Inter`)**: Neutral, neutral-density body text optimized for micro-screen legibility and high information retention under ambient outdoor lighting.
- **Telemetry & Manifest Metadata (`JetBrains Mono`)**: Strict, tabular figures for SKU counts, geographic coordinates, timestamps, cold-chain temperature thresholds, and cargo capacities. All numerals maintain identical bounding widths to prevent layout shifts during live polling.

## Layout & Spacing

Layout adheres to a fluid, viewport-adaptive layout built around modular card-streams rather than tabular grids. 

- **Grid Strategy**: On mobile (`<640px`), layouts run a fluid single column with generous vertical breathing room (`space-md`) and `margin` padding. Tablet (`640px–1024px`) shifts to a 6-column fluid structure. Desktop (`>1024px`) expands to a 12-column layout maxing out at 1440px canvas width, allowing synchronized tactical maps on one side and event node feeds on the other.
- **Rhythm & Safe Areas**: Component padding relies strictly on the `space-*` scale. Dynamic safe-area insets at the top (dynamic islands, status bars) and bottom (swipe home bars) dictate persistent contextual navigation offsets.

## Elevation & Depth

Spatial hierarchy is achieved through **tonal stratification and bioluminescent emissive blooms** rather than drop shadows:

- **Surface Tiers**: Base canvas sits at `#0B0E14`. Elevating interactive content shifts to `#141923` (Level 1 Surface), overlay sheets to `#1C2331` (Level 2 Floating), and temporary popovers to `#283244` (Level 3 Modal).
- **Outlines & Ghost Borders**: Structural elements never use opaque borders. They rely on an ultra-subtle, light-catching hairline perimeter: `rgba(255, 255, 255, 0.07)`.
- **Luminescent Energy & Glows**: Active and critical status indicators leverage tinted ambient back-glows. Instead of harsh shadows, an active emerald node emits a radial diffusion (`box-shadow: 0 0 24px rgba(5, 230, 154, 0.28)`), communicating real-time vital life directly onto the canvas. Broken or compromised routes produce an organic, pulsating amber-red diffusion (`box-shadow: 0 0 32px rgba(255, 159, 10, 0.35)`).

## Shapes

The shape system embraces continuous, aerodynamic curves (`16px` to `24px`) to remove visual edge fatigue. 

- Interactive chips, quick-action pills, status tags, and floating controls employ complete full-radius curvature (`pill-shaped` / `9999px`).
- Operational cards and transport stream tiles use `rounded-lg` (`16px`) on mobile and `rounded-xl` (`24px`) on wide displays.
- Visual elements are deliberately organic, signaling responsive ergonomics and human-centered design in high-stress operational environments.

## Components

### Buttons & Interactive Triggers
- **Primary Action (Signal Blue)**: Rounded pill (`rounded-full`), solid `#0F8BFF` background with dark obsidian typography (`#0B0E14`) in high-contrast states or pure ice white. Includes subtle forward radial gradient sheen.
- **Crisis / Emergency Push**: Soft emergency amber fill (`rgba(255, 159, 10, 0.15)`) bounded by a vibrant amber rim with high-visibility amber text. Upon tap, tactile haptic feedback confirms initiation.
- **Ghost Actions**: Low-luminance surfaces (`#141923`) encased in a soft hairline contour (`rgba(255, 255, 255, 0.08)`), transitioning to `rgba(255, 255, 255, 0.14)` on touch.

### Telemetry Nodes & Kinetic Chips
- Filter and status chips feature rounded pill silhouettes with embedded mono identifiers (`label-caps`).
- Active operational statuses contain an integrated live-pulse dot: a central 6px solid beacon surrounded by a slow-breathing kinetic glow ring representing data ping frequency.

### Supply Chain Stream Cards (Replacing Tables)
- Tabular data rows are prohibited. Cargo and resource distributions are encapsulated in contextual spatial cards featuring an asymmetric upper-left telemetry stamp (e.g., manifest ID, geo-coords) and an upper-right status indicator.
- Mid-sections host critical progress gauges rendered as smooth, high-radius bar graphs with glowing terminals.

### Input Fields & Search Vectors
- Inputs use dark pill-style or high-radius container shells (`rounded-xl`), filled with `#141923` and bordered by `rgba(255, 255, 255, 0.07)`. 
- Focus states do not show harsh native rings; instead, they illuminate with a signal cobalt outer aura (`0 0 0 1px #0F8BFF, 0 0 16px rgba(15, 139, 255, 0.25)`).

### Network Link Visualizer (Organic Pulse)
- Live map and graph nodes communicate connection fidelity using animated SVG vector strokes. Healthy links maintain continuous bioluminescent emerald pathways; severed or congested links pulse asynchronously in emergency amber with intermittent breaks along the curve.