# OBSCURA creature assets

Place production-ready binary assets at these exact URLs:

- `public/assets/creatures/watcher/watcher.glb`
- `public/assets/creatures/mourner/mourner.glb`

Models must be oriented to face their local +Z direction (towards the camera when the entity is at negative Z), use meters, and have their feet around local Y = -1.2 relative to each entity anchor, or be adjusted when integrating each final model. Please test scale/position on a physical iPhone.

Embed animations in the GLB with clips named `Idle`, `Walk`, `Chase`, `Manifest` and `Attack`. Aliases are supported; unavailable clips fall back to the first available action. Avoid external textures and URI dependencies by packaging everything in the .glb.

Recommended first target: 15k–40k triangles per visible hero creature; one or two 1K maps with physically based materials. Rigged skinned models supported by Three.js GLTFLoader and AnimationMixer. This is a pipeline only: actual photorealistic assets are not bundled in this PR.

If an asset URL returns 404 or decoding fails, ARScene keeps the original geometry and encounter AI. Verify licensing and optimization before committing purchased assets.
