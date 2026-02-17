/**
 * 3D Rubik's Cube Renderer — ALWAYS-REBUILD APPROACH
 * ===================================================
 * 
 * Each cubie = dark body box + colored sticker planes on outward-facing sides.
 * Stickers are large PlaneGeometry quads (95% of face area).
 * 
 * CRITICAL FIX: After every state change, we do a FULL REBUILD of all cubies.
 * This guarantees correct sticker colors at all times. The animation provides
 * the visual transition, and the rebuild snaps to the correct final state.
 * No syncColors — that approach was fundamentally broken because sticker
 * faceIndices don't track through rotations.
 * 
 * Color fidelity: MeshBasicMaterial + NoToneMapping + SRGBColorSpace
 */

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { CubeState, Color, Move, FaceName } from '@/lib/cubeState';

/* ── Color Constants ── */
const HEX_COLORS: Record<Color, number> = {
  W: 0xFFFFFF,  // White
  Y: 0xFFDD00,  // Yellow
  G: 0x00CC22,  // Green
  B: 0x0055FF,  // Blue
  O: 0xFF8800,  // Orange
  R: 0xDD0022,  // Red
};

const BODY_COLOR = 0x1a1a1a;   // Very dark grey body (like real black plastic)
const BG_HEX = 0x0a0a12;      // Scene background
const CUBIE_SIZE = 0.95;       // Body cube size
const STICKER_SIZE = 0.88;     // Sticker plane size
const STICKER_OFFSET = 0.001;  // Tiny offset above body surface
const GAP = 1.05;              // Distance between cubie centers
const ANIM_DURATION = 220;     // ms per move animation

/* ── Types ── */
interface CubeRendererProps {
  cubeState: CubeState;
  highlightFace?: string | null;
}

export interface CubeRendererHandle {
  animateMove: (move: Move) => Promise<void>;
  resetCamera: () => void;
}

/**
 * For a cubie at grid position (gx, gy, gz), determine which faces
 * are on the outside of the Rubik's cube and what color they should be.
 * Returns an array of 6 entries:
 *   [+X(Right), -X(Left), +Y(Up), -Y(Down), +Z(Front), -Z(Back)]
 * null means that face is interior (no sticker).
 */
function getCubieColors(gx: number, gy: number, gz: number, state: CubeState): (Color | null)[] {
  const colors: (Color | null)[] = [null, null, null, null, null, null];
  if (gx === 1)  colors[0] = state.R[(1 - gy) * 3 + (1 - gz)]; // +X = Right face
  if (gx === -1) colors[1] = state.L[(1 - gy) * 3 + (gz + 1)]; // -X = Left face
  if (gy === 1)  colors[2] = state.U[(gz + 1) * 3 + (gx + 1)]; // +Y = Up face
  if (gy === -1) colors[3] = state.D[(1 - gz) * 3 + (gx + 1)]; // -Y = Down face
  if (gz === 1)  colors[4] = state.F[(1 - gy) * 3 + (gx + 1)]; // +Z = Front face
  if (gz === -1) colors[5] = state.B[(1 - gy) * 3 + (1 - gx)]; // -Z = Back face
  return colors;
}

/**
 * The 6 face directions: rotation for the sticker plane.
 */
const FACE_NORMALS: THREE.Vector3[] = [
  new THREE.Vector3(1, 0, 0),   // +X (Right)
  new THREE.Vector3(-1, 0, 0),  // -X (Left)
  new THREE.Vector3(0, 1, 0),   // +Y (Up)
  new THREE.Vector3(0, -1, 0),  // -Y (Down)
  new THREE.Vector3(0, 0, 1),   // +Z (Front)
  new THREE.Vector3(0, 0, -1),  // -Z (Back)
];

const FACE_ROTATIONS: THREE.Euler[] = [
  new THREE.Euler(0, Math.PI / 2, 0),   // +X
  new THREE.Euler(0, -Math.PI / 2, 0),  // -X
  new THREE.Euler(-Math.PI / 2, 0, 0),  // +Y
  new THREE.Euler(Math.PI / 2, 0, 0),   // -Y
  new THREE.Euler(0, 0, 0),             // +Z
  new THREE.Euler(0, Math.PI, 0),       // -Z
];

