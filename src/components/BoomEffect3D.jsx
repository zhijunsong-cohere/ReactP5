import React, { useRef, useState, useEffect, useMemo, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Text,
  Image,
  useTexture,
  ScrollControls,
  useScroll,
  Loader,
} from "@react-three/drei";
import { MathUtils } from "three";
import * as THREE from "three";
import "./BoomEffect3D.css";

// Helper function to calculate scaled dimensions maintaining aspect ratio
const getAspectRatioScale = (
  aspectRatio,
  baseScale,
  maxWidth = 8,
  maxHeight = 8
) => {
  if (aspectRatio >= 1) {
    // Landscape or square image
    const width = Math.min(maxWidth * baseScale, maxWidth * baseScale);
    const height = width / aspectRatio;
    return [width, height, 1];
  } else {
    // Portrait image
    const height = Math.min(maxHeight * baseScale, maxHeight * baseScale);
    const width = height * aspectRatio;
    return [width, height, 1];
  }
};

// Individual 2D Section Component (using Three.js but flat)
const BoomSection2D = ({
  image,
  title,
  subtitle,
  position,
  scale,
  opacity,
  color,
  isActive,
}) => {
  const meshRef = useRef();
  const textRef = useRef();
  const imageRef = useRef();
  const [aspectRatio, setAspectRatio] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Load texture and calculate aspect ratio
  const texture = useTexture(image);

  useEffect(() => {
    if (texture && texture.image) {
      try {
        const width = texture.image.naturalWidth || texture.image.width || 1;
        const height = texture.image.naturalHeight || texture.image.height || 1;
        const ratio = width / height;
        setAspectRatio(isNaN(ratio) ? 1 : ratio);
        setImageLoaded(true);
      } catch (error) {
        console.warn("Error calculating aspect ratio for image:", image, error);
        setAspectRatio(1); // Fallback to square aspect ratio
        setImageLoaded(true);
      }
    }
  }, [texture, image]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Keep position fixed to 2D plane (no floating or rotation)
      meshRef.current.position.set(position[0], position[1], 0);
    }

    if (imageRef.current && imageLoaded) {
      // Scale and opacity animations (2D style) with aspect ratio maintained
      const [targetScaleX, targetScaleY] = getAspectRatioScale(
        aspectRatio,
        scale
      );

      imageRef.current.scale.x = MathUtils.lerp(
        imageRef.current.scale.x,
        targetScaleX,
        0.1
      );
      imageRef.current.scale.y = MathUtils.lerp(
        imageRef.current.scale.y,
        targetScaleY,
        0.1
      );
      imageRef.current.scale.z = 1;

      imageRef.current.material.opacity = MathUtils.lerp(
        imageRef.current.material.opacity,
        opacity,
        0.1
      );
    }
  });

  return (
    <group ref={meshRef} position={[0, 0, 0]}>
      {/* Background circle for loading state */}
      {!imageLoaded && (
        <mesh position={[0, 0, -0.1]}>
          <circleGeometry args={[2 * scale, 32]} />
          <meshBasicMaterial
            color={color || "#fff3f3ff"}
            transparent
            opacity={opacity * 0.3}
          />
        </mesh>
      )}

      {/* Image Plane (flat, no depth) with aspect ratio maintained */}
      <Image
        ref={imageRef}
        url={image}
        scale={
          imageLoaded
            ? getAspectRatioScale(aspectRatio, scale)
            : [4 * scale, 3 * scale, 1]
        }
        transparent
        opacity={imageLoaded ? opacity : 0}
        position={[0, 0, 0]}
      />

      {/* 2D Text Overlay */}
      {isActive && (
        <group position={[0, -2.5, 0.1]}>
          <Text
            ref={textRef}
            fontSize={0.5}
            color="white"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="black"
          >
            {title}
          </Text>
          <Text
            fontSize={0.3}
            color="#cccccc"
            anchorX="center"
            anchorY="middle"
            position={[0, -0.8, 0]}
          >
            {subtitle}
          </Text>
        </group>
      )}
    </group>
  );
};

// Simple 2D Background
const Background2D = () => {
  return (
    <group>
      {/* Gradient background plane */}
      <mesh position={[0, 0, -10]} rotation={[0, 0, 0]}></mesh>
    </group>
  );
};

