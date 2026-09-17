"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { findFace, findHat, findPants, findShirt, rgbaToHex, type PlayerData } from "@/lib/catalog";

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

// ---------- Classic clothing, the same projection as PlayerData.ClothingMesh in Unity ----------
// Every vertex of a body part picks the side of the part's bounding box its normal faces most and maps into
// that side's rectangle of the 585x559 Roblox template. The box is the part's own size, so bundle bodies get the
// template squeezed or stretched to fit. These models face +Z with the character's right at -X.

const TEMPLATE_W = 585;
const TEMPLATE_H = 559;
type Rect = readonly [x: number, y: number, w: number, h: number];
type Region = "torso" | "right" | "left";
// Per side: Front (+Z), Back (-Z), Right (character's right, -X), Left (+X), Up (+Y), Down (-Y).
const TEMPLATE: Record<Region, readonly Rect[]> = {
  torso: [[231, 74, 128, 128], [427, 74, 128, 128], [165, 74, 64, 128], [361, 74, 64, 128], [231, 8, 128, 64], [231, 204, 128, 64]],
  right: [[217, 355, 64, 128], [85, 355, 64, 128], [151, 355, 64, 128], [19, 355, 64, 128], [217, 289, 64, 64], [217, 485, 64, 64]],
  left: [[308, 355, 64, 128], [440, 355, 64, 128], [506, 355, 64, 128], [374, 355, 64, 128], [308, 289, 64, 64], [308, 485, 64, 64]],
};
// Same order as PART_FILES. Shirts cover the torso and arms; pants the legs and the torso under the shirt.
const PART_REGIONS: (Region | null)[] = [null, "torso", "left", "right", "left", "right"];

function clothingGeometry(source: THREE.BufferGeometry, region: Region) {
  // One set of corners per triangle, so a whole triangle maps into one template side (see below).
  const geometry = source.index ? source.toNonIndexed() : source.clone();
  const position = geometry.getAttribute("position");
  const normal = geometry.getAttribute("normal");
  geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox!;
  const size = new THREE.Vector3().subVectors(max, min).max(new THREE.Vector3(1e-6, 1e-6, 1e-6));
  const rects = TEMPLATE[region];
  const uv = new Float32Array(position.count * 2);
  const clamp = (t: number) => Math.min(1, Math.max(0, t));

  for (let t = 0; t + 2 < position.count; t += 3) {
    // The side the whole triangle faces. Picking it per corner would stretch triangles on the rounded edges
    // across two template panels and show the skin through the transparent gap between them.
    let nx = 0, ny = 0, nz = 0;
    for (let k = 0; k < 3; k++) {
      nx += normal.getX(t + k);
      ny += normal.getY(t + k);
      nz += normal.getZ(t + k);
    }
    const ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz);
    const side = az >= ax && az >= ay ? (nz >= 0 ? 0 : 1) : ax >= ay ? (nx <= 0 ? 2 : 3) : ny >= 0 ? 4 : 5;
    const [rx, ry, rw, rh] = rects[side];

    for (let k = 0; k < 3; k++) {
      const i = t + k;
      const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
      // Seen from the front, the character's right (-X here) is on the left of the picture.
      const fromRight = (x - min.x) / size.x, fromLeft = (max.x - x) / size.x;
      const up = (y - min.y) / size.y;
      const fromFront = (max.z - z) / size.z, fromBack = (z - min.z) / size.z;
      const [u, v] = [
        [fromRight, up],
        [fromLeft, up],
        [fromBack, up],
        [fromFront, up],
        [fromRight, fromFront],
        [fromRight, fromBack],
      ][side];
      // One pixel inside the rectangle so the transparent gap around it is never sampled.
      const px = rx + 1 + clamp(u) * (rw - 2);
      const py = ry + 1 + (1 - clamp(v)) * (rh - 2);
      uv[i * 2] = px / TEMPLATE_W;
      uv[i * 2 + 1] = 1 - py / TEMPLATE_H;
    }
  }

  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return geometry;
}

const clothingGeometries = new Map<string, THREE.BufferGeometry>();

function clothingLayer(parts: THREE.Mesh[], key: string, region: Region, material: THREE.Material) {
  const layer = new THREE.Group();
  for (const mesh of parts) {
    const cacheKey = `${key}|${mesh.geometry.uuid}|${region}`;
    if (!clothingGeometries.has(cacheKey)) clothingGeometries.set(cacheKey, clothingGeometry(mesh.geometry, region));
    const copy = new THREE.Mesh(clothingGeometries.get(cacheKey)!, material);
    copy.position.copy(mesh.position);
    copy.quaternion.copy(mesh.quaternion);
    copy.scale.copy(mesh.scale);
    layer.add(copy);
  }
  return layer;
}

