import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

interface PhoneProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  color?: string
  label?: string
  delay?: number
}

export function Phone({ position = [0, 0, 0], rotation = [0, 0, 0], color = '#ff0000', label = 'HabitX', delay = 0 }: PhoneProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const screenRef = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.getElapsedTime() + delay
      // Gentle subtle floating only - removed complex rotation
      groupRef.current.position.y = position[1] + Math.sin(t / 2) * 0.05
    }
  })

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Phone Body - Sleek black glass look */}
      <RoundedBox args={[1.2, 2.4, 0.08]} radius={0.12} smoothness={8} castShadow receiveShadow>
        <meshPhysicalMaterial 
            color="#050505" 
            roughness={0.1} 
            metalness={0.9} 
            clearcoat={1}
            clearcoatRoughness={0.1}
        />
      </RoundedBox>

      {/* Side Buttons (Volume/Power) - purely aesthetic details */}
      <mesh position={[0.61, 0.5, 0]}>
        <boxGeometry args={[0.01, 0.15, 0.04]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0.61, 0.2, 0]}>
        <boxGeometry args={[0.01, 0.15, 0.04]} />
        <meshStandardMaterial color="#222" />
      </mesh>

      {/* Screen - Bezel-less look */}
      <mesh ref={screenRef} position={[0, 0, 0.045]}>
        <planeGeometry args={[1.12, 2.32]} />
        <meshBasicMaterial color={color} toneMapped={false} />
        
        <Html 
          transform 
          position={[0, 0, 0.01]} 
          scale={0.15} 
          occlude 
          style={{ 
            pointerEvents: 'none',
            userSelect: 'none'
          }}
        >
          <div className="w-48 h-96 flex flex-col items-center justify-center text-center p-4">
            <h2 className="text-white text-3xl font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-tight">
              {label}
            </h2>
            <div className="mt-4 w-8 h-1 bg-white/40 rounded-full"></div>
          </div>
        </Html>
      </mesh>
      
      {/* Screen reflection/glass layer */}
       <mesh position={[0, 0, 0.05]} rotation={[0,0,0]}>
         <planeGeometry args={[1.12, 2.32]} />
         <meshPhysicalMaterial 
            color="#ffffff" 
            roughness={0}
            metalness={0}
            transmission={0.9}
            transparent
            opacity={0.1} 
         />
      </mesh>
    </group>
  )
}
