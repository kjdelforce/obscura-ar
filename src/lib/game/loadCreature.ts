import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type CreatureMotion = 'Idle' | 'Walk' | 'Chase' | 'Manifest' | 'Attack';
export interface CreatureAsset {
  root: THREE.Group;
  mixer: THREE.AnimationMixer | null;
  actions: Map<string, THREE.AnimationAction>;
  play: (motion: CreatureMotion) => void;
  update: (delta: number) => void;
  dispose: () => void;
}

export async function loadCreature(url: string): Promise<CreatureAsset> {
  const gltf = await new GLTFLoader().loadAsync(url);
  const root = gltf.scene;
  const mixer = gltf.animations.length ? new THREE.AnimationMixer(root) : null;
  const actions = new Map<string, THREE.AnimationAction>();
  gltf.animations.forEach((clip) => actions.set(clip.name.toLowerCase(), mixer!.clipAction(clip)));
  let active: THREE.AnimationAction | undefined;
  const play = (motion: CreatureMotion) => {
    const requested = motion.toLowerCase();
    const aliases: Record<CreatureMotion, string[]> = {
      Idle: ['idle', 'breathing', 'twitch'],
      Walk: ['walk', 'stalk', 'walking'],
      Chase: ['chase', 'run', 'walk'],
      Manifest: ['manifest', 'appear', 'idle'],
      Attack: ['attack', 'lunge', 'chase']
    };
    const action = aliases[motion].map((name) => actions.get(name)).find(Boolean)
      ?? [...actions.entries()].find(([name]) => name.includes(requested))?.[1]
      ?? actions.values().next().value;
    if (!action || action === active) return;
    active?.fadeOut(0.25);
    action.reset().fadeIn(0.25).play();
    active = action;
  };
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.frustumCulled = true;
  });
  play('Idle');
  return {
    root, mixer, actions, play,
    update: (delta) => mixer?.update(Math.min(0.1, Math.max(0, delta))),
    dispose: () => {
      mixer?.stopAllAction();
      if (mixer) mixer.uncacheRoot(root);
      root.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          if (material instanceof THREE.MeshStandardMaterial) {
            for (const texture of [material.map, material.normalMap, material.roughnessMap, material.metalnessMap, material.emissiveMap, material.aoMap]) texture?.dispose();
          }
          material.dispose();
        });
      });
    }
  };
}
