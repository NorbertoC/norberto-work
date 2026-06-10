import * as THREE from "three";
import type { RotationLayerMode, RotationMode, ScatterSignal } from "./scene-controls";

type SceneStatus = "active" | "idle";

type CompilerSceneOptions = {
  canvas: HTMLCanvasElement;
  getResetSignal: () => number;
  getRotationLayerMode: () => RotationLayerMode;
  getRotationMode: () => RotationMode;
  getScatterSignal: () => ScatterSignal;
  onReady: () => void;
  onScatterStatusChange: (status: SceneStatus) => void;
};

type CompilerSceneController = {
  destroy: () => void;
};

type BlockData = {
  angle: number;
  radius: number;
  scale: number;
  scatterDelay: number;
  scatterX: number;
  scatterY: number;
  scatterZ: number;
  strand: 1 | -1;
  y: number;
};

const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);

const easeInOutCubic = (value: number) =>
  value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const disposeMaterial = (material: THREE.Material | THREE.Material[]) => {
  if (Array.isArray(material)) {
    material.forEach((item) => item.dispose());
    return;
  }

  material.dispose();
};

const disposeScene = (scene: THREE.Scene) => {
  scene.traverse((object) => {
    const disposable = object as Partial<{
      geometry: THREE.BufferGeometry;
      material: THREE.Material | THREE.Material[];
    }>;

    disposable.geometry?.dispose();
    if (disposable.material) disposeMaterial(disposable.material);
  });
};

