/**
 * Full pump + pipeline 3D view. Pump with inlet/outlet piping, base, and live-data colors.
 */
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const PIPE_COLOR = '#64748b';
const PIPE_METAL = 0.5;
const PIPE_ROUGH = 0.5;
const PIPE_R = 0.14;

function getHealthColor(healthScore) {
  const s = Number(healthScore) ?? 85;
  if (s >= 80) return '#22c55e';
  if (s >= 60) return '#eab308';
  if (s >= 40) return '#f97316';
  return '#ef4444';
}

function getTempColor(temp) {
  const t = Number(temp) ?? 65;
  if (t <= 50) return '#22c55e';
  if (t <= 70) return '#eab308';
  return '#ef4444';
}

function getVibrationColor(vib) {
  const v = Number(vib) ?? 2.5;
  if (v <= 2) return '#22c55e';
  if (v <= 4) return '#eab308';
  return '#ef4444';
}

function PipeSegment({ position, rotation, length, radius = PIPE_R }) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <cylinderGeometry args={[radius, radius, length, 16]} />
      <meshStandardMaterial color={PIPE_COLOR} metalness={PIPE_METAL} roughness={PIPE_ROUGH} />
    </mesh>
  );
}

export default function PumpModel({ realtime = {}, overview = {} }) {
  const impellerRef = useRef(null);
  const healthScore = overview?.health_score ?? overview?.health_index ?? realtime?.health_index ?? 85;
  const bearingTemp = realtime?.bearing_temp ?? realtime?.bearing_temp_c ?? 65;
  const vibration = realtime?.vibration ?? realtime?.vibration_mm_s ?? 2.5;
  const rpm = Number(realtime?.rpm) ?? 1450;

  const casingColor = getHealthColor(healthScore);
  const bearingColor = getTempColor(bearingTemp);
  const sealColor = getVibrationColor(vibration);

  useFrame((_, delta) => {
    if (impellerRef.current && rpm > 0) {
      impellerRef.current.rotation.y += delta * (rpm / 60) * 2 * Math.PI;
    }
  });

  return (
    <group position={[0, 0, 0]} scale={1.2}>
      {/* ========== Base / skid ========== */}
      <mesh position={[0, 0.08, -0.2]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.12, 1.4]} />
        <meshStandardMaterial color="#475569" metalness={0.2} roughness={0.8} />
      </mesh>

      {/* ========== INLET PIPELINE (suction side, left) ========== */}
      <PipeSegment position={[-1.0, 0.4, 0]} rotation={[0, 0, Math.PI / 2]} length={0.5} />
      <PipeSegment position={[-1.25, 0.4, -0.25]} rotation={[0, 0, Math.PI / 2]} length={0.3} />
      <group position={[-1.4, 0.4, -0.25]} rotation={[0, 0, Math.PI / 2]}>
        <mesh castShadow>
          <cylinderGeometry args={[PIPE_R * 1.3, PIPE_R * 1.3, 0.12, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>
      <PipeSegment position={[-1.4, 0.25, -0.25]} rotation={[Math.PI / 2, 0, 0]} length={0.3} />

      {/* ========== PUMP ========== */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.55, 0.5, 32]} />
        <meshStandardMaterial color={casingColor} metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh ref={impellerRef} position={[0, 0.4, 0.25]} castShadow>
        <cylinderGeometry args={[0.2, 0.25, 0.15, 8]} />
        <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-0.5, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.2, 16]} />
        <meshStandardMaterial color={PIPE_COLOR} metalness={PIPE_METAL} roughness={PIPE_ROUGH} />
      </mesh>
      <mesh position={[0.5, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.25, 16]} />
        <meshStandardMaterial color={PIPE_COLOR} metalness={PIPE_METAL} roughness={PIPE_ROUGH} />
      </mesh>
      <mesh position={[-0.35, 0.4, -0.35]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.2, 24]} />
        <meshStandardMaterial color={bearingColor} metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.4, -0.3]} castShadow>
        <cylinderGeometry args={[0.12, 0.14, 0.15, 24]} />
        <meshStandardMaterial color={sealColor} metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.4, -0.7]} castShadow>
        <boxGeometry args={[0.4, 0.35, 0.5]} />
        <meshStandardMaterial color="#334155" metalness={0.3} roughness={0.7} />
      </mesh>

      {/* ========== OUTLET PIPELINE (discharge side, right + up) ========== */}
      <PipeSegment position={[0.85, 0.5, 0]} rotation={[0, 0, Math.PI / 2]} length={0.35} />
      <PipeSegment position={[1.05, 0.65, 0]} rotation={[Math.PI / 2, 0, 0]} length={0.3} />
      <group position={[1.05, 0.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[PIPE_R * 1.2, PIPE_R * 1.2, 0.1, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>
      <PipeSegment position={[1.25, 0.8, 0]} rotation={[0, 0, Math.PI / 2]} length={0.5} />
      <PipeSegment position={[1.5, 0.95, 0]} rotation={[Math.PI / 2, 0, 0]} length={0.3} />
    </group>
  );
}
