import React, { useRef, useState, useEffect, useMemo, Suspense } from "react";
import { Canvas, useThree, useFrame, useLoader } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import "./GridPetsCanvas.css";

// Grid component
function Grid() {
  const meshRef = useRef();
  const { viewport } = useThree();

  useFrame((state) => {
    // Subtle movement based on time
    if (meshRef.current) {
      meshRef.current.position.z =
        Math.sin(state.clock.elapsedTime * 0.2) * 0.5;
    }
  });

  // Create grid geometry - sized for sparse 8x5 grid with larger images
  const gridSize = 600;
  const divisions = 120;
  const gridHelper = new THREE.GridHelper(
    gridSize,
    divisions,
    0x9b7653,
    0x9b7653
  );
  gridHelper.rotation.x = Math.PI / 2;
  gridHelper.material.opacity = 0.2;
  gridHelper.material.transparent = true;

  return (
    <group ref={meshRef}>
      <primitive object={gridHelper} />
    </group>
  );
}

// Create hatch pattern texture for shadow
function createHatchTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");

  // Dark gray background
  ctx.fillStyle = "#3a3a3a";
  ctx.fillRect(0, 0, 64, 64);

  // Draw hatch lines
  ctx.strokeStyle = "#2a2a2a";
  ctx.lineWidth = 1.5;

  // Diagonal lines (/)
  for (let i = -64; i < 128; i += 8) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 64, 64);
    ctx.stroke();
  }

  // Diagonal lines (\)
  for (let i = -64; i < 128; i += 8) {
    ctx.beginPath();
    ctx.moveTo(i, 64);
    ctx.lineTo(i + 64, 0);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

// Create rounded rectangle shape
function createRoundedRectShape(width, height, radius) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;

  shape.moveTo(x, y + radius);
  shape.lineTo(x, y + height - radius);
  shape.quadraticCurveTo(x, y + height, x + radius, y + height);
  shape.lineTo(x + width - radius, y + height);
  shape.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
  shape.lineTo(x + width, y + radius);
  shape.quadraticCurveTo(x + width, y, x + width - radius, y);
  shape.lineTo(x + radius, y);
  shape.quadraticCurveTo(x, y, x, y + radius);

  return shape;
}