export const createCompilerScene = ({
  canvas,
  getResetSignal,
  getRotationLayerMode,
  getRotationMode,
  getScatterSignal,
  onReady,
  onScatterStatusChange,
}: CompilerSceneOptions): CompilerSceneController => {
  const pointer = { x: 0, y: 0 };
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0.28, 8.5);

  const mainGroup = new THREE.Group();
  scene.add(mainGroup);

  const ambient = new THREE.AmbientLight(0x7fdc98, 0.34);
  scene.add(ambient);

  const key = new THREE.PointLight(0x8fbfff, 42, 14);
  key.position.set(3.5, 3.2, 4.8);
  scene.add(key);

  const rim = new THREE.PointLight(0x9f86ff, 28, 11);
  rim.position.set(-3.8, -2.6, 4.2);
  scene.add(rim);

  const coreMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x08100c,
    emissive: 0x123d22,
    emissiveIntensity: 0.46,
    metalness: 0.26,
    roughness: 0.18,
    thickness: 0.7,
    transmission: 0.18,
  });

  const wireMaterial = new THREE.MeshBasicMaterial({
    color: 0x72d48e,
    opacity: 0.32,
    transparent: true,
    wireframe: true,
  });

  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.18, 5), coreMaterial);
  core.position.set(1.65, 0.12, 0);
  mainGroup.add(core);

  const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.42, 3), wireMaterial);
  wire.position.copy(core.position);
  mainGroup.add(wire);

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x6aa7f2,
    opacity: 0.28,
    transparent: true,
    wireframe: true,
  });

  const rings: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>[] = [];
  for (let index = 0; index < 4; index += 1) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.95 + index * 0.28, 0.006, 8, 120), ringMaterial);
    ring.position.copy(core.position);
    ring.rotation.set(Math.PI / 2 + index * 0.42, index * 0.7, index * 0.23);
    mainGroup.add(ring);
    rings.push(ring);
  }

  const blockGeometry = new THREE.BoxGeometry(0.11, 0.11, 0.11);
  const blockMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x72d48e,
    emissive: 0x1f8f4c,
    emissiveIntensity: 0.34,
    metalness: 0.08,
    roughness: 0.32,
  });
  const blockCount = 172;
  const blocks = new THREE.InstancedMesh(blockGeometry, blockMaterial, blockCount);
  const dummy = new THREE.Object3D();
  const blockData: BlockData[] = [];

  for (let index = 0; index < blockCount; index += 1) {
    const t = index / blockCount;
    const strand = index % 2 === 0 ? 1 : -1;
    const angle = t * Math.PI * 9 + strand * 0.9;
    const radius = 2.6 + Math.sin(t * Math.PI * 5) * 0.36;
    const y = (t - 0.5) * 4.4;
    const x = Math.cos(angle) * radius + 1.65;
    const z = Math.sin(angle) * radius;
    const scale = 0.72 + Math.random() * 1.5;
    const side = index % 2 === 0 ? -1 : 1;
    const scatterBand = ((index * 37) % blockCount) / blockCount;
    const scatterX = side * (3.2 + Math.random() * 4.2) + 1.65;
    const scatterY = (scatterBand - 0.5) * 6.6 + (Math.random() - 0.5) * 0.8;
    const scatterZ = -1.2 - Math.random() * 5.2;
    const scatterDelay = (index % 24) * 0.018;

    blockData.push({ angle, radius, scale, scatterDelay, scatterX, scatterY, scatterZ, strand, y });
    dummy.position.set(x, y, z);
    dummy.rotation.set(angle, angle * 0.37, angle * 0.18);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    blocks.setMatrixAt(index, dummy.matrix);
  }

  blocks.instanceMatrix.needsUpdate = true;
  mainGroup.add(blocks);

  const particleCount = 760;
  const particlePositions = new Float32Array(particleCount * 3);
  const particleColors = new Float32Array(particleCount * 3);
  const colorA = new THREE.Color(0x72d48e);
  const colorB = new THREE.Color(0x6aa7f2);
  const colorC = new THREE.Color(0x9f86ff);

  for (let index = 0; index < particleCount; index += 1) {
    const radius = 3.4 + Math.random() * 3.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    particlePositions[index * 3] = Math.sin(phi) * Math.cos(theta) * radius + 1.65;
    particlePositions[index * 3 + 1] = Math.cos(phi) * radius * 0.72;
    particlePositions[index * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;

    const color = index % 3 === 0 ? colorA : index % 3 === 1 ? colorB : colorC;
    particleColors[index * 3] = color.r;
    particleColors[index * 3 + 1] = color.g;
    particleColors[index * 3 + 2] = color.b;
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
  particleGeometry.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));
  const particles = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({
      depthWrite: false,
      opacity: 0.78,
      size: 0.024,
      transparent: true,
      vertexColors: true,
    }),
  );
  mainGroup.add(particles);

  const curveMaterial = new THREE.LineBasicMaterial({
    color: 0x72d48e,
    opacity: 0.26,
    transparent: true,
  });

  const curves = new THREE.Group();
  for (let curveIndex = 0; curveIndex < 18; curveIndex += 1) {
    const points: THREE.Vector3[] = [];
    const offset = (curveIndex / 18) * Math.PI * 2;

    for (let pointIndex = 0; pointIndex < 80; pointIndex += 1) {
      const t = pointIndex / 79;
      const angle = t * Math.PI * 2 + offset;
      points.push(
        new THREE.Vector3(
          1.65 + Math.cos(angle) * (2.2 + Math.sin(t * Math.PI * 3 + offset) * 0.3),
          (t - 0.5) * 3.7 + Math.sin(angle + offset) * 0.3,
          Math.sin(angle) * (1.6 + Math.cos(t * Math.PI * 2) * 0.36),
        ),
      );
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    curves.add(new THREE.Line(geometry, curveMaterial));
  }
  mainGroup.add(curves);

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const handlePointerMove = (event: PointerEvent) => {
    pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
    pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
  };

  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", handlePointerMove);

  const reducedMotionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduceMotion = reducedMotionMedia.matches;
  const handleReducedMotionChange = (event: MediaQueryListEvent) => {
    reduceMotion = event.matches;
  };
  reducedMotionMedia.addEventListener("change", handleReducedMotionChange);

  const clock = new THREE.Clock();
  const cubeScatter = {
    duration: 8.4,
    reset: 0,
    startedAt: -10,
    trigger: 0,
  };

  let frameId = 0;
  let isDestroyed = false;
  let scatterStatus: SceneStatus = "idle";

  const setScatterStatus = (status: SceneStatus) => {
    if (scatterStatus === status) return;
    scatterStatus = status;
    onScatterStatusChange(status);
  };

  const startAnimation = () => {
    if (frameId || isDestroyed || document.hidden) return;
    frameId = window.requestAnimationFrame(animate);
  };

  const stopAnimation = () => {
    window.cancelAnimationFrame(frameId);
    frameId = 0;
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      stopAnimation();
      return;
    }

    startAnimation();
  };

  const animate = () => {
    if (isDestroyed) return;

    frameId = 0;
    const elapsed = clock.getElapsedTime();
    const motionScale = reduceMotion ? 0.35 : 1;
    const targetX = pointer.x * 0.42;
    const targetY = -pointer.y * 0.28;
    const rotationMode = getRotationMode();
    const rotationLayerMode = getRotationLayerMode();
    const scatterSignal = getScatterSignal();
    const resetSignal = getResetSignal();

    mainGroup.rotation.y += (targetX - mainGroup.rotation.y) * 0.035;
    mainGroup.rotation.x += (targetY - mainGroup.rotation.x) * 0.035;
    mainGroup.position.x = window.innerWidth < 1000 ? 0.2 : 1.35;
    mainGroup.position.y = window.innerWidth < 1000 ? -0.28 : 0;

    const orbitDirection = rotationMode.direction * rotationLayerMode.orbitMultiplier;
    const objectDirection = rotationMode.direction * rotationLayerMode.objectMultiplier;
    const verticalSpin = rotationMode.axis === "x";

    if (cubeScatter.trigger !== scatterSignal.id) {
      cubeScatter.trigger = scatterSignal.id;
      cubeScatter.duration = scatterSignal.duration;
      cubeScatter.startedAt = elapsed;
      setScatterStatus("active");
    }

    if (cubeScatter.reset !== resetSignal) {
      cubeScatter.reset = resetSignal;
      cubeScatter.startedAt = -10;
      setScatterStatus("idle");
    }

    const scatterElapsed = elapsed - cubeScatter.startedAt;
    const scatterActive = scatterElapsed >= 0 && scatterElapsed < cubeScatter.duration;
    const scatterBaseProgress = clamp01(scatterElapsed / cubeScatter.duration);

    if (!scatterActive) setScatterStatus("idle");

    if (verticalSpin) {
      core.rotation.x = elapsed * 0.24 * objectDirection;
      core.rotation.y = Math.sin(elapsed * 0.4) * 0.16;
      wire.rotation.x = -elapsed * 0.18 * objectDirection;
      wire.rotation.z = elapsed * 0.12 * objectDirection;
    } else {
      core.rotation.y = elapsed * 0.24 * objectDirection;
      core.rotation.x = Math.sin(elapsed * 0.4) * 0.16;
      wire.rotation.y = -elapsed * 0.18 * objectDirection;
      wire.rotation.z = elapsed * 0.12 * objectDirection;
    }

    rings.forEach((ring, index) => {
      if (verticalSpin) {
        ring.rotation.x += (0.003 + index * 0.0005) * orbitDirection;
        ring.rotation.y += 0.0016 + index * 0.0003;
      } else {
        ring.rotation.x += 0.0024 + index * 0.0004;
        ring.rotation.y += (0.003 + index * 0.0005) * orbitDirection;
      }
    });

    for (let index = 0; index < blockCount; index += 1) {
      const data = blockData[index];
      const angle = data.angle + elapsed * (0.18 + data.strand * 0.018) * orbitDirection * motionScale;
      const radius = data.radius + Math.sin(elapsed * 1.2 * motionScale + index) * 0.04;
      const orbitX = verticalSpin ? data.y * 0.58 + 1.65 : Math.cos(angle) * radius + 1.65;
      const orbitY = verticalSpin
        ? Math.cos(angle) * radius * 0.72 + Math.sin(elapsed * 0.9 * motionScale + index * 0.2) * 0.06
        : data.y + Math.sin(elapsed * 0.9 * motionScale + index * 0.2) * 0.08;
      const orbitZ = Math.sin(angle) * radius;
      const delayedProgress = clamp01((scatterBaseProgress - data.scatterDelay) / 0.82);
      const outProgress = easeOutCubic(clamp01(delayedProgress / 0.22));
      const returnProgress = easeInOutCubic(clamp01((delayedProgress - 0.22) / 0.78));
      const scatterAmount = scatterActive ? outProgress * (1 - returnProgress) : 0;
      const scatterPulse = scatterAmount * Math.sin(elapsed * 2.8 * motionScale + index) * 0.22;
      const x = orbitX + (data.scatterX - orbitX) * scatterAmount;
      const y = orbitY + (data.scatterY - orbitY) * scatterAmount + scatterPulse;
      const z = orbitZ + (data.scatterZ - orbitZ) * scatterAmount;

      dummy.position.set(x, y, z);
      dummy.rotation.set(
        angle + elapsed * (0.3 + scatterAmount * 1.9) * objectDirection,
        angle * 0.35 + scatterAmount * Math.PI * 1.2,
        elapsed * (0.22 + scatterAmount * 1.4) * objectDirection,
      );
      dummy.scale.setScalar(data.scale * (1 + Math.sin(elapsed * 1.6 * motionScale + index) * 0.06 + scatterAmount * 0.16));
      dummy.updateMatrix();
      blocks.setMatrixAt(index, dummy.matrix);
    }
    blocks.instanceMatrix.needsUpdate = true;

    if (verticalSpin) {
      particles.rotation.x = elapsed * 0.018 * orbitDirection;
      particles.rotation.y = Math.sin(elapsed * 0.2) * 0.04;
      curves.rotation.x = -elapsed * 0.045 * orbitDirection;
      curves.rotation.y = Math.sin(elapsed * 0.18) * 0.035;
    } else {
      particles.rotation.y = elapsed * 0.018 * orbitDirection;
      particles.rotation.x = Math.sin(elapsed * 0.2) * 0.04;
      curves.rotation.y = -elapsed * 0.045 * orbitDirection;
      curves.rotation.x = Math.sin(elapsed * 0.18) * 0.02;
    }

    camera.position.x += (pointer.x * 0.28 - camera.position.x) * 0.025;
    camera.position.y += (0.28 - pointer.y * 0.18 - camera.position.y) * 0.025;
    camera.lookAt(0.8, 0, 0);

    renderer.render(scene, camera);
    startAnimation();
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  onReady();
  startAnimation();

  return {
    destroy: () => {
      isDestroyed = true;
      stopAnimation();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      reducedMotionMedia.removeEventListener("change", handleReducedMotionChange);
      disposeScene(scene);
      renderer.dispose();
    },
  };
};
