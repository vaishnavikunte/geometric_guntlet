# M0 — RECON REPORT

**Environment:** macOS (ARM/x86_64)
**Operating System:** macOS
**CPU Architecture:** Mac Architecture
**Graphics Framework:** Custom 3D engine over HTML5 Canvas API (No WebGL/Three.js)
**Language:** TypeScript / HTML / Vanilla CSS
**SDK:** Node.js (v22.23.2), npm (v10.9.8)
**Build System:** Vite
**Existing Project Structure:**
Currently contains a boilerplate Vite project with custom classes implemented for a previous project (Geometric Gauntlet). The structure includes `src/core`, `src/graphics`, `src/math`, and `src/gameplay`.
**Entry Point:** `src/main.ts` and `index.html`
**Current Dependencies:** 
- `vite`
- `typescript`
**How to Run:** `npm run dev`
**Potential Risks:**
- Rendering performance could drop if the Canvas pixel manipulation is used for the entire 3D world. We will use native Canvas paths for drawing the 3D projected shapes, and restrict heavy pixel-by-pixel rasterization strictly to the CG Lab mode.
- Implementing robust collisions and state management for an infinite runner in a custom engine can be mathematically complex. We will use a modular obstacle generation system and bounding box collision checks.
**Recommended Architecture:**
Preserve the existing 3D math and graphics foundation (`Vector3`, `Vector4`, `Matrix4`, `Mesh`, `Renderer`), as it already satisfies the CG requirements for transformations and projections. Rewrite the gameplay logic (`Player`, `Wall`, `GameEngine`) to support the infinite runner mechanics, 3-lane system, and procedural obstacle generation.
**Implementation Plan:**
1. **M0 — Recon:** Complete.
2. **M1 — Basic Window + 3D Scene:** Adapt the existing engine to draw a futuristic road and basic perspective view.
3. **M2 — Player:** Create the neon robot runner, lane switching (A/D), jumping (Space), and sliding (Down).
4. **M3 — First Gameplay:** Implement basic obstacles, collision detection, and score.
5. **M4 — Environment:** Add neon colors, procedural road segments, and glowing visual aesthetics.
6. **M5 — Levels:** Add the 6 level configurations.
7. **M6-M9:** CG algorithms integration, ensuring visibility, lighting calculations, and projection logic are properly documented and utilized.
8. **M10:** Build the CG Lab mode with rasterization and transformation demonstrations.
9. **M11-M13:** Polish UI, test, and write the project report.

---
**Status:** Recon Complete. Ready to proceed to M1.
