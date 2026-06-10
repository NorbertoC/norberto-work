import { useEffect, useRef, useState } from "react";
import type { RotationLayerMode, RotationMode, ScatterSignal } from "../three/scene-controls";

type ThreeBackdropProps = {
  onScatterStatusChange: (status: "active" | "idle") => void;
  resetSignal: number;
  rotationLayerMode: RotationLayerMode;
  rotationMode: RotationMode;
  scatterSignal: ScatterSignal;
};

export function ThreeBackdrop({
  onScatterStatusChange,
  resetSignal,
  rotationLayerMode,
  rotationMode,
  scatterSignal,
}: ThreeBackdropProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ resetSignal, rotationLayerMode, rotationMode, scatterSignal });
  const [sceneStatus, setSceneStatus] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    stateRef.current = { resetSignal, rotationLayerMode, rotationMode, scatterSignal };
  }, [resetSignal, rotationLayerMode, rotationMode, scatterSignal]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    const startScene = async () => {
      try {
        const { createCompilerScene } = await import("../three/create-compiler-scene");
        if (cancelled) return;

        const controller = createCompilerScene({
          canvas,
          getResetSignal: () => stateRef.current.resetSignal,
          getRotationLayerMode: () => stateRef.current.rotationLayerMode,
          getRotationMode: () => stateRef.current.rotationMode,
          getScatterSignal: () => stateRef.current.scatterSignal,
          onReady: () => setSceneStatus("ready"),
          onScatterStatusChange,
        });
        cleanup = controller.destroy;
      } catch (error) {
        console.warn("Could not start Three.js scene", error);
        setSceneStatus("failed");
      }
    };

    void startScene();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [onScatterStatusChange]);

  return (
    <>
      <div className={`webgl-wrap ${sceneStatus === "ready" ? "is-ready" : ""}`} aria-hidden="true">
        <canvas id="three-scene" ref={canvasRef} />
        <div id="fallback-scene">
          <div className="fallback-orb" />
        </div>
      </div>
      {sceneStatus === "failed" ? (
        <p className="status-note">Three.js could not start, so this preview is showing the CSS fallback scene.</p>
      ) : null}
    </>
  );
}
