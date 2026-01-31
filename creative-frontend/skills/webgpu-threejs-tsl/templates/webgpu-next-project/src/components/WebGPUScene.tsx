"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import * as THREE from "three/webgpu";

// ============================================================================
// Types
// ============================================================================

interface WebGPUSceneProps {
  /** Function to create scene content, returns optional frame callback */
  createContent?: (scene: THREE.Scene, camera: THREE.PerspectiveCamera) => ((deltaTime: number) => void) | void;
  /** Called each frame */
  onFrame?: (time: number, deltaTime: number) => void;
  /** Called when renderer is ready */
  onReady?: (renderer: THREE.WebGPURenderer) => void;
  /** Called on error */
  onError?: (error: Error) => void;
  /** Background color */
  background?: number | null;
  /** Camera position */
  cameraPosition?: [number, number, number];
  /** Camera field of view */
  fov?: number;
  /** Camera near plane */
  near?: number;
  /** Camera far plane */
  far?: number;
  /** Enable antialiasing */
  antialias?: boolean;
  /** Custom class name */
  className?: string;
}

interface SceneState {
  isReady: boolean;
  isWebGPU: boolean;
  error: Error | null;
}

// ============================================================================
// Component
// ============================================================================

export function WebGPUScene({
  createContent,
  onFrame,
  onReady,
  onError,
  background = 0x000000,
  cameraPosition = [0, 0, 5],
  fov = 75,
  near = 0.1,
  far = 1000,
  antialias = true,
  className = "",
}: WebGPUSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGPURenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const frameIdRef = useRef<number>(0);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const contentUpdateRef = useRef<((deltaTime: number) => void) | null>(null);

  const [state, setState] = useState<SceneState>({
    isReady: false,
    isWebGPU: false,
    error: null,
  });

  // Initialize scene
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const initScene = async () => {
      try {
        // Create renderer
        const renderer = new THREE.WebGPURenderer({
          canvas,
          antialias,
          alpha: background === null,
          powerPreference: "high-performance",
        });

        await renderer.init();
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const rect = container.getBoundingClientRect();
        renderer.setSize(rect.width, rect.height, false);

        // Create scene
        const scene = new THREE.Scene();
        if (background !== null) {
          scene.background = new THREE.Color(background);
        }

        // Create camera
        const camera = new THREE.PerspectiveCamera(
          fov,
          rect.width / rect.height,
          near,
          far
        );
        camera.position.set(...cameraPosition);

        // Store refs
        rendererRef.current = renderer;
        sceneRef.current = scene;
        cameraRef.current = camera;

        // Create content
        if (createContent) {
          const update = createContent(scene, camera);
          if (update) {
            contentUpdateRef.current = update;
          }
        }

        // Determine if WebGPU is active
        const isWebGPU = (renderer as any).backend?.isWebGPUBackend ?? false;

        setState({
          isReady: true,
          isWebGPU,
          error: null,
        });

        onReady?.(renderer);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState({ isReady: false, isWebGPU: false, error: err });
        onError?.(err);
      }
    };

    initScene();

    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
    };
  }, [antialias, background, cameraPosition, createContent, far, fov, near, onError, onReady]);

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    if (!container || !renderer || !camera) return;

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [state.isReady]);

  // Animation loop
  useEffect(() => {
    if (!state.isReady) return;

    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera) return;

    clockRef.current.start();

    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);

      const delta = clockRef.current.getDelta();
      const elapsed = clockRef.current.getElapsedTime();

      // Update content
      contentUpdateRef.current?.(delta);

      // User frame callback
      onFrame?.(elapsed, delta);

      // Render
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      clockRef.current.stop();
    };
  }, [state.isReady, onFrame]);

  // Render
  if (state.error) {
    return (
      <div className={`webgpu-container ${className}`}>
        <div className="webgpu-error">
          <p className="webgpu-error-title">WebGPU Error</p>
          <p className="webgpu-error-message">{state.error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`webgpu-container ${className}`}>
      {!state.isReady && <div className="webgpu-loading" />}
      <canvas ref={canvasRef} style={{ touchAction: "none" }} />
    </div>
  );
}

export default WebGPUScene;
