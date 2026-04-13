import React, { useEffect, useRef, useState } from 'react';

// ASCII art barn variants - each is a unique barn style
const BARN_VARIANTS = {
  classic: {
    name: 'Classic Barn',
    paths: `
      M 40 80 L 40 35 L 20 35 L 40 10 L 60 35 L 40 35
      M 40 10 L 40 5
      M 30 80 L 30 60 Q 40 55 50 60 L 50 80
      M 35 60 L 35 80
      M 45 60 L 45 80
      M 40 65 L 40 75
      M 25 35 L 25 25
      M 55 35 L 55 25
    `
  },
  silo: {
    name: 'Barn with Silo',
    paths: `
      M 35 80 L 35 35 L 15 35 L 35 10 L 55 35 L 35 35
      M 55 35 L 55 80
      M 65 80 L 65 30 Q 65 20 75 20 Q 85 20 85 30 L 85 80
      M 65 30 L 85 30
      M 75 20 L 75 15
      M 20 35 L 20 25
      M 50 35 L 50 25
    `
  },
  lean: {
    name: 'Lean-to Barn',
    paths: `
      M 30 80 L 30 40 L 15 50 L 15 80
      M 30 40 L 50 30 L 70 40
      M 50 30 L 50 80
      M 70 40 L 70 80
      M 30 40 L 70 40
      M 40 80 L 40 60 Q 50 55 60 60 L 60 80
      M 45 60 L 45 80
      M 55 60 L 55 80
    `
  },
  dutch: {
    name: 'Dutch Barn',
    paths: `
      M 50 80 L 50 40
      M 20 80 L 20 50 L 50 30 L 80 50 L 80 80
      M 20 50 L 80 50
      M 30 80 L 30 60 Q 40 55 50 60 Q 60 55 70 60 L 70 80
      M 38 60 L 38 80
      M 50 60 L 50 80
      M 62 60 L 62 80
      M 35 30 L 35 20
      M 65 30 L 65 20
    `
  },
  round: {
    name: 'Round Barn',
    paths: `
      M 50 80 L 50 35
      M 25 70 Q 20 50 25 30 Q 50 15 75 30 Q 80 50 75 70
      M 25 70 L 75 70
      M 30 35 Q 50 25 70 35
      M 35 80 L 35 60 Q 50 55 65 60 L 65 80
      M 42 60 L 42 80
      M 58 60 L 58 80
      M 50 65 L 50 75
      M 50 15 L 50 10
    `
  },
  bank: {
    name: 'Bank Barn',
    paths: `
      M 20 80 L 20 50 L 50 35 L 80 50 L 80 80
      M 20 50 L 80 50
      M 50 35 L 50 80
      M 30 80 L 30 65 L 45 65 L 45 80
      M 55 65 L 70 65 L 70 80
      M 30 50 L 30 40
      M 70 50 L 70 40
      M 40 35 L 40 25
      M 60 35 L 60 25
    `
  },
  crib: {
    name: 'Corn Crib Barn',
    paths: `
      M 30 80 L 30 35 L 70 35 L 70 80
      M 30 35 L 30 25 L 70 25 L 70 35
      M 30 25 L 35 15 L 65 15 L 70 25
      M 35 45 L 65 45
      M 35 55 L 65 55
      M 35 65 L 65 65
      M 45 35 L 45 80
      M 55 35 L 55 80
    `
  },
  pole: {
    name: 'Pole Barn',
    paths: `
      M 25 80 L 25 40 L 50 25 L 75 40 L 75 80
      M 25 40 L 75 40
      M 35 80 L 35 55 Q 50 50 65 55 L 65 80
      M 42 55 L 42 80
      M 58 55 L 58 80
      M 50 60 L 50 75
      M 30 40 L 30 30
      M 70 40 L 70 30
      M 50 25 L 50 15
    `
  },
  gambrel: {
    name: 'Gambrel Barn',
    paths: `
      M 30 80 L 30 45 L 15 45 L 30 20 L 50 10 L 70 20 L 85 45 L 70 45 L 70 80
      M 30 45 L 70 45
      M 40 80 L 40 60 Q 50 55 60 60 L 60 80
      M 47 60 L 47 80
      M 53 60 L 53 80
      M 35 20 L 35 10
      M 65 20 L 65 10
    `
  },
  monitor: {
    name: 'Monitor Barn',
    paths: `
      M 30 80 L 30 45 L 20 45 L 30 25 L 50 20 L 70 25 L 80 45 L 70 45 L 70 80
      M 30 45 L 70 45
      M 50 20 L 50 45
      M 40 80 L 40 60 L 60 60 L 60 80
      M 45 60 L 45 80
      M 55 60 L 55 80
      M 25 45 L 25 35
      M 75 45 L 75 35
    `
  }
};

function BarnAnimation({ variant = 'classic', size = 'large' }) {
  const svgRef = useRef();
  const [currentVariant, setCurrentVariant] = useState(variant);
  const [rotationAngle, setRotationAngle] = useState(0);
  
  // Slow drift animation using requestAnimationFrame
  useEffect(() => {
    let startTime = null;
    const duration = 20000; // 20 seconds for full cycle
    
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = (elapsed % duration) / duration;
      
      // Create smooth drift: translate and slight rotate
      const angle = progress * Math.PI * 2;
      const x = Math.sin(angle) * 2; // 2px drift
      const y = Math.cos(angle * 0.7) * 1.5; // 1.5px drift
      const rot = Math.sin(angle * 0.5) * 0.5; // 0.5 degree rotation
      
      if (svgRef.current) {
        svgRef.current.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`;
      }
      
      requestAnimationFrame(animate);
    };
    
    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);
  
  // Update variant when prop changes
  useEffect(() => {
    setCurrentVariant(variant);
  }, [variant]);
  
  const barnData = BARN_VARIANTS[currentVariant] || BARN_VARIANTS.classic;
  
  const dimensions = size === 'large' ? 
    { width: '100vw', height: '100vh' } : 
    { width: '100px', height: '100px' };

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      style={{
        position: size === 'large' ? 'absolute' : 'relative',
        width: dimensions.width,
        height: dimensions.height,
        opacity: 0.12,
        top: 0,
        left: 0,
        pointerEvents: 'none',
        willChange: 'transform'
      }}
    >
      <defs>
        <filter id={`glow-${currentVariant}`}>
          <feGaussianBlur stdDeviation="0.3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <linearGradient id={`barnGradient-${currentVariant}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f4f0e8" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#f4f0e8" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      
      {/* Background glow circle */}
      <circle
        cx="50"
        cy="50"
        r="35"
        fill={`url(#barnGradient-${currentVariant})`}
        opacity="0.5"
      />
      
      {/* Main barn path */}
      <path
        d={barnData.paths}
        fill="none"
        stroke="#f4f0e8"
        strokeWidth="0.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#glow-${currentVariant})`}
      />
      
      {/* Secondary detail lines */}
      <path
        d={barnData.paths}
        fill="none"
        stroke="#f4f0e8"
        strokeWidth="0.15"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
        transform="scale(0.98) translate(1, 1)"
      />
    </svg>
  );
}

export default BarnAnimation;
export { BARN_VARIANTS };
