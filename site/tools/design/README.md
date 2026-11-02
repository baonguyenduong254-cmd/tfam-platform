# Design tooling

Install development tools with `npm ci --prefix tools/design --ignore-scripts`.
They are independent from the production React bundle.

- Impeccable CLI 4.8.0: `DO_NOT_TRACK=1 node tools/design/node_modules/impeccable/cli/bin/cli.js context --target app/components/CinematicEntry.tsx`. Linux engine 0.1.18 verified. The upstream skill is installed in `.agents/skills/impeccable`; the launcher reconstructs its split font index when needed. Personal skill-directory publication did not succeed, so use this project installation directly.
- Awwwards MCP 1.16.1: `node tools/design/node_modules/awwwards-mcp/dist/cli.js`. `node tools/design/check-mcp.mjs` verifies initialize and tools/list over stdio (39 tools). This is a cloud server installation, not an active ChatGPT plugin registration. Browser capture/recording dependencies are not installed; use the approved browser tools for website QA. Do not treat a successful handshake as a successful reference search or capture.
- Taste frontend skill: complete upstream skill installed in the owner's personal skill directory; its direction-dealing script was executed successfully.
- Motion 12.23.24: production dependency, imported from `motion/react`. Owns the opening/selection UI transition. Canvas owns the background. Existing GSAP owns other faction surfaces. No overlapping animation controllers.

Sources: https://github.com/Leonxlnx/taste-skill (12af471), https://github.com/pbakaus/impeccable (e89e3ad), https://motion.dev/docs/react-installation, https://github.com/INSANE0777/Awwwards-mcp.

Opening refinement: original quote and panorama preserved; utility controls use 44px targets; reduced-motion button announces its disabled state accurately. This pass does not certify all-site contrast, mobile/zoom, audible audio, or cross-device progress sync.
