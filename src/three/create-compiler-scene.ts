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

type DragState = {
  active: boolean;
  lastAt: number;
  lastX: number;
  lastY: number;
  pointerId: number;
  velocityX: number;
  velocityY: number;
};

const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);

const easeInOutCubic = (value: number) =>
  value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const CORE_DRAG_RADIUS = 2.2;

const isSceneDragBlockedTarget = (target: EventTarget | null) =>
  target instanceof Element &&
  Boolean(
    target.closest(
      [
        "a",
        "button",
        "input",
        "textarea",
        "select",
        "[role='button']",
        "[role='dialog']",
        ".below",
        ".contact",
        ".hero-copy",
        ".metrics",
        ".site-nav",
        ".terminal",
        ".work",
      ].join(", "),
    ),
  );

const getRendererPixelRatio = () => {
  const maxPixelRatio = window.innerWidth < 760 ? 0.85 : 1;
  return Math.min(window.devicePixelRatio || 1, maxPixelRatio);
};

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

const BLOCK_BASE_SPEED = 0.18;

export const createCompilerScene = ({
  canvas,
  getResetSignal,
  getRotationLayerMode,
  getRotationMode,
  getScatterSignal,
  onReady,
  onScatterStatusChange,
}: CompilerSceneOptions): CompilerSceneController => {
  const freeSpin = { axisX: 0, axisY: 1, hasManualDirection: false, velocityX: 0, velocityY: 0, x: 0, y: 0 };
  // Every angle is integrated per-frame from smoothed velocities. Direction or
  // axis changes (drag wiggles, terminal spin commands) alter velocity only, so
  // positions stay continuous and the orbit never teleports.
  const spinState = {
    blockPhaseH: 0,
    blockPhaseV: 0,
    blockRoll: 0,
    blockTumble: 0,
    corePitch: 0,
    coreYaw: 0,
    curvesPitch: 0,
    curvesYaw: 0,
    dirH: 1,
    dirObject: 1,
    dirV: 1,
    particlesPitch: 0,
    particlesYaw: 0,
    verticalBlend: 0,
    wirePitch: 0,
    wireRoll: 0,
    wireYaw: 0,
  };
  const coreWorldPosition = new THREE.Vector3();
  const pointerNdc = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const dragState: DragState = {
    active: false,
    lastAt: 0,
    lastX: 0,
    lastY: 0,
    pointerId: -1,
    velocityX: 0,
    velocityY: 0,
  };
  const sceneWrapper = canvas.parentElement;
  let appliedSceneFade = -1;
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: false,
    canvas,
    powerPreference: "high-performance",
  });

  renderer.setPixelRatio(getRendererPixelRatio());
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

  const coreMaterial = new THREE.MeshStandardMaterial({
    color: 0x08100c,
    emissive: 0x123d22,
    emissiveIntensity: 0.46,
    metalness: 0.26,
    roughness: 0.18,
  });

  const wireMaterial = new THREE.MeshBasicMaterial({
    color: 0x72d48e,
    opacity: 0.32,
    transparent: true,
    wireframe: true,
  });

  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.18, 3), coreMaterial);
  core.position.set(1.65, 0.12, 0);
  mainGroup.add(core);

  const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.42, 2), wireMaterial);
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
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.95 + index * 0.28, 0.006, 6, 72), ringMaterial);
    ring.position.copy(core.position);
    ring.rotation.set(Math.PI / 2 + index * 0.42, index * 0.7, index * 0.23);
    mainGroup.add(ring);
    rings.push(ring);
  }

  const blockGeometry = new THREE.BoxGeometry(0.11, 0.11, 0.11);
  const blockMaterial = new THREE.MeshStandardMaterial({
    color: 0x72d48e,
    emissive: 0x1f8f4c,
    emissiveIntensity: 0.34,
    metalness: 0.08,
    roughness: 0.32,
  });
  const blockCount = 132;
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

  const particleCount = 420;
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
  for (let curveIndex = 0; curveIndex < 10; curveIndex += 1) {
    const points: THREE.Vector3[] = [];
    const offset = (curveIndex / 10) * Math.PI * 2;

    for (let pointIndex = 0; pointIndex < 48; pointIndex += 1) {
      const t = pointIndex / 47;
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
    renderer.setPixelRatio(getRendererPixelRatio());
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const isPointerOnCore = (event: PointerEvent) => {
    pointerNdc.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
    camera.updateMatrixWorld();
    mainGroup.updateMatrixWorld(true);
    core.getWorldPosition(coreWorldPosition);
    raycaster.setFromCamera(pointerNdc, camera);
    return raycaster.ray.distanceSqToPoint(coreWorldPosition) <= CORE_DRAG_RADIUS * CORE_DRAG_RADIUS;
  };

  const updateCoreHover = (event: PointerEvent) => {
    if (dragState.active || appliedSceneFade < 0.5 || isSceneDragBlockedTarget(event.target) || !isPointerOnCore(event)) {
      document.documentElement.removeAttribute("data-scene-hover");
      return;
    }

    document.documentElement.dataset.sceneHover = "core";
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (!dragState.active) {
      updateCoreHover(event);
      return;
    }

    if (event.pointerId !== dragState.pointerId) return;

    const now = performance.now();
    const deltaMs = Math.max(16, now - dragState.lastAt);
    const deltaX = event.clientX - dragState.lastX;
    const deltaY = event.clientY - dragState.lastY;
    const horizontalDrag = -deltaX;

    dragState.velocityY = clamp((horizontalDrag / deltaMs) * 1.7, -3.4, 3.4);
    dragState.velocityX = clamp((deltaY / deltaMs) * 1.5, -3, 3);
    freeSpin.y += horizontalDrag * 0.0042;
    freeSpin.x += deltaY * 0.0038;
    const speed = Math.hypot(dragState.velocityX, dragState.velocityY);
    if (speed > 0.04) {
      freeSpin.axisX = dragState.velocityX / speed;
      freeSpin.axisY = dragState.velocityY / speed;
      freeSpin.hasManualDirection = true;
    }
    dragState.lastAt = now;
    dragState.lastX = event.clientX;
    dragState.lastY = event.clientY;
    event.preventDefault();
  };

  const stopDrag = (event: PointerEvent) => {
    if (!dragState.active || event.pointerId !== dragState.pointerId) return;

    const speed = Math.hypot(dragState.velocityX, dragState.velocityY);
    freeSpin.velocityX = speed > 0.04 ? dragState.velocityX : 0;
    freeSpin.velocityY = speed > 0.04 ? dragState.velocityY : 0;
    if (speed > 0.04) {
      freeSpin.axisX = dragState.velocityX / speed;
      freeSpin.axisY = dragState.velocityY / speed;
      freeSpin.hasManualDirection = true;
    }
    dragState.active = false;
    dragState.pointerId = -1;
    document.documentElement.removeAttribute("data-scene-drag");
    updateCoreHover(event);
  };

  const handlePointerDown = (event: PointerEvent) => {
    if (
      event.button !== 0 ||
      event.pointerType === "touch" ||
      appliedSceneFade < 0.5 ||
      isSceneDragBlockedTarget(event.target) ||
      !isPointerOnCore(event)
    ) {
      return;
    }

    dragState.active = true;
    dragState.pointerId = event.pointerId;
    dragState.lastAt = performance.now();
    dragState.lastX = event.clientX;
    dragState.lastY = event.clientY;
    dragState.velocityX = 0;
    dragState.velocityY = 0;
    freeSpin.velocityX = 0;
    freeSpin.velocityY = 0;
    document.documentElement.dataset.sceneDrag = "active";
    document.documentElement.removeAttribute("data-scene-hover");
    event.preventDefault();
  };

  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("pointerdown", handlePointerDown);
  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", stopDrag);
  window.addEventListener("pointercancel", stopDrag);

  const reducedMotionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduceMotion = reducedMotionMedia.matches;
  const handleReducedMotionChange = (event: MediaQueryListEvent) => {
    reduceMotion = event.matches;
  };
  reducedMotionMedia.addEventListener("change", handleReducedMotionChange);

  const clock = new THREE.Clock();
  let elapsedTime = 0;
  const cubeScatter = {
    duration: 8.4,
    reset: 0,
    startedAt: -10,
    trigger: 0,
  };

  let frameId = 0;
  let isDestroyed = false;
  let lastBlockUpdate = -Infinity;
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

    clock.getDelta();
    startAnimation();
  };

  const animate = () => {
    if (isDestroyed) return;

    frameId = 0;

    const delta = Math.min(clock.getDelta(), 0.05);

    const fadeStart = window.innerHeight * 0.12;
    const fadeRange = Math.max(1, window.innerHeight * 0.48);
    const sceneFade = 1 - clamp01((window.scrollY - fadeStart) / fadeRange);
    if (sceneFade !== appliedSceneFade) {
      appliedSceneFade = sceneFade;
      sceneWrapper?.style.setProperty("--scene-scroll-fade", sceneFade.toFixed(3));
    }

    // Fully faded below the hero: keep polling for scroll-back, skip the work.
    if (sceneFade <= 0) {
      startAnimation();
      return;
    }

    elapsedTime += delta;
    const elapsed = elapsedTime;
    const frameScale = delta * 60;
    const motionScale = reduceMotion ? 0.35 : 1;
    const groupEase = 1 - Math.pow(0.965, frameScale);
    const cameraEase = 1 - Math.pow(0.975, frameScale);
    const freeSpinDamping = dragState.active ? 1 : Math.pow(0.994, frameScale);
    const rotationMode = getRotationMode();
    const rotationLayerMode = getRotationLayerMode();
    const scatterSignal = getScatterSignal();
    const resetSignal = getResetSignal();

    if (!dragState.active) {
      freeSpin.velocityX *= freeSpinDamping;
      freeSpin.velocityY *= freeSpinDamping;

      if (Math.abs(freeSpin.velocityX) < 0.004) freeSpin.velocityX = 0;
      if (Math.abs(freeSpin.velocityY) < 0.004) freeSpin.velocityY = 0;

      freeSpin.x += freeSpin.velocityX * delta;
      freeSpin.y += freeSpin.velocityY * delta;

      if (freeSpin.hasManualDirection && freeSpin.velocityX === 0 && freeSpin.velocityY === 0) {
        freeSpin.hasManualDirection = false;
      }
    }

    mainGroup.rotation.y += (0 - mainGroup.rotation.y) * groupEase;
    mainGroup.rotation.x += (0 - mainGroup.rotation.x) * groupEase;
    mainGroup.position.x = window.innerWidth < 1000 ? 0.2 : 1.35;
    mainGroup.position.y = window.innerWidth < 1000 ? -0.28 : 0;

    const orbitDirection = rotationMode.direction * rotationLayerMode.orbitMultiplier;
    const objectDirection = rotationMode.direction * rotationLayerMode.objectMultiplier;
    const verticalSpin = rotationMode.axis === "x";
    const manualDirection = freeSpin.hasManualDirection;
    const manualWeightTotal = Math.max(0.001, Math.abs(freeSpin.axisX) + Math.abs(freeSpin.axisY));
    const targetVerticalBlend = manualDirection
      ? Math.abs(freeSpin.axisX) / manualWeightTotal
      : verticalSpin
        ? 1
        : 0;
    const targetDirH = manualDirection && freeSpin.axisY !== 0 ? Math.sign(freeSpin.axisY) : orbitDirection;
    const targetDirV = manualDirection && freeSpin.axisX !== 0 ? Math.sign(freeSpin.axisX) : orbitDirection;
    const spinEase = 1 - Math.pow(0.94, frameScale);
    spinState.verticalBlend += (targetVerticalBlend - spinState.verticalBlend) * spinEase;
    spinState.dirH += (targetDirH - spinState.dirH) * spinEase;
    spinState.dirV += (targetDirV - spinState.dirV) * spinEase;
    spinState.dirObject += (objectDirection - spinState.dirObject) * spinEase;
    const verticalShare = spinState.verticalBlend;
    const horizontalShare = 1 - verticalShare;

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

    spinState.coreYaw += 0.24 * spinState.dirObject * horizontalShare * delta;
    spinState.corePitch += 0.24 * spinState.dirV * verticalShare * delta;
    spinState.wireYaw += -0.18 * spinState.dirObject * horizontalShare * delta;
    spinState.wirePitch += -0.18 * spinState.dirV * verticalShare * delta;
    spinState.wireRoll += 0.12 * spinState.dirObject * delta;
    core.rotation.y = spinState.coreYaw + Math.sin(elapsed * 0.4) * 0.16 * verticalShare;
    core.rotation.x = spinState.corePitch + Math.sin(elapsed * 0.4) * 0.16 * horizontalShare;
    wire.rotation.y = spinState.wireYaw;
    wire.rotation.x = spinState.wirePitch;
    wire.rotation.z = spinState.wireRoll;

    rings.forEach((ring, index) => {
      const ringRate = 0.003 + index * 0.0005;
      ring.rotation.x += (ringRate * spinState.dirV * verticalShare + 0.0018) * frameScale;
      ring.rotation.y += (ringRate * spinState.dirH * horizontalShare + 0.0012) * frameScale;
    });

    spinState.blockPhaseH += BLOCK_BASE_SPEED * spinState.dirH * motionScale * delta;
    spinState.blockPhaseV += BLOCK_BASE_SPEED * spinState.dirV * motionScale * delta;
    spinState.blockTumble += 0.3 * spinState.dirObject * delta;
    spinState.blockRoll += 0.22 * spinState.dirObject * delta;

    const inertiaSpeed = Math.hypot(freeSpin.velocityX, freeSpin.velocityY);
    const blocksAtFullRate = scatterActive || dragState.active || inertiaSpeed > 0.3;

    if (blocksAtFullRate || elapsed - lastBlockUpdate >= (reduceMotion ? 1 / 18 : 1 / 30)) {
      lastBlockUpdate = elapsed;

      for (let index = 0; index < blockCount; index += 1) {
        const data = blockData[index];
        const speedRatio = 1 + data.strand * 0.1;
        const horizontalAngle = data.angle + spinState.blockPhaseH * speedRatio + freeSpin.y;
        const verticalAngle = data.angle + spinState.blockPhaseV * speedRatio + freeSpin.x;
        const radius = data.radius + Math.sin(elapsed * 1.2 * motionScale + index) * 0.04;
        const horizontalX = Math.cos(horizontalAngle) * radius + 1.65;
        const horizontalY = data.y + Math.sin(elapsed * 0.9 * motionScale + index * 0.2) * 0.08;
        const horizontalZ = Math.sin(horizontalAngle) * radius;
        const verticalX = data.y * 0.58 + 1.65;
        const verticalY = Math.cos(verticalAngle) * radius * 0.72 + Math.sin(elapsed * 0.9 * motionScale + index * 0.2) * 0.06;
        const verticalZ = Math.sin(verticalAngle) * radius;
        const orbitX = horizontalX * horizontalShare + verticalX * verticalShare;
        const orbitY = horizontalY * horizontalShare + verticalY * verticalShare;
        const orbitZ = horizontalZ * horizontalShare + verticalZ * verticalShare;
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
          verticalAngle + spinState.blockTumble * (1 + scatterAmount * 6),
          horizontalAngle * 0.35 + scatterAmount * Math.PI * 1.2,
          spinState.blockRoll * (1 + scatterAmount * 6),
        );
        dummy.scale.setScalar(data.scale * (1 + Math.sin(elapsed * 1.6 * motionScale + index) * 0.06 + scatterAmount * 0.16));
        dummy.updateMatrix();
        blocks.setMatrixAt(index, dummy.matrix);
      }
      blocks.instanceMatrix.needsUpdate = true;
    }

    spinState.particlesYaw += 0.018 * spinState.dirH * horizontalShare * delta;
    spinState.particlesPitch += 0.018 * spinState.dirV * verticalShare * delta;
    spinState.curvesYaw += -0.045 * spinState.dirH * horizontalShare * delta;
    spinState.curvesPitch += -0.045 * spinState.dirV * verticalShare * delta;
    particles.rotation.y = spinState.particlesYaw + freeSpin.y * 0.06 * horizontalShare + Math.sin(elapsed * 0.2) * 0.04;
    particles.rotation.x = spinState.particlesPitch + freeSpin.x * 0.06 * verticalShare;
    curves.rotation.y = spinState.curvesYaw - freeSpin.y * 0.08 * horizontalShare + Math.sin(elapsed * 0.18) * 0.035;
    curves.rotation.x = spinState.curvesPitch - freeSpin.x * 0.08 * verticalShare + Math.sin(elapsed * 0.18) * 0.02;

    camera.position.x += (0 - camera.position.x) * cameraEase;
    camera.position.y += (0.28 - camera.position.y) * cameraEase;
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
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDrag);
      window.removeEventListener("pointercancel", stopDrag);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.documentElement.removeAttribute("data-scene-drag");
      document.documentElement.removeAttribute("data-scene-hover");
      reducedMotionMedia.removeEventListener("change", handleReducedMotionChange);
      disposeScene(scene);
      renderer.dispose();
    },
  };
};