/* ── Move axis/angle computation ── */
function getMoveAxis(move: Move) {
  const face = move[0] as FaceName;
  const prime = move.includes("'");
  const double = move.includes("2");
  let angle = Math.PI / 2;
  if (prime) angle = -angle;
  if (double) angle = Math.PI;

  let axis: THREE.Vector3;
  let filter: (gx: number, gy: number, gz: number) => boolean;

  switch (face) {
    case 'U': axis = new THREE.Vector3(0, 1, 0); filter = (_, y) => y === 1; break;
    case 'D': axis = new THREE.Vector3(0, -1, 0); filter = (_, y) => y === -1; break;
    case 'R': axis = new THREE.Vector3(1, 0, 0); filter = (x) => x === 1; break;
    case 'L': axis = new THREE.Vector3(-1, 0, 0); filter = (x) => x === -1; break;
    case 'F': axis = new THREE.Vector3(0, 0, 1); filter = (_, __, z) => z === 1; break;
    case 'B': axis = new THREE.Vector3(0, 0, -1); filter = (_, __, z) => z === -1; break;
  }
  return { axis: axis!, angle: -angle, filter: filter! };
}

/* ── Cubie data structure ── */
interface CubieData {
  group: THREE.Group;
  gx: number;
  gy: number;
  gz: number;
}

/* ══════════════════════════════════════════════════════════════════ */

