/**
 * 3D scene: lights, controls, pump model. Used inside Canvas.
 */
import React, { Suspense } from 'react';
import { OrbitControls } from '@react-three/drei';
import PumpModel from './PumpModel';

function FallbackPump() {
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#64748b" wireframe />
    </mesh>
  );
}

export default function PumpScene({ realtime, overview }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-5, 5, -5]} intensity={0.4} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={18}
        autoRotate={false}
      />
      <Suspense fallback={<FallbackPump />}>
        <PumpModel realtime={realtime || {}} overview={overview || {}} />
      </Suspense>
    </>
  );
}
