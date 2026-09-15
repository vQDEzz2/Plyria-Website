"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { findFace, findHat, rgbaToHex, type PlayerData } from "@/lib/catalog";

// 3D avatar made from the game's own models, exported from the Unity project into public/models:
//   <bundle>/<part>.obj for each body part (same order as BODY_PARTS), <bundle>/face.obj (the face decal layer),
//   hats/<id>.obj with hats/<id>-<material>.png, plus head-skin.png and body-skin.png.
// Colors multiply the skin textures like the game's URP material does. Drag to turn it.
// ponytail: the models were exported by hand from the Unity editor. Adding or changing a bundle or hat means
// exporting again; turn that into a Unity editor menu command once it happens often. Check them at /dev/avatar.

const PART_FILES = ["head", "torso", "left-arm", "right-arm", "left-leg", "right-leg"];

const models = new Map<string, Promise<THREE.Group>>();
const textures = new Map<string, Promise<THREE.Texture>>();

function loadModel(url: string) {
  if (!models.has(url)) models.set(url, new OBJLoader().loadAsync(url));
  return models.get(url)!.then((group) => group.clone(true)); // clones share geometry with the cache
}

function loadTexture(url: string) {
  if (!textures.has(url)) {
    textures.set(
      url,
      new THREE.TextureLoader().loadAsync(url).then((texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 4;
        return texture;
      }),
    );
  }
  return textures.get(url)!;
}

function meshesOf(group: THREE.Object3D) {
  const meshes: THREE.Mesh[] = [];
  group.traverse((o) => o instanceof THREE.Mesh && meshes.push(o));
  return meshes;
}

type Build = { objects: THREE.Object3D[]; materials: THREE.Material[] };

async function buildAvatar(data: PlayerData): Promise<Build> {
  const materials: THREE.Material[] = [];
  const skin = (map: THREE.Texture, color: string) => {
    const m = new THREE.MeshStandardMaterial({ map, color: new THREE.Color(color), roughness: 0.55 });
    materials.push(m);
    return m;
  };

  const [headSkin, bodySkin] = await Promise.all([loadTexture("/models/head-skin.png"), loadTexture("/models/body-skin.png")]);
  const jobs: Promise<THREE.Object3D | null>[] = PART_FILES.map(async (file, i) => {
    const group = await loadModel(`/models/${data.bodyPartBundles[i]}/${file}.obj`);
    const material = skin(i === 0 ? headSkin : bodySkin, rgbaToHex(data.bodyColors[i]));
    meshesOf(group).forEach((mesh) => (mesh.material = material));
    return group;
  });

  jobs.push(
    (async () => {
      const face = findFace(data.face);
      const [group, map] = await Promise.all([loadModel(`/models/${data.bodyPartBundles[0]}/face.obj`), loadTexture(face.image)]);
      // Drawn on a copy of the head's front, pulled slightly toward the camera so it never flickers into the head.
      const material = new THREE.MeshStandardMaterial({
        map,
        transparent: true,
        roughness: 0.55,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      });
      materials.push(material);
      meshesOf(group).forEach((mesh) => (mesh.material = material));
      return group;
    })(),
  );

  const hat = findHat(data.hat);
  if (hat) {
    jobs.push(
      (async () => {
        const group = await loadModel(`/models/hats/${hat.id}.obj`);
        for (const mesh of meshesOf(group)) {
          const count = Array.isArray(mesh.material) ? mesh.material.length : 1;
          const maps = await Promise.all(
            Array.from({ length: count }, (_, i) => loadTexture(`/models/hats/${hat.id}-${i}.png`).catch(() => null)),
          );
          const hatMaterials = maps.map((map) => {
            const m = new THREE.MeshStandardMaterial({ map, roughness: 0.7 });
            materials.push(m);
            return m;
          });
          mesh.material = count > 1 ? hatMaterials : hatMaterials[0];
        }
        return group;
      })(),
    );
  }

  const objects = (await Promise.all(jobs.map((job) => job.catch(() => null)))).filter((o): o is THREE.Object3D => !!o);
  return { objects, materials };
}

export default function Avatar3D({ data, width, height }: { data: PlayerData; width: number; height: number }) {
  const mount = useRef<HTMLDivElement>(null);
  const view = useRef<{ root: THREE.Group; render: () => void } | null>(null);

  // Renderer, camera, lights and drag-to-turn. Made once per size.
  useEffect(() => {
    const el = mount.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9a9a9a, 2.2));
    const sun = new THREE.DirectionalLight(0xffffff, 1.8);
    sun.position.set(4, 6, 9);
    scene.add(sun);

    // The character spans about y -3 (feet) to 2.4 (hat top); aim at the middle.
    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 12.5);
    camera.lookAt(0, -0.3, 0);

    const root = new THREE.Group();
    root.rotation.y = -0.4;
    scene.add(root);
    const render = () => renderer.render(scene, camera);
    view.current = { root, render };

    let dragging = false;
    let lastX = 0;
    const down = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      root.rotation.y += (e.clientX - lastX) * 0.012;
      lastX = e.clientX;
      render();
    };
    const up = () => (dragging = false);
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    render();

    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      view.current = null;
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, [width, height]);

  // Rebuild the character whenever the avatar changes.
  useEffect(() => {
    let cancelled = false;
    let built: Build | null = null;
    buildAvatar(data).then((build) => {
      const current = view.current;
      if (cancelled || !current) {
        build.materials.forEach((m) => m.dispose());
        return;
      }
      built = build;
      current.root.clear();
      build.objects.forEach((o) => current.root.add(o));
      current.render();
    });
    return () => {
      cancelled = true;
      built?.materials.forEach((m) => m.dispose());
    };
  }, [data, width, height]);

  return (
    <div
      ref={mount}
      style={{ width, height }}
      className="cursor-grab touch-none active:cursor-grabbing"
      role="img"
      aria-label="Your avatar in 3D. Drag to turn it."
    />
  );
}
