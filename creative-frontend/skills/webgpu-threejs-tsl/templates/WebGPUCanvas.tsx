"use client";

/**
 * WebGPU Canvas Component
 *
 * React component that initializes a WebGPU renderer with WebGL fallback.
 * Handles resize, cleanup, and provides access to the render loop.
 */

import { useEffect, useRef, useCallback, useState } from "react";
import * as THREE from "three/webgpu";
import type {
  WebGPURendererConfig,
  RendererState,
  FrameCallback,
} from "./types";

interface WebGPUCanvasProps {
  /** Canvas class name */
  className?: string;
  /** Renderer configuration */
  config?: WebGPURendererConfig;
  /** Called when renderer is ready */
  onReady?: (renderer: THREE.WebGPURenderer) => void;
  /** Called each frame */
  onFrame?: FrameCallback;
  /** Called on error */
  onError?: (error: Error) => void;
  /** Scene to render */
  scene?: THREE.Scene;
  /** Camera to use */
  camera?: THREE.Camera;
}

export function WebGPUCanvas({
  className = "",
  config = {},
  onReady,
  onFrame,
  onError,
  scene,
  camera,
}: WebGPUCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGPURenderer | null>(null);
  const frameIdRef = useRef<number>(0);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  const [state, setState] = useState<RendererState>({
    renderer: null,
    isWebGPU: false,
    isInitialized: false,
    error: null,
  });

  // Initialize renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const initRenderer = async () => {
      try {
        const renderer = new THREE.WebGPURenderer({
          canvas,
          antialias: config.antialias ?? true,
          alpha: config.alpha ?? false,
          powerPreference: config.powerPreference ?? "high-performance",
        });

        // Initialize WebGPU (falls back to WebGL if unavailable)
        await renderer.init();

        // Set pixel ratio
        renderer.setPixelRatio(config.pixelRatio ?? window.devicePixelRatio);

        // Set initial size
        const rect = canvas.getBoundingClientRect();
        renderer.setSize(rect.width, rect.height, false);

        // Check if WebGPU is active
        const isWebGPU = renderer.backend?.isWebGPUBackend ?? false;

        rendererRef.current = renderer;
        setState({
          renderer,
          isWebGPU,
          isInitialized: true,
          error: null,
        });

        onReady?.(renderer);

        if (!isWebGPU) {
          console.warn("WebGPU not available, using WebGL fallback");
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState((prev) => ({ ...prev, error: err }));
        onError?.(err);
      }
    };

    initRenderer();

    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
    };
  }, [config, onReady, onError]);

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = rendererRef.current;
    if (!canvas || !renderer) return;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);

      // Update camera aspect if perspective
      if (camera && "aspect" in camera) {
        (camera as THREE.PerspectiveCamera).aspect = rect.width / rect.height;
        (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);

    return () => resizeObserver.disconnect();
  }, [camera, state.isInitialized]);

  // Animation loop
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer || !state.isInitialized) return;

    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);

      const delta = clockRef.current.getDelta();
      const elapsed = clockRef.current.getElapsedTime();

      onFrame?.(elapsed, delta);

      if (scene && camera) {
        renderer.render(scene, camera);
      }
    };

    clockRef.current.start();
    animate();

    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      clockRef.current.stop();
    };
  }, [scene, camera, onFrame, state.isInitialized]);

  return (
    <canvas
      ref={canvasRef}
      className={`block w-full h-full ${className}`}
      style={{ touchAction: "none" }}
    />
  );
}

// ============================================================================
// Hooks for external scene management
// ============================================================================

interface UseWebGPUSceneOptions {
  /** Background color */
  background?: number | null;
  /** Camera configuration */
  camera?: {
    fov?: number;
    near?: number;
    far?: number;
    position?: [number, number, number];
  };
}

export function useWebGPUScene(options: UseWebGPUSceneOptions = {}) {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Create scene and camera once
  if (!sceneRef.current) {
    const scene = new THREE.Scene();
    if (options.background !== undefined) {
      scene.background =
        options.background !== null ? new THREE.Color(options.background) : null;
    }
    sceneRef.current = scene;
  }

  if (!cameraRef.current) {
    const cam = options.camera ?? {};
    const camera = new THREE.PerspectiveCamera(
      cam.fov ?? 75,
      1, // Will be updated on resize
      cam.near ?? 0.1,
      cam.far ?? 1000
    );
    const pos = cam.position ?? [0, 0, 5];
    camera.position.set(pos[0], pos[1], pos[2]);
    cameraRef.current = camera;
  }

  const add = useCallback((object: THREE.Object3D) => {
    sceneRef.current?.add(object);
  }, []);

  const remove = useCallback((object: THREE.Object3D) => {
    sceneRef.current?.remove(object);
  }, []);

  return {
    scene: sceneRef.current,
    camera: cameraRef.current,
    add,
    remove,
  };
}

export default WebGPUCanvas;
