# OLDCARTS Consulting — Website v2.0

**Your business has symptoms. We diagnose them.**

A complete rebuild of [oldcarts.com](https://www.oldcarts.com), designed and engineered
end-to-end by Claude (Anthropic) as a demonstration of AI-driven web design — concept,
palette, typography, WebGL, motion, copy, three review passes, and deployment.

## The concept

OLDCARTS is a clinical mnemonic (Onset, Location, Duration, Character, Aggravating,
Relieving, Timing, Severity). The site renders the brand as a **diagnostic instrument**:
an examination-room palette, a WebGL particle "organism" with a resting heart rate of
58 BPM, an ECG course-of-care that draws itself on scroll, services as treatment
protocols, and a whole page that keeps time with one shared heartbeat clock.

Read the full case notes at [`/guide`](https://www.oldcarts.com/guide/).

## Stack

- Static HTML/CSS/JS — no framework, no build step
- [Three.js](https://threejs.org) — custom GLSL particle shader (hero organism)
- [GSAP](https://gsap.com) + ScrollTrigger + SplitText — motion choreography
- [Lenis](https://lenis.darkroom.engineering) — inertial scroll
- Self-hosted variable fonts: Fraunces, Instrument Sans, Fragment Mono

## Structure

```
index.html          the practice
guide/index.html    how this site was made (/guide)
assets/css|js|fonts
vendor/             pinned library builds
netlify.toml        headers + redirects (publish root: .)
```

## Deploy

Any static host works. On Netlify: *Import from Git → this repo → no build command →
publish directory `.`*

---
© 2026 OLDCARTS Consulting LLC · Watkinsville, GA