type Build = { objects: THREE.Object3D[]; materials: THREE.Material[] };

async function buildAvatar(data: PlayerData): Promise<Build> {
  const materials: THREE.Material[] = [];
  const skin = (map: THREE.Texture, color: string) => {
    const m = new THREE.MeshStandardMaterial({ map, color: new THREE.Color(color), roughness: 0.55 });
    materials.push(m);
    return m;
  };

  const shirt = findShirt(data.shirt);
  const pants = findPants(data.pants);
  const [headSkin, bodySkin, shirtMap, pantsMap] = await Promise.all([
    loadTexture("/models/head-skin.png"),
    loadTexture("/models/body-skin.png"),
    shirt ? loadTexture(shirt.template).catch(() => null) : null,
    pants ? loadTexture(pants.template).catch(() => null) : null,
  ]);
  // Drawn over the skin, pants first; no mipmaps, so neighbouring template parts don't blur into each other.
  const decal = (map: THREE.Texture | null, order: number) => {
    if (!map) return null;
    map.minFilter = THREE.LinearFilter;
    map.generateMipmaps = false;
    const m = new THREE.MeshStandardMaterial({
      map,
      transparent: true,
      depthWrite: false,
      roughness: 0.6,
      polygonOffset: true,
      polygonOffsetFactor: -order,
      polygonOffsetUnits: -order,
    });
    materials.push(m);
    return m;
  };
  const pantsMaterial = decal(pantsMap, 1);
  const shirtMaterial = decal(shirtMap, 2);

  const jobs: Promise<THREE.Object3D | null>[] = PART_FILES.map(async (file, i) => {
    const url = `/models/${data.bodyPartBundles[i]}/${file}.obj`;
    const group = await loadModel(url);
    const material = skin(i === 0 ? headSkin : bodySkin, rgbaToHex(data.bodyColors[i]));
    const parts = meshesOf(group); // before any clothing layer is added
    parts.forEach((mesh) => (mesh.material = material));

    const region = PART_REGIONS[i];
    const isTorso = i === 1, isArm = i === 2 || i === 3, isLeg = i === 4 || i === 5;
    if (region && pantsMaterial && (isTorso || isLeg)) group.add(clothingLayer(parts, url, region, pantsMaterial));
    if (region && shirtMaterial && (isTorso || isArm)) group.add(clothingLayer(parts, url, region, shirtMaterial));
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

// ---------- Headshots: a front close-up of an avatar's head, as a picture ----------
// Friend lists show many players at once, and browsers only allow a few live WebGL canvases, so one shared
// hidden renderer draws each headshot once and hands back a PNG data URL. Renders run one at a time.

let headshotRenderer: THREE.WebGLRenderer | null = null;
let headshotQueue: Promise<unknown> = Promise.resolve();
const headshots = new Map<string, Promise<string>>();

export function renderHeadshot(data: PlayerData, size = 150): Promise<string> {
  // Everything that can show in the picture: the shoulders and arms are in it too, not just the head.
  const look = [data.bodyPartBundles, data.bodyColors, data.face, data.hat, data.shirt, data.pants];
  const key = `${size}|${JSON.stringify(look)}`;
  if (headshots.has(key)) return headshots.get(key)!;

  const job = headshotQueue.then(async () => {
    const pixels = size * 2; // drawn at double size so it stays sharp on high-DPI screens
    if (!headshotRenderer) {
      headshotRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      headshotRenderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    headshotRenderer.setPixelRatio(1);
    headshotRenderer.setSize(pixels, pixels, false);

    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9a9a9a, 2.2));
    const sun = new THREE.DirectionalLight(0xffffff, 1.8);
    sun.position.set(3, 5, 9);
    scene.add(sun);

    // The head spans about y 0.9 to 2.1 (a hat reaches 2.4). Straight on, framed on the face.
    const camera = new THREE.PerspectiveCamera(20, 1, 0.1, 100);
    camera.position.set(0, 1.62, 5.4);
    camera.lookAt(0, 1.6, 0);

    const build = await buildAvatar(data);
    build.objects.forEach((o) => scene.add(o));
    headshotRenderer.render(scene, camera);
    const url = headshotRenderer.domElement.toDataURL("image/png");
    build.materials.forEach((m) => m.dispose());
    return url;
  });
  headshotQueue = job.catch(() => undefined);
  headshots.set(key, job);
  return job;
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
