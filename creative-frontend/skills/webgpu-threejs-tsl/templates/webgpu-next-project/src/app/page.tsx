"use client";

import { useCallback, useRef, useState } from "react";
import * as THREE from "three/webgpu";
import { color, time, oscSine, normalWorld, positionWorld, cameraPosition, float, mix } from "three/tsl";
import { WebGPUScene } from "@/components/WebGPUScene";

export default function Home() {
  const [fps, setFps] = useState(0);
  const [isWebGPU, setIsWebGPU] = useState<boolean | null>(null);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  // Create demo scene content
  const createSceneContent = useCallback((scene: THREE.Scene) => {
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    // Create animated material with TSL
    const material = new THREE.MeshStandardNodeMaterial();

    // Fresnel effect
    const viewDir = cameraPosition.sub(positionWorld).normalize();
    const fresnel = float(1).sub(normalWorld.dot(viewDir).saturate()).pow(3);

    // Animated colors
    const baseColor = color(0x1a1a2e);
    const rimColor = color(0x00ffff);
    const pulse = oscSine(time.mul(2));

    material.colorNode = mix(baseColor, rimColor, fresnel.mul(pulse.mul(0.5).add(0.5)));
    material.emissiveNode = rimColor.mul(fresnel.mul(0.3));
    material.roughnessNode = float(0.3);
    material.metalnessNode = float(0.1);

    // Create geometry
    const geometry = new THREE.TorusKnotGeometry(1, 0.3, 128, 32);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Animation
    return (deltaTime: number) => {
      mesh.rotation.x += deltaTime * 0.3;
      mesh.rotation.y += deltaTime * 0.5;
    };
  }, []);

  // Frame callback for FPS counter
  const onFrame = useCallback((time: number, deltaTime: number) => {
    frameCountRef.current++;
    const now = performance.now();
    const elapsed = now - lastTimeRef.current;

    if (elapsed >= 1000) {
      setFps(Math.round((frameCountRef.current * 1000) / elapsed));
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }
  }, []);

  // Ready callback
  const onReady = useCallback((renderer: THREE.WebGPURenderer) => {
    const isGPU = (renderer as any).backend?.isWebGPUBackend ?? false;
    setIsWebGPU(isGPU);
    console.log(`Renderer initialized: ${isGPU ? "WebGPU" : "WebGL fallback"}`);
  }, []);

  return (
    <main className="h-screen w-screen overflow-hidden">
      <div className="webgpu-container h-full w-full">
        <WebGPUScene
          createContent={createSceneContent}
          onFrame={onFrame}
          onReady={onReady}
          background={0x0a0a0f}
          cameraPosition={[0, 0, 5]}
        />

        {/* Overlay UI */}
        <div className="webgpu-overlay">
          <div className="stats-panel">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
              <dt>FPS</dt>
              <dd>{fps}</dd>
              <dt>Renderer</dt>
              <dd>{isWebGPU === null ? "..." : isWebGPU ? "WebGPU" : "WebGL"}</dd>
            </dl>
          </div>

          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-center text-sm text-muted-foreground">
              WebGPU Three.js with TSL Node Materials
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
