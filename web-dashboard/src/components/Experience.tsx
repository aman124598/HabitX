import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, Sparkles } from '@react-three/drei'
import { Download, Github, Zap, Shield, Sparkles as SparkleIcon, CheckCircle, BarChart3, Trophy } from 'lucide-react'
import * as THREE from 'three'

function BackgroundParticles() {
  return (
    <group>
      <Sparkles count={80} scale={15} size={3} speed={0.4} opacity={0.5} color="#ef4444" />
      <Stars radius={50} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
    </group>
  )
}

function Rig() {
    useFrame((state) => {
        state.camera.position.lerp(new THREE.Vector3(0, 0, 6 + state.pointer.y / 2), 0.05)
        state.camera.rotation.set(0, 0, 0)
    })
    return null
}

export default function Experience() {
  const releaseUrl = "https://github.com/aman124598/HabitX/releases/download/v1.0.2/HabitX.v1.0.2.apk"
  const releaseVersion = "v1.0.2"

  return (
    <div className="w-full min-h-screen bg-black text-white selection:bg-red-500 selection:text-white font-sans">
      
      {/* Hero Section with 3D Background */}
      <section className="relative w-full h-screen flex flex-col justify-center overflow-hidden">
        
        {/* 3D Scene - Absolute Background */}
        <div className="absolute inset-0 z-0">
          <Canvas shadows camera={{ position: [0, 0, 6], fov: 35 }}>
            <color attach="background" args={['#050505']} />
            <fog attach="fog" args={['#050505', 5, 20]} />
            
            <ambientLight intensity={1} />
            <BackgroundParticles />
            <Rig />
          </Canvas>
        </div>

        {/* Hero Overlay Content */}
        <div className="relative z-10 container mx-auto px-6 text-center pointer-events-none flex flex-col items-center justify-center h-full">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/80 border border-white/10 text-red-400 text-sm font-medium mb-8 backdrop-blur-md animate-fade-in-up pointer-events-auto shadow-lg shadow-red-900/10">
                <SparkleIcon size={14} className="animate-pulse" />
                <span>Habit Tracking Reimagined</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-tight drop-shadow-2xl">
                Habit<span className="text-red-600">X</span>
            </h1>
            
            <p className="text-gray-300 max-w-2xl mx-auto text-lg md:text-xl mb-12 leading-relaxed font-light mix-blend-screen">
                The open-source habit tracker that respects your privacy and helps you build consistency through beautiful data visualization.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 items-center justify-center pointer-events-auto">
                <a 
                href="#download" 
                className="group flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-full transition-all shadow-[0_0_30px_rgba(220,38,38,0.3)] hover:shadow-[0_0_50px_rgba(220,38,38,0.5)] hover:scale-105"
                >
                <Download size={22} className="group-hover:translate-y-1 transition-transform" />
                <span>Get App Free</span>
                </a>
                <a 
                    href="https://github.com/aman124598/HabitX"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-zinc-900/50 hover:bg-zinc-800 border border-white/10 text-white font-semibold py-4 px-8 rounded-full transition-all backdrop-blur-md"
                >
                    <Github size={20} />
                    <span>GitHub</span>
                </a>
            </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50 z-10 pointer-events-none">
            <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center pt-2">
                <div className="w-1 h-2 bg-white rounded-full" />
            </div>
        </div>
      </section>

      {/* Features Section - Clean Dark UI */}
      <section className="py-32 bg-zinc-950 relative z-10">
           <div className="container mx-auto px-6">
                <div className="text-center mb-20">
                    <h2 className="text-4xl font-bold mb-4">Why HabitX?</h2>
                    <p className="text-gray-400">Everything you need to build better habits, nothing you don't.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {[
                        { 
                            icon: Zap, 
                            title: "Zero Latency", 
                            desc: "Built for speed. No loading screens, no sync delays. Your habits, instantly.",
                            color: "text-yellow-400"
                        },
                        { 
                            icon: Shield, 
                            title: "Privacy Focused", 
                            desc: "Your data never leaves your device unless you backup. No tracking, no ads.",
                            color: "text-green-400"
                        },
                        { 
                            icon: BarChart3, 
                            title: "Visual Analytics", 
                            desc: "Beautiful heatmaps and trend lines to visualize your consistency over time.",
                            color: "text-blue-400"
                        },
                        {
                            icon: CheckCircle,
                            title: "Simple & Clean",
                            desc: "A distraction-free interface designed to help you focus on what matters.",
                            color: "text-red-400"
                        },
                        {
                             icon: Trophy,
                             title: "Gamification",
                             desc: "Earn streaks and levels as you build consistency. Make self-improvement fun.",
                             color: "text-purple-400"
                        },
                        {
                             icon: Github,
                             title: "Open Source",
                             desc: "Transparent code. Contribute, fork, or build your own features.",
                             color: "text-white"
                        }
                    ].map((feature, i) => (
                        <div key={i} className="group p-8 rounded-2xl bg-zinc-900/50 border border-white/5 hover:bg-zinc-900 hover:border-red-500/20 transition-all duration-300 hover:-translate-y-1">
                            <div className={`mb-6 p-4 rounded-xl bg-zinc-950 w-fit ${feature.color} group-hover:scale-110 transition-transform`}>
                                <feature.icon size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                            <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
           </div>
      </section>

      {/* Download / CTA Section */}
      <section id="download" className="py-32 bg-black relative overflow-hidden">
          {/* Decorative gradients */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full bg-red-900/20 blur-[100px] pointer-events-none" />
          
          <div className="container mx-auto px-6 relative z-10 text-center">
             <h3 className="text-4xl md:text-5xl font-bold mb-8 tracking-tight">Ready to start?</h3>
             <p className="text-gray-400 mb-12 max-w-xl mx-auto text-lg">
               Join thousands of users building better habits today. Download the latest version directly from GitHub.
             </p>
             
             <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 max-w-md mx-auto shadow-2xl backdrop-blur-xl">
                <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                         <span className="font-bold text-xl">H</span>
                      </div>
                      <div className="text-left">
                         <div className="font-bold text-white text-lg">HabitX</div>
                         <div className="text-sm text-gray-500 font-mono">{releaseVersion}</div>
                      </div>
                   </div>
                   <div className="bg-zinc-800 px-3 py-1 rounded-full text-xs text-gray-400 font-mono border border-white/5">
                      APK
                   </div>
                </div>
                
                <a 
                  href={releaseUrl}
                  className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-200 text-black font-bold py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl"
                >
                   <Download size={20} />
                   Download Now
                </a>
                
                <p className="mt-6 text-xs text-zinc-500">
                   Requires Android 8.0 or later • {releaseVersion} • Open Source
                </p>
             </div>
          </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-12 border-t border-white/5 bg-zinc-950">
           <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
               <div className="flex items-center gap-2">
                   <span className="font-bold text-xl tracking-tighter">Habit<span className="text-red-600">X</span></span>
               </div>
               <p className="text-gray-600 text-sm">© {new Date().getFullYear()} HabitX. Built with ❤️ by Aman.</p>
               <div className="flex gap-6">
                   <a href="https://github.com/aman124598/HabitX" className="text-gray-500 hover:text-white transition-colors">
                       <Github size={20} />
                   </a>
               </div>
           </div>
      </footer>
    </div>
  )
}