// Simple 2D Particle System
const Particles2D = () => {
  const particlesRef = useRef();
  const particleCount = 50;

  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Constrain particles to 2D plane
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 2] = 0; // Keep on same Z plane

      colors[i * 3] = 1;
      colors[i * 3 + 1] = 1;
      colors[i * 3 + 2] = 1;
    }

    return { positions, colors };
  }, []);

  useFrame((state) => {
    // No rotation for 2D feeling
    if (particlesRef.current) {
      // Just gentle floating motion
      particlesRef.current.position.y =
        Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={particles.positions}
          count={particleCount}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          array={particles.colors}
          count={particleCount}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        transparent
        opacity={0.6}
        vertexColors
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Main Scene Component
const BoomScene = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const scroll = useScroll();

  const sections = [
    {
      id: 1,
      image: "/10.jpg",
      title: "Dawn Breaks",
      subtitle: "The beginning of something beautiful",
      color: "#ff6b6b",
    },
    {
      id: 2,
      image: "/06.jpg",
      title: "Morning Light",
      subtitle: "Illuminating new possibilities",
      color: "#4ecdc4",
    },
    {
      id: 3,
      image: "/13.jpg",
      title: "Golden Hour",
      subtitle: "Where magic happens",
      color: "#45b7d1",
    },
    {
      id: 4,
      image: "/16.jpg",
      title: "Full Bloom",
      subtitle: "Achievement unlocked",
      color: "#96ceb4",
    },
  ];

  // Easing functions
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOutCubic = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  useFrame(() => {
    const progress = scroll.offset;
    setScrollProgress(progress);
  });

  const getCurrentSection = () => {
    const sectionProgress = scrollProgress * sections.length;
    return Math.min(Math.floor(sectionProgress), sections.length - 1);
  };

  const getSectionProps = (index) => {
    const currentSection = getCurrentSection();
    const sectionProgress = (scrollProgress * sections.length) % 1;
    const easedProgress = easeOutCubic(sectionProgress);

    let scale = 0.2;
    let opacity = 0;
    let position = [0, 0, 0]; // Keep all on same Z plane for 2D feeling
    let isActive = false;

    if (index === currentSection) {
      // Current section - grows from center (2D style)
      scale = 0.3 + easedProgress * 0.7;
      opacity = 0.4 + easedProgress * 0.6;
      position = [0, 0, 0]; // Stay centered
      isActive = true;
    } else if (index < currentSection) {
      // Previous sections - fade and shrink but stay in place
      scale = 1.0 - (currentSection - index) * 0.15;
      opacity = 0.6 - (currentSection - index) * 0.3;
      position = [0, 0, 0]; // Keep centered for layered 2D effect
    } else if (index === currentSection + 1) {
      // Next section - slight preview (2D style)
      scale = 0.2 + Math.max(0, sectionProgress - 0.7) * 0.1;
      opacity = Math.max(0, sectionProgress - 0.7) * 0.3;
      position = [0, 0, 0]; // Keep centered
    }

    return {
      scale,
      opacity,
      position,
      isActive,
    };
  };

  return (
    <>
      {/* Simple 2D lighting */}
      <ambientLight intensity={0.8} />

      {/* Boom Sections */}
      {sections.map((section, index) => {
        const props = getSectionProps(index);
        return (
          <BoomSection2D
            key={section.id}
            image={section.image}
            title={section.title}
            subtitle={section.subtitle}
            color={section.color}
            {...props}
          />
        );
      })}

      {/* Interactive Controls */}
    </>
  );
};

// Progress Indicator Component
const ProgressIndicator = ({ progress, sections }) => {
  const getCurrentSection = () => {
    const sectionProgress = progress * sections.length;
    return Math.min(Math.floor(sectionProgress), sections.length - 1);
  };

  return (
    <div className="boom-progress-3d">
      <div
        className="boom-progress-bar-3d"
        style={{ width: `${progress * 100}%` }}
      />
      <div className="boom-indicators-3d">
        {sections.map((_, index) => (
          <div
            key={index}
            className={`boom-indicator-3d ${
              getCurrentSection() === index ? "active" : ""
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// Loading Component
const Loading2D = () => (
  <div className="boom-loading-3d">
    <div className="loader-3d"></div>
    <div className="loading-text-3d">Loading Experience...</div>
  </div>
);

// Main BoomEffect3D Component
const BoomEffect3D = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const sections = [
    {
      id: 1,
      image: "/10.jpg",
      title: "Dawn Breaks",
      subtitle: "The beginning",
    },
    {
      id: 2,
      image: "/06.jpg",
      title: "Morning Light",
      subtitle: "New possibilities",
    },
    {
      id: 3,
      image: "/13.jpg",
      title: "Golden Hour",
      subtitle: "Where magic happens",
    },
    {
      id: 4,
      image: "/16.jpg",
      title: "Full Bloom",
      subtitle: "Achievement unlocked",
    },
  ];

  useEffect(() => {
    // Simulate loading time for 3D assets
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="boom-container-3d">
      {/* Loading Screen */}
      {isLoading && <Loading2D />}

      {/* 2D Canvas (using Three.js) */}
      <Canvas
        className="boom-canvas-3d"
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
        orthographic={false}
      >
        <Suspense fallback={null}>
          <ScrollControls pages={sections.length + 1} damping={0.1}>
            <BoomScene />
          </ScrollControls>
        </Suspense>
      </Canvas>

      {/* Custom Loader */}
      <Loader />

      {/* UI Overlays */}
      <ProgressIndicator progress={scrollProgress} sections={sections} />

      {/* Scroll Instruction */}
      <div className="scroll-instruction-3d">
        <span>Scroll to explore</span>
        <div className="scroll-arrow-3d">↓</div>
      </div>
    </div>
  );
};

export default BoomEffect3D;