// Pet Image Component (Fixed Grid Position) with pre-loaded texture and aspect ratio
function PetImage({
  texture,
  position,
  index,
  groupPosition,
  mousePosition,
  imagePath,
  animationFrames,
}) {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  const { gl, size } = useThree();

  // Animation state for stop motion
  const animationState = useRef({
    isPlaying: false,
    currentFrame: 0,
    hasPlayed: false,
  });
  const [currentTexture, setCurrentTexture] = useState(texture);

  // Local mouse position on the card (0-1 normalized)
  const localMouse = useRef({ x: 0.5, y: 0.5 });
  const glareMaterial = useRef();

  // Physics state for spring animation
  const physics = useRef({
    posX: position[0],
    posY: position[1],
    velX: 0,
    velY: 0,
  });

  // Flicker effect state
  const flickerState = useRef({
    hasFlickered: false,
    progress: 0,
  });

  // Create hatch texture for shadow (memoized)
  const hatchTexture = useMemo(() => createHatchTexture(), []);

  // Handle stop motion animation for hover
  useEffect(() => {
    if (!animationFrames || animationFrames.length === 0) return;

    console.log(
      "Animation component - hovered:",
      hovered,
      "animationFrames:",
      animationFrames.length
    );

    if (hovered && !animationState.current.hasPlayed) {
      console.log(
        "Starting animation for image:",
        imagePath,
        "Total frames:",
        animationFrames.length
      );
      // Start animation
      animationState.current.isPlaying = true;
      animationState.current.currentFrame = 1; // Start at frame 1 (frame 0 is already displayed)

      // Set first frame immediately
      setCurrentTexture(animationFrames[1]);

      // Play through remaining frames
      const frameInterval = setInterval(() => {
        animationState.current.currentFrame += 1;
        console.log(
          "Animation frame:",
          animationState.current.currentFrame,
          "of",
          animationFrames.length
        );

        if (animationState.current.currentFrame < animationFrames.length) {
          setCurrentTexture(
            animationFrames[animationState.current.currentFrame]
          );
        } else {
          // Animation complete
          console.log("Animation complete");
          clearInterval(frameInterval);
          animationState.current.isPlaying = false;
          animationState.current.hasPlayed = true;
        }
      }, 100); // 100ms per frame (10fps)

      return () => clearInterval(frameInterval);
    } else if (!hovered) {
      // Reset when hover ends
      animationState.current.hasPlayed = false;
      animationState.current.currentFrame = 0;
      setCurrentTexture(texture);
    }
  }, [hovered, animationFrames, texture, imagePath]);

  // Colorful frame palette - pastel colors
  const frameColors = [
    "#E8A87C", // Peachy orange
    "#C1D5A4", // Sage green
    "#D4BFD9", // Lavender
    "#B8D4D4", // Mint
    "#E5C9A8", // Tan/beige
    "#F4C2C2", // Rose pink
    "#A8C5DD", // Sky blue
    "#F5D9B8", // Apricot
    "#C9B8D4", // Purple
    "#B8E0D4", // Seafoam
    "#E8C9A8", // Warm tan
    "#D4A8B8", // Dusty rose
    "#A8D4B8", // Mint green
    "#E8B8C9", // Pink
    "#C9D4A8", // Yellow-green
  ];

  // Assign color based on index
  const frameColor = frameColors[index % frameColors.length];

  // Calculate aspect ratio from texture
  const aspectRatio = texture.image
    ? texture.image.width / texture.image.height
    : 1;
  const width = 30;
  const height = width / aspectRatio;
  const borderWidth = 2.5; // Thicker border for colorful frame
  const shadowOffset = 0.8; // Shadow distance
  const borderRadius = 20; // Rounded corner radius

  // Create rounded shapes for each layer
  const shadowShape = useMemo(
    () =>
      createRoundedRectShape(
        width + borderWidth * 2,
        height + borderWidth * 2,
        borderRadius
      ),
    [width, height, borderWidth, borderRadius]
  );
  const frameShape = useMemo(
    () =>
      createRoundedRectShape(
        width + borderWidth * 2,
        height + borderWidth * 2,
        borderRadius
      ),
    [width, height, borderWidth, borderRadius]
  );
  const imageShape = useMemo(
    () => createRoundedRectShape(width, height, borderRadius * 0.8),
    [width, height, borderRadius]
  );

  useFrame((state) => {
    if (!groupRef.current) return;

    // Spring physics constants
    const springStrength = 0.92; // How quickly it catches up
    const damping = 0.2; // Bounciness (lower = more bouncy)

    // All images move uniformly with the canvas (no parallax speed variation)
    const targetX = position[0] + groupPosition[0];
    const targetY = position[1] + groupPosition[1];

    // Apply spring forces
    const deltaX = targetX - physics.current.posX;
    const deltaY = targetY - physics.current.posY;

    // Add spring force to velocity
    physics.current.velX += deltaX * springStrength;
    physics.current.velY += deltaY * springStrength;

    // Apply damping
    physics.current.velX *= damping;
    physics.current.velY *= damping;

    // Update position with velocity
    physics.current.posX += physics.current.velX;
    physics.current.posY += physics.current.velY;

    // Apply position to mesh with floating animation
    groupRef.current.position.x = physics.current.posX;
    groupRef.current.position.y =
      physics.current.posY +
      Math.sin(state.clock.elapsedTime + index * 0.5) * 0.08;

    // Calculate rotation amount for z-offset
    let rotationAmount = 0;

    // Quick flicker on first hover, then mouse-controlled rotation
    if (hovered && !flickerState.current.hasFlickered) {
      // Quick flicker once
      flickerState.current.progress += 0.15;

      if (flickerState.current.progress <= 1) {
        // Single sine wave for one flicker
        const flickerAngle =
          Math.sin(flickerState.current.progress * Math.PI * 2) * 0.2;
        groupRef.current.rotation.y = flickerAngle;
        groupRef.current.rotation.x = flickerAngle * 0.4;
        rotationAmount = Math.abs(flickerAngle);
      } else {
        flickerState.current.hasFlickered = true;
      }
    } else if (hovered && flickerState.current.hasFlickered && mousePosition) {
      // Mouse-based rotation after flicker
      const targetRotationY = mousePosition.x * 0.3;
      const targetRotationX = -mousePosition.y * 0.2;

      const currentY = groupRef.current.rotation.y;
      const currentX = groupRef.current.rotation.x;
      groupRef.current.rotation.y += (targetRotationY - currentY) * 0.1;
      groupRef.current.rotation.x += (targetRotationX - currentX) * 0.1;

      rotationAmount = Math.sqrt(
        groupRef.current.rotation.y ** 2 + groupRef.current.rotation.x ** 2
      );
    } else if (!hovered) {
      // Reset when not hovering
      flickerState.current.hasFlickered = false;
      flickerState.current.progress = 0;

      groupRef.current.rotation.y *= 0.9;
      groupRef.current.rotation.x *= 0.9;
      rotationAmount = Math.sqrt(
        groupRef.current.rotation.y ** 2 + groupRef.current.rotation.x ** 2
      );
    }

    // Elevate on hover and during rotation to prevent penetration
    const baseZ = position[2];
    const hoverLift = hovered ? 5 : 0;
    const rotationLift = rotationAmount * 15;
    groupRef.current.position.z = baseZ + hoverLift + rotationLift;

    // Update glare effect
    if (glareMaterial.current) {
      glareMaterial.current.uniforms.mousePos.value = [
        localMouse.current.x,
        localMouse.current.y,
      ];
      glareMaterial.current.uniforms.hovered.value = hovered ? 1.0 : 0.0;
    }

    groupRef.current.rotation.z =
      Math.sin(state.clock.elapsedTime * 0.3 + index * 0.3) * 0.03;
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerEnter={(e) => {
        setHovered(true);
        gl.domElement.style.cursor = "pointer";
      }}
      onPointerMove={(e) => {
        // Get intersection point and calculate UV coordinates
        if (e.uv) {
          localMouse.current = {
            x: e.uv.x,
            y: 1.0 - e.uv.y, // Flip Y for correct orientation
          };
        }
      }}
      onPointerLeave={() => {
        setHovered(false);
        gl.domElement.style.cursor = "grab";
        localMouse.current = { x: 0.5, y: 0.5 };
      }}
    >
      {/* Shadow layer with hatch pattern */}
      <mesh position={[shadowOffset, -shadowOffset, -0.3]}>
        <planeGeometry
          args={[width + borderWidth * 2, height + borderWidth * 2]}
        />
        <meshBasicMaterial
          map={hatchTexture}
          opacity={0.4}
          transparent={true}
        />
      </mesh>

      {/* Colorful frame/border layer */}
      <mesh position={[0, 0, -0.2]}>
        <planeGeometry
          args={[width + borderWidth * 2, height + borderWidth * 2]}
          shape={frameShape}
        />
        <meshBasicMaterial color={frameColor} />
      </mesh>

      {/* Image layer */}
      <mesh position={[0, 0, -0.1]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          map={currentTexture}
          transparent={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Glare overlay effect */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[width, height]} />
        <shaderMaterial
          ref={glareMaterial}
          transparent={true}
          depthWrite={false}
          uniforms={{
            mousePos: { value: [0.5, 0.5] },
            hovered: { value: 0.0 },
          }}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform vec2 mousePos;
            uniform float hovered;
            varying vec2 vUv;
            
            void main() {
              // Calculate distance from mouse position
              vec2 toMouse = vUv - mousePos;
              float dist = length(toMouse);
              
              // Create glare effect - circular gradient centered on mouse
              float glareRadius = 0.4;
              float glareIntensity = 1.0 - smoothstep(0.0, glareRadius, dist);
              glareIntensity = pow(glareIntensity, 2.0); // Sharper falloff
              
              // Create directional light streak
              float angle = atan(toMouse.y, toMouse.x);
              float streak = abs(sin(angle * 2.0)) * 0.3;
              glareIntensity += streak * (1.0 - smoothstep(0.0, glareRadius * 0.8, dist));
              
              // White glare color
              vec3 glareColor = vec3(1.0, 1.0, 1.0);
              
              // Apply intensity and fade based on hover
              float alpha = glareIntensity * hovered * 0.6;
              
              gl_FragColor = vec4(glareColor, alpha);
            }
          `}
        />
      </mesh>
    </group>
  );
}

// Main Scene Component with Draggable Grid
function Scene({ petImages, animationImages }) {
  const groupRef = useRef();
  const gridRef = useRef();
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const currentPosition = useRef({ x: 0, y: 0 });
  const lastDragPosition = useRef({ x: 0, y: 0 });
  const mousePosition = useRef({ x: 0, y: 0 }); // Track mouse position

  const { camera, gl, size } = useThree();

  // Pre-load all textures to prevent flashing
  const textures = useLoader(THREE.TextureLoader, petImages);

  // Load animation frames for pet 17
  const animationTextures = useLoader(THREE.TextureLoader, animationImages);

  // Create sparse 8x5 grid with randomly placed images
  const gridData = useMemo(() => {
    const cols = 8;
    const rows = 5;
    const spacing = 50; // Larger spacing to prevent overlap with 20-unit wide images
    const grid = [];
    const appearanceProbability = 0.5; // 50% chance for each image to appear
    let hasAnimatedImage = false;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Randomly skip some positions to create sparse layout
        if (Math.random() > appearanceProbability) continue;

        const index = row * cols + col;
        const textureIndex = index % petImages.length; // Cycle through all images
        const imagePath = petImages[textureIndex];

        // Small random z-position for subtle depth without overlap
        const randomZ = (Math.random() - 0.5) * 2;

        // Check if this is the image that should have animation (pets/17.png)
        const hasAnimation = imagePath.includes("pets/17.png");
        if (hasAnimation) {
          hasAnimatedImage = true;
          console.log(
            "Found animated image at index:",
            index,
            "path:",
            imagePath
          );
        }

        grid.push({
          position: [
            col * spacing - (cols * spacing) / 2,
            -row * spacing + (rows * spacing) / 2,
            randomZ,
          ],
          texture: textures[textureIndex],
          index: index,
          imagePath: imagePath,
          animationFrames: hasAnimation ? animationTextures : null,
        });
      }
    }

    // Ensure at least one animated image appears in the grid
    if (!hasAnimatedImage && grid.length > 0) {
      console.log("Adding animated image to ensure it appears");
      const animatedTextureIndex = petImages.findIndex((path) =>
        path.includes("pets/17.png")
      );
      grid.push({
        position: [0, 0, 0], // Center position
        texture: textures[animatedTextureIndex],
        index: 999,
        imagePath: petImages[animatedTextureIndex],
        animationFrames: animationTextures,
      });
    }

    console.log(
      "Grid created with",
      grid.length,
      "images. Animation textures loaded:",
      animationTextures.length
    );
    return grid;
  }, [textures, petImages.length, animationTextures, petImages]);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    gl.domElement.style.cursor = "grabbing";

    dragStart.current = {
      x: (e.clientX / size.width) * 2 - 1,
      y: -(e.clientY / size.height) * 2 + 1,
    };

    dragOffset.current = {
      x: currentPosition.current.x,
      y: currentPosition.current.y,
    };

    lastDragPosition.current = {
      x: (e.clientX / size.width) * 2 - 1,
      y: -(e.clientY / size.height) * 2 + 1,
    };

    // Reset velocity when starting new drag
    velocity.current = { x: 0, y: 0 };

    // Kill any ongoing GSAP animations
    gsap.killTweensOf(currentPosition.current);
  };

  const handlePointerMove = (e) => {
    // Update mouse position (normalized to -1 to 1)
    mousePosition.current = {
      x: (e.clientX / size.width) * 2 - 1,
      y: -(e.clientY / size.height) * 2 + 1,
    };

    if (!isDragging) return;

    const currentX = (e.clientX / size.width) * 2 - 1;
    const currentY = -(e.clientY / size.height) * 2 + 1;

    // Calculate velocity for momentum
    velocity.current.x = (currentX - lastDragPosition.current.x) * 50;
    velocity.current.y = (currentY - lastDragPosition.current.y) * 50;

    lastDragPosition.current = { x: currentX, y: currentY };

    const deltaX = (currentX - dragStart.current.x) * 50;
    const deltaY = (currentY - dragStart.current.y) * 50;

    const newX = dragOffset.current.x + deltaX;
    const newY = dragOffset.current.y + deltaY;

    // Use GSAP to smoothly animate to target position with very fast response
    gsap.to(currentPosition.current, {
      x: newX,
      y: newY,
      duration: 0.05,
      ease: "none",
      overwrite: true,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    gl.domElement.style.cursor = "grab";

    // Apply momentum with GSAP inertia effect
    const momentumX = velocity.current.x * 0.8;
    const momentumY = velocity.current.y * 0.8;

    gsap.to(currentPosition.current, {
      x: currentPosition.current.x + momentumX,
      y: currentPosition.current.y + momentumY,
      duration: 0.2,
      ease: "power1.out",
      overwrite: true,
    });
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      return () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };
    }
  }, [isDragging]);

  useFrame(() => {
    // Grid follows the base position (no spring physics for grid)
    if (gridRef.current) {
      gridRef.current.position.x = currentPosition.current.x;
      gridRef.current.position.y = currentPosition.current.y;
    }
    // Images handle their own position with spring physics in PetImage component
  });

  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[0, 0, 10]}
        zoom={8}
        near={0.1}
        far={1000}
      />

      <ambientLight intensity={0.8} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />

      {/* Invisible plane for universal dragging - covers entire viewport */}
      <mesh position={[0, 0, -5]} onPointerDown={handlePointerDown}>
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Grid Background */}
      <group ref={gridRef}>
        <Grid />
      </group>

      {/* Draggable Pet Images Group */}
      <group ref={groupRef}>
        {gridData.map((item) => (
          <PetImage
            key={item.index}
            texture={item.texture}
            position={item.position}
            index={item.index}
            groupPosition={[
              currentPosition.current.x,
              currentPosition.current.y,
              0,
            ]}
            mousePosition={mousePosition.current}
            imagePath={item.imagePath}
            animationFrames={item.animationFrames}
          />
        ))}
      </group>
    </>
  );
}

// Main Component
export default function GridPetsCanvas() {
  const petImages = [
    "/pet1.png",
    "/pet2.png",
    "/pet3.png",
    "/pet4.png",
    "/pet5.png",
    "/pet6.png",
    "/pet7.png",
    "/pet8.png",
    "/pet9.png",
    "/pet10.png",
    "/pet11.png",
    "/pet12.png",
    "/pet13.png",
    "/pet14.png",
    "/pet15.png",
    "/pets/17.png", // Add the image with animation
  ];

  // Animation frames for pets/17.png stop motion
  const animationImages = [
    "/pets/17.png",
    "/pets/17-1.png",
    "/pets/17-2.png",
    "/pets/17-3.png",
    "/pets/17-4.png",
  ];

  // Pet names for hover display
  return (
    <div className="grid-pets-canvas">
      <Canvas
        className="three-canvas"
        gl={{ antialias: true, alpha: true }}
        style={{ background: "#F0EEE9", cursor: "grab" }}
      >
        <Suspense fallback={null}>
          <Scene petImages={petImages} animationImages={animationImages} />
        </Suspense>
      </Canvas>
    </div>
  );
}