const CubeRenderer = forwardRef<CubeRendererHandle, CubeRendererProps>(({
  cubeState,
  highlightFace,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    cubeGroup: THREE.Group;
    cubies: CubieData[];
    animating: boolean;
    currentRotX: number; currentRotY: number;
    targetRotX: number; targetRotY: number;
    isDragging: boolean;
    lastPointerX: number; lastPointerY: number;
    frameId: number;
    disposed: boolean;
  } | null>(null);

  // Shared geometry instances (created once, reused)
  const sharedGeomRef = useRef<{
    bodyGeom: THREE.BoxGeometry;
    stickerGeom: THREE.PlaneGeometry;
    edgesGeom: THREE.EdgesGeometry;
  } | null>(null);

  function getSharedGeom() {
    if (!sharedGeomRef.current) {
      const bodyGeom = new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE);
      sharedGeomRef.current = {
        bodyGeom,
        stickerGeom: new THREE.PlaneGeometry(STICKER_SIZE, STICKER_SIZE),
        edgesGeom: new THREE.EdgesGeometry(bodyGeom, 15),
      };
    }
    return sharedGeomRef.current;
  }

  /* ── Build all 27 cubies from state ── */
  const buildCube = useCallback((state: CubeState, cubeGroup: THREE.Group, highlight?: string | null): CubieData[] => {
    // Dispose old children
    while (cubeGroup.children.length) {
      const child = cubeGroup.children[0];
      cubeGroup.remove(child);
      child.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          // Don't dispose shared geometry — only dispose materials
          const m = obj.material;
          if (Array.isArray(m)) m.forEach(mat => mat.dispose());
          else if (m) (m as THREE.Material).dispose();
        }
      });
    }

    const { bodyGeom, stickerGeom, edgesGeom } = getSharedGeom();
    const cubies: CubieData[] = [];

    for (let gx = -1; gx <= 1; gx++) {
      for (let gy = -1; gy <= 1; gy++) {
        for (let gz = -1; gz <= 1; gz++) {
          const group = new THREE.Group();
          group.position.set(gx * GAP, gy * GAP, gz * GAP);

          // Dark body cube
          const body = new THREE.Mesh(bodyGeom, new THREE.MeshBasicMaterial({ color: BODY_COLOR }));
          group.add(body);

          // Edge lines for definition
          const edgeLine = new THREE.LineSegments(
            edgesGeom,
            new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 1 })
          );
          body.add(edgeLine);

          // Determine which faces need stickers
          const colorKeys = getCubieColors(gx, gy, gz, state);
          const faceNames = ['R', 'L', 'U', 'D', 'F', 'B'];

          for (let fi = 0; fi < 6; fi++) {
            const colorKey = colorKeys[fi];
            if (colorKey === null) continue; // Interior face — no sticker

            let stickerColor = HEX_COLORS[colorKey];

            // Apply highlight if this face matches
            if (highlight && faceNames[fi] === highlight) {
              const base = new THREE.Color(stickerColor);
              const white = new THREE.Color(0xFFFFFF);
              base.lerp(white, 0.35);
              stickerColor = base.getHex();
            }

            const stickerMat = new THREE.MeshBasicMaterial({
              color: stickerColor,
              side: THREE.DoubleSide,
            });

            const stickerMesh = new THREE.Mesh(stickerGeom, stickerMat);
            const offset = (CUBIE_SIZE / 2) + STICKER_OFFSET;
            stickerMesh.position.copy(FACE_NORMALS[fi].clone().multiplyScalar(offset));
            stickerMesh.rotation.copy(FACE_ROTATIONS[fi]);

            group.add(stickerMesh);
          }

          cubeGroup.add(group);
          cubies.push({ group, gx, gy, gz });
        }
      }
    }

    return cubies;
  }, []);

  /* ── Animate a face rotation ── */
  const animateMove = useCallback((move: Move): Promise<void> => {
    return new Promise(resolve => {
      const s = sceneRef.current;
      if (!s || s.animating) { resolve(); return; }
      s.animating = true;

      const { axis, angle, filter } = getMoveAxis(move);
      const layerCubies = s.cubies.filter(c => filter(c.gx, c.gy, c.gz));

      // Create pivot and attach layer cubie groups
      const pivot = new THREE.Group();
      s.cubeGroup.add(pivot);
      for (const c of layerCubies) pivot.attach(c.group);

      const startTime = performance.now();

      const tick = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / ANIM_DURATION, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

        pivot.quaternion.identity();
        pivot.rotateOnWorldAxis(axis, angle * eased);

        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          // Finalize: re-parent back to cubeGroup
          for (const c of layerCubies) {
            s.cubeGroup.attach(c.group);
          }
          s.cubeGroup.remove(pivot);
          s.animating = false;
          resolve();
          // NOTE: We do NOT update gx/gy/gz or snap positions here.
          // The full rebuild triggered by setCubeState will handle
          // correct positioning and colors.
        }
      };
      requestAnimationFrame(tick);
    });
  }, []);

  const resetCamera = useCallback(() => {
    if (sceneRef.current) {
      sceneRef.current.targetRotX = -25;
      sceneRef.current.targetRotY = 35;
    }
  }, []);

  useImperativeHandle(ref, () => ({ animateMove, resetCamera }));

  /* ── Initialize Three.js scene ── */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = null;
    scene.background = new THREE.Color(BG_HEX);

    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(0, 0, 9.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const cubeGroup = new THREE.Group();
    scene.add(cubeGroup);

    const s = {
      scene, camera, renderer, cubeGroup,
      cubies: [] as CubieData[],
      animating: false,
      currentRotX: -25, currentRotY: 35,
      targetRotX: -25, targetRotY: 35,
      isDragging: false,
      lastPointerX: 0, lastPointerY: 0,
      frameId: 0,
      disposed: false,
    };
    sceneRef.current = s;

    /* Pointer orbit */
    const onDown = (e: PointerEvent) => {
      s.isDragging = true;
      s.lastPointerX = e.clientX;
      s.lastPointerY = e.clientY;
    };
    const onMove = (e: PointerEvent) => {
      if (!s.isDragging) return;
      s.targetRotY += (e.clientX - s.lastPointerX) * 0.4;
      s.targetRotX += (e.clientY - s.lastPointerY) * 0.4;
      s.targetRotX = Math.max(-89, Math.min(89, s.targetRotX));
      s.lastPointerX = e.clientX;
      s.lastPointerY = e.clientY;
    };
    const onUp = () => { s.isDragging = false; };
    const onCtx = (e: Event) => e.preventDefault();

    container.addEventListener('pointerdown', onDown);
    container.addEventListener('pointermove', onMove);
    container.addEventListener('pointerup', onUp);
    container.addEventListener('pointerleave', onUp);
    container.addEventListener('contextmenu', onCtx);

    /* Touch orbit */
    let touchStartX = 0, touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
        s.targetRotY += dx * 0.4;
        s.targetRotX += dy * 0.4;
        s.targetRotX = Math.max(-89, Math.min(89, s.targetRotX));
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });

    /* Render loop */
    const renderLoop = () => {
      if (s.disposed) return;
      s.frameId = requestAnimationFrame(renderLoop);
      s.currentRotX += (s.targetRotX - s.currentRotX) * 0.1;
      s.currentRotY += (s.targetRotY - s.currentRotY) * 0.1;
      cubeGroup.rotation.order = 'YXZ';
      cubeGroup.rotation.x = THREE.MathUtils.degToRad(s.currentRotX);
      cubeGroup.rotation.y = THREE.MathUtils.degToRad(s.currentRotY);
      renderer.render(scene, camera);
    };
    renderLoop();

    /* Resize */
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      s.disposed = true;
      cancelAnimationFrame(s.frameId);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('pointerdown', onDown);
      container.removeEventListener('pointermove', onMove);
      container.removeEventListener('pointerup', onUp);
      container.removeEventListener('pointerleave', onUp);
      container.removeEventListener('contextmenu', onCtx);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  /* ── ALWAYS rebuild cube from state ── */
  useEffect(() => {
    const s = sceneRef.current;
    if (!s) return;
    // Always do a full rebuild — this guarantees correct colors
    s.cubies = buildCube(cubeState, s.cubeGroup, highlightFace);
  }, [cubeState, buildCube, highlightFace]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full cursor-grab active:cursor-grabbing"
      style={{ touchAction: 'none' }}
    />
  );
});

CubeRenderer.displayName = 'CubeRenderer';
export default CubeRenderer;
