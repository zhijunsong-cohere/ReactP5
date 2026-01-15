import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import "./PetNamesCanvas.css";

// Individual image component with momentum physics
function PetImageItem({
  image,
  x,
  y,
  imageWidth,
  imageHeight,
  index,
  gridVelocity,
  onImageClick,
  imageId,
}) {
  const imageRef = useRef(null);
  const itemRef = useRef(null);
  const [isWiggling, setIsWiggling] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [tileOffset, setTileOffset] = useState({ x: 0, y: 0 });
  const lastClickTime = useRef(0); // Add debounce for clicks
  const physics = useRef({
    offsetX: 0,
    offsetY: 0,
    velocityX: 0,
    velocityY: 0,
    rotation: 0, // Add rotation for swinging
    rotationVelocity: 0,
  });

  // Random momentum factor for variation (0.5 to 1.5)
  const momentumFactor = useRef(0.5 + Math.random() * 1.0);

  // Determine if this image should have 3D tilt and swap on hover (03.png)
  const shouldTiltAndSwap = imageId === "03.png";
  const [tiltTransform, setTiltTransform] = useState("");
  const tiltRef = useRef({ x: 0, y: 0 }); // Store target tilt values
  const [imageOpacity, setImageOpacity] = useState(1); // Opacity for smooth transitions

  // Check if this image should spin on hover
  const shouldSpin = imageId === "02.png";

  // Check if this image should flip horizontally on hover
  const shouldFlip = imageId === "24.png";

  // Check if this image should have shiny tile SVG effect (using 19.svg as co:here logo)
  const shouldShinyTile = imageId === "19.svg";

  // Check if this image should have a colored frame (21.png)
  const shouldHaveFrame = imageId === "21.png";

  // Check if this image should play stop motion animation on hover (17.png)
  const shouldPlayStopMotion = imageId === "17.png";

  // Check if this image should play sound on hover (01.png)
  const shouldPlaySound = imageId === "01.png";
  const audioRef = useRef(null);

  // Stop motion animation state
  const [currentAnimFrame, setCurrentAnimFrame] = useState(0);
  const animationFrames = shouldPlayStopMotion
    ? [
        image, // 17.png
        image.replace("17.png", "17-1.png"),
        image.replace("17.png", "17-2.png"),
        image.replace("17.png", "17-3.png"),
        image.replace("17.png", "17-4.png"),
      ]
    : [];
  const hasPlayedAnimation = useRef(false);
  const animationInterval = useRef(null); // Store interval ID to prevent cleanup issues

  // Wiggle effect removed from hover
  const shouldWiggleOnHover = useRef(Math.random() < 0.2);

  // Wiggle when hovering over randomly selected images - DISABLED
  useEffect(() => {
    if (isHovered && shouldWiggleOnHover.current) {
      setIsWiggling(true);
      const timer = setTimeout(() => setIsWiggling(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isHovered]);

  // Initialize audio for 01.png
  useEffect(() => {
    if (shouldPlaySound && !audioRef.current) {
      audioRef.current = new Audio("/sound/purrsound.m4a");
      audioRef.current.loop = false; // Play once per hover
      audioRef.current.volume = 0; // Start at 0 for fade in
    }
  }, [shouldPlaySound]);

  // Play sound on hover for 01.png with fade in/out
  useEffect(() => {
    if (!shouldPlaySound || !audioRef.current) return;

    let fadeInterval = null;

    if (isHovered) {
      console.log("Playing purr sound for 01.png with fade in");
      audioRef.current.currentTime = 0; // Reset to start
      audioRef.current.volume = 0; // Start from 0

      audioRef.current.play().catch((error) => {
        console.log("Audio play error:", error);
      });

      // Fade in over 300ms to volume 0.3
      const fadeInDuration = 300; // ms
      const targetVolume = 0.2;
      const fadeInSteps = 30; // Number of steps
      const fadeInInterval = fadeInDuration / fadeInSteps;
      const volumeIncrement = targetVolume / fadeInSteps;
      let currentStep = 0;

      fadeInterval = setInterval(() => {
        currentStep++;
        if (currentStep <= fadeInSteps) {
          audioRef.current.volume = Math.min(
            volumeIncrement * currentStep,
            targetVolume
          );
        } else {
          clearInterval(fadeInterval);
        }
      }, fadeInInterval);
    } else {
      // Fade out over 300ms when hover ends
      const fadeOutDuration = 300; // ms
      const currentVolume = audioRef.current.volume;
      const fadeOutSteps = 30;
      const fadeOutInterval = fadeOutDuration / fadeOutSteps;
      const volumeDecrement = currentVolume / fadeOutSteps;
      let currentStep = 0;

      fadeInterval = setInterval(() => {
        currentStep++;
        if (currentStep <= fadeOutSteps) {
          audioRef.current.volume = Math.max(
            currentVolume - volumeDecrement * currentStep,
            0
          );
        } else {
          clearInterval(fadeInterval);
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      }, fadeOutInterval);
    }

    return () => {
      if (fadeInterval) {
        clearInterval(fadeInterval);
      }
    };
  }, [isHovered, shouldPlaySound]);

  // Stop motion animation on hover for 17.png
  useEffect(() => {
    if (!shouldPlayStopMotion) return;

    if (isHovered && !hasPlayedAnimation.current) {
      console.log("Starting stop motion animation for 17.png");
      let frameIndex = 0;

      // Play through all frames once
      animationInterval.current = setInterval(() => {
        frameIndex++;

        if (frameIndex < animationFrames.length) {
          setCurrentAnimFrame(frameIndex);
        } else {
          clearInterval(animationInterval.current);
          animationInterval.current = null;
          hasPlayedAnimation.current = true;
        }
      }, 100); // 100ms per frame (10fps)

      return () => {
        if (animationInterval.current) {
          clearInterval(animationInterval.current);
          animationInterval.current = null;
        }
      };
    } else if (!isHovered) {
      // Reset when not hovering
      if (animationInterval.current) {
        clearInterval(animationInterval.current);
        animationInterval.current = null;
      }
      hasPlayedAnimation.current = false;
      setCurrentAnimFrame(0);
    }
  }, [isHovered, shouldPlayStopMotion, animationFrames.length]);

  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent any default behavior

    // Debounce: prevent multiple rapid clicks (minimum 300ms between clicks)
    const now = Date.now();
    if (now - lastClickTime.current < 500) {
      return;
    }
    lastClickTime.current = now;

    onImageClick(imageId, { x: x, y: y });
  };

  const handleMouseMove = (e) => {
    if (!shouldTiltAndSwap || !itemRef.current) return;

    const rect = itemRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate mouse position relative to card center (-1 to 1)
    const mouseX = (e.clientX - centerX) / (rect.width / 2);
    const mouseY = (e.clientY - centerY) / (rect.height / 2);

    // Store target tilt values
    tiltRef.current = { x: mouseX, y: mouseY };
  };

  // Opacity fade in/out for 03.png on hover
  useEffect(() => {
    if (!shouldTiltAndSwap) return;

    if (isHovered) {
      // Fade out then fade in with new image
      setImageOpacity(0.3);
      const timer = setTimeout(() => {
        setImageOpacity(1);
      }, 150); // Brief fade duration

      return () => clearTimeout(timer);
    } else {
      // Fade out then fade in back to original
      setImageOpacity(0.3);
      const timer = setTimeout(() => {
        setImageOpacity(1);
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [isHovered, shouldTiltAndSwap]);

  // 3D tilt animation for 03.png card
  useEffect(() => {
    if (!shouldTiltAndSwap) return;

    let animationId;
    let currentTilt = { x: 0, y: 0 };

    const animateTilt = () => {
      if (isHovered) {
        // Smooth interpolation to target tilt
        const ease = 0.1;
        currentTilt.x += (tiltRef.current.x - currentTilt.x) * ease;
        currentTilt.y += (tiltRef.current.y - currentTilt.y) * ease;

        // Apply 3D tilt transform (rotate around X and Y axes)
        const rotateY = currentTilt.x * 25; // Max 25 degrees (increased from 15)
        const rotateX = -currentTilt.y * 25; // Max 25 degrees (inverted, increased from 15)

        setTiltTransform(
          `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`
        );
      } else {
        // Return to neutral position
        currentTilt.x *= 0.9;
        currentTilt.y *= 0.9;

        const rotateY = currentTilt.x * 25;
        const rotateX = -currentTilt.y * 25;

        setTiltTransform(
          `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1)`
        );
      }

      animationId = requestAnimationFrame(animateTilt);
    };

    animationId = requestAnimationFrame(animateTilt);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isHovered, shouldTiltAndSwap]);

  // Update tile offset based on grid velocity (scrolling) for holographic effect
  useEffect(() => {
    if (!shouldShinyTile) return;

    let animationId;

    const updateTileOffset = () => {
      // Accumulate tile offset based on grid velocity to create continuous movement
      setTileOffset((prev) => ({
        x: prev.x + gridVelocity.current.x * 0.5,
        y: prev.y + gridVelocity.current.y * 0.5,
      }));

      animationId = requestAnimationFrame(updateTileOffset);
    };

    animationId = requestAnimationFrame(updateTileOffset);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [shouldShinyTile, gridVelocity]);

  useEffect(() => {
    let animationId;

    const animate = () => {
      if (!imageRef.current) return;

      // Apply momentum based on grid velocity
      // Reduce multiplier to keep consistent feel across drag and scroll
      const targetOffsetX =
        -gridVelocity.current.x * momentumFactor.current * 2;
      const targetOffsetY =
        -gridVelocity.current.y * momentumFactor.current * 2;

      // Spring physics to return to original position
      const spring = 0.08; // Spring strength
      const damping = 0.88; // Damping factor

      // Calculate spring force
      const forceX = (targetOffsetX - physics.current.offsetX) * spring;
      const forceY = (targetOffsetY - physics.current.offsetY) * spring;

      // Update velocity
      physics.current.velocityX += forceX;
      physics.current.velocityY += forceY;

      // Apply damping
      physics.current.velocityX *= damping;
      physics.current.velocityY *= damping;

      // Update position
      physics.current.offsetX += physics.current.velocityX;
      physics.current.offsetY += physics.current.offsetY;

      // Swinging physics based on horizontal velocity
      const swingStrength = 0.3; // How much the item swings
      const rotationSpring = 0.12; // Spring strength for rotation
      const rotationDamping = 0.85; // Damping for rotation

      // Target rotation based on horizontal velocity (negative for natural swing)
      const targetRotation =
        -gridVelocity.current.x * momentumFactor.current * swingStrength;

      // Calculate rotation spring force
      const rotationForce =
        (targetRotation - physics.current.rotation) * rotationSpring;

      // Update rotation velocity
      physics.current.rotationVelocity += rotationForce;
      physics.current.rotationVelocity *= rotationDamping;

      // Update rotation
      physics.current.rotation += physics.current.rotationVelocity;

      // Apply transform with translation and rotation
      imageRef.current.style.transform = `translate(${physics.current.offsetX}px, ${physics.current.offsetY}px) rotate(${physics.current.rotation}deg)`;

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [gridVelocity]);

  return (
    <div
      ref={itemRef}
      className={`pet-image-item ${isWiggling ? "wiggling" : ""} ${
        shouldSpin && isHovered ? "spinning" : ""
      } ${shouldFlip && isHovered ? "flipping" : ""} ${
        shouldShinyTile ? "shiny-tile-container" : ""
      } ${shouldHaveFrame ? "has-frame" : ""}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
      }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        tiltRef.current = { x: 0, y: 0 };
      }}
      onMouseMove={handleMouseMove}
    >
      <div
        ref={imageRef}
        className="pet-image-inner"
        style={{
          transform: shouldTiltAndSwap ? tiltTransform : undefined,
          transition: shouldTiltAndSwap ? "transform 0.1s ease-out" : undefined,
        }}
      >
        {/* Holographic tiled background for 19.svg (co:here SVG) */}
        {shouldShinyTile ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {/* Container with mask applied */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                WebkitMaskImage: "url(/pets/19.svg)",
                WebkitMaskSize: "80% 80%",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskImage: "url(/pets/19.svg)",
                maskSize: "80% 80%",
                maskRepeat: "no-repeat",
                maskPosition: "center",
              }}
            >
              {/* Rotated holographic background inside the mask */}
              <div
                className="holographic-background"
                style={{
                  position: "absolute",
                  top: "-50%",
                  left: "-50%",
                  width: "200%",
                  height: "200%",
                  backgroundImage: "url(/pets/holographic_tile.png)",
                  backgroundSize: "200px 200px",
                  backgroundRepeat: "repeat",
                  backgroundPosition: `${tileOffset.x}px ${tileOffset.y}px`,
                  transform: "rotate(-45deg)",
                  pointerEvents: "none",
                }}
              />
            </div>
            {/* SVG outline/stroke for definition - stays fixed and unrotated */}
            <img
              src="/pets/19.svg"
              alt="co:here logo"
              draggable={false}
              style={{
                width: "80%",
                height: "80%",
                objectFit: "contain",
                position: "relative",
                zIndex: 2,
                opacity: 0.2,
                mixBlendMode: "multiply",
                pointerEvents: "none",
              }}
            />
          </div>
        ) : (
          <img
            src={
              shouldPlayStopMotion
                ? animationFrames[currentAnimFrame]
                : shouldTiltAndSwap && isHovered
                ? image.replace("03.png", "03-1.png")
                : image
            }
            alt={`Pet ${index + 1}`}
            draggable={false}
            className="pet-image-base"
            style={{
              position: "relative",
              zIndex: 2,
              opacity: shouldTiltAndSwap ? imageOpacity : 1,
              transition: shouldTiltAndSwap
                ? "opacity 0.3s ease-in-out"
                : "none",
            }}
            onLoad={(e) => {
              // Maintain aspect ratio
              const img = e.target;
              const aspectRatio = img.naturalWidth / img.naturalHeight;
              if (aspectRatio > 1) {
                // Landscape
                img.style.width = "100%";
                img.style.height = "auto";
              } else {
                // Portrait or square
                img.style.width = "auto";
                img.style.height = "100%";
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

// Pumpkin particle component
function Pumpkin({ id, startX, startY, targetX, targetY, onComplete }) {
  const pumpkinRef = useRef(null);

  useEffect(() => {
    if (!pumpkinRef.current) return;

    const tl = gsap.timeline({
      onComplete: () => onComplete(id),
    });

    // Animate position, scale, and rotation
    tl.fromTo(
      pumpkinRef.current,
      {
        x: startX,
        y: startY,
        scale: 0,
        rotation: 0,
        opacity: 1,
      },
      {
        x: targetX,
        y: targetY,
        scale: 1,
        rotation: Math.random() * 720 - 360,
        duration: 1.5 + Math.random() * 0.5,
        ease: "power1.out",
      },
      0
    );

    // Fade out slowly in the last portion
    tl.to(
      pumpkinRef.current,
      {
        opacity: 0,
        duration: 0.8,
        ease: "power2.in",
      },
      0.8 // Start fading after 0.8s
    );
  }, [startX, startY, targetX, targetY, id, onComplete]);

  return (
    <div
      ref={pumpkinRef}
      className="pumpkin-particle"
      style={{
        position: "fixed",
        width: "40px",
        height: "40px",
        pointerEvents: "none",
        zIndex: 1000,
      }}
    >
      <img
        src="/pets/23-1.png"
        alt="pumpkin"
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </div>
  );
}

// Maple leaf stamp component
function MapleLeaf({ id, x, y, onComplete }) {
  const leafRef = useRef(null);
  const initialRotation = useRef(Math.random() * 360); // Random initial rotation

  useEffect(() => {
    if (!leafRef.current) return;

    const tl = gsap.timeline({
      onComplete: () => onComplete(id),
    });

    // Fade in
    tl.fromTo(
      leafRef.current,
      {
        opacity: 0,
      },
      {
        opacity: 0.9,
        duration: 0.1,
        ease: "power2.out",
      }
    );

    // Simple fade out after staying visible (no middle animation needed)
    tl.to(
      leafRef.current,
      {
        opacity: 0,
        duration: 0.5,
        ease: "power2.in",
      },
      "+=2.55" // Wait 2.55 seconds after fade in completes (total visible time: ~2.8s)
    );
  }, [x, y, id, onComplete]);

  return (
    <div
      ref={leafRef}
      className="maple-leaf-stamp"
      style={{
        position: "fixed",
        width: "40px",
        height: "40px",
        pointerEvents: "none",
        zIndex: 1000,
        left: `${x - 20}px`, // Center the leaf
        top: `${y - 20}px`,
        transform: `rotate(${initialRotation.current}deg)`, // Fixed initial rotation
      }}
    >
      <img
        src="/pets/mapleleaf.png"
        alt="maple leaf"
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </div>
  );
}

export default function PetNamesCanvas() {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const [allLoaded, setAllLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Grid configuration
  const cols = 6;
  const gap = 140;
  const imageWidth = window.innerHeight / 4;
  const imageHeight = window.innerHeight / 4;

  // Calculate initial position to show first image in top-left
  // The grid is centered, so we need to offset by half image size plus some padding
  const initialX = imageWidth / 2 + 40; // 40px padding from left edge
  const initialY = imageHeight / 2 + 40; // 40px padding from top edge

  const currentPosition = useRef({ x: initialX, y: initialY });
  const targetPosition = useRef({ x: initialX, y: initialY });
  const velocity = useRef({ x: 0, y: 0 });
  const lastPosition = useRef({ x: 0, y: 0 });
  const animationFrame = useRef(null);
  const lastWrapTime = useRef(0); // Track last wrap to prevent rapid wrapping
  const gridVelocity = useRef({ x: 0, y: 0 }); // Track grid velocity for image momentum
  const [pumpkins, setPumpkins] = useState([]);
  const lastPumpkinSpawnTime = useRef(0); // Track last pumpkin spawn to prevent duplicates

  // Maple leaf stamp mode state
  const [isStampMode, setIsStampMode] = useState(false);
  const [mapleLeaves, setMapleLeaves] = useState([]);
  const stampModeTimer = useRef(null);

  // All pet images from the pets folder
  const petImages = [
    "/pets/01.png",
    "/pets/02.png",
    "/pets/03.png",
    "/pets/04.png",
    "/pets/05.png",
    "/pets/06.png",
    "/pets/07.png",
    "/pets/08.png",
    "/pets/09.png",
    "/pets/10.png",
    "/pets/11.png",
    "/pets/12.png",
    "/pets/13.png",
    "/pets/14.png",
    "/pets/15.png",
    "/pets/16.png",
    "/pets/17.png",
    "/pets/18.png",
    "/pets/19.svg",
    "/pets/20.png",
    "/pets/21.png",
    "/pets/22.png",
    "/pets/23.png",
    "/pets/24.png",
  ];

  const rows = Math.ceil(petImages.length / cols);

  // Calculate single grid dimensions for infinite scroll
  const gridWidth = cols * (imageWidth + gap);
  const gridHeight = rows * (imageHeight + gap);

  // Preload all images before rendering
  useEffect(() => {
    const specialImages = [
      "/pets/03-1.png",
      "/pets/23-1.png",
      "/pets/holographic_tile.png",
      "/pets/17-1.png",
      "/pets/17-2.png",
      "/pets/17-3.png",
      "/pets/17-4.png",
      "/pets/mapleleaf.png",
    ];
    const allImages = [...petImages, ...specialImages];

    let loadedCount = 0;
    const totalImages = allImages.length;

    const loadImage = (src) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          loadedCount++;
          setLoadingProgress(Math.floor((loadedCount / totalImages) * 100));
          resolve();
        };
        img.onerror = () => {
          loadedCount++;
          setLoadingProgress(Math.floor((loadedCount / totalImages) * 100));
          console.warn(`Failed to load image: ${src}`);
          resolve(); // Resolve even on error to not block loading
        };
      });
    };

    Promise.all(allImages.map(loadImage)).then(() => {
      setAllLoaded(true);
    });
  }, []);

  // Handle image click and spawn pumpkins or enable stamp mode
  const handleImageClick = (imageId, position) => {
    // Enable maple leaf stamp mode for 05.png
    if (imageId === "05.png") {
      console.log("Enabling maple leaf stamp mode for 8 seconds");
      setIsStampMode(true);

      // Clear any existing timer
      if (stampModeTimer.current) {
        clearTimeout(stampModeTimer.current);
      }

      // Disable stamp mode after 8 seconds
      stampModeTimer.current = setTimeout(() => {
        setIsStampMode(false);
        console.log("Maple leaf stamp mode disabled");
      }, 8000); // 8 seconds

      return;
    }

    // Only spawn pumpkins for 23.png
    if (imageId !== "23.png") return;

    // Debounce: prevent multiple rapid spawns (minimum 500ms between spawns)
    const now = Date.now();
    if (now - lastPumpkinSpawnTime.current < 500) {
      console.log("Pumpkin spawn debounced - too soon after last spawn");
      return;
    }
    lastPumpkinSpawnTime.current = now;

    const containerRect = containerRef.current.getBoundingClientRect();
    const centerX =
      containerRect.width / 2 + position.x + currentPosition.current.x;
    const centerY =
      containerRect.height / 2 + position.y + currentPosition.current.y;

    // Spawn 12 pumpkins from corners spreading outward
    const newPumpkins = [];
    const pumpkinCount = 12;

    for (let i = 0; i < pumpkinCount; i++) {
      const angle = (Math.PI * 2 * i) / pumpkinCount;
      const distance = 250 + Math.random() * 200; // Increased distance for slower animation
      const targetX = centerX + Math.cos(angle) * distance;
      const targetY = centerY + Math.sin(angle) * distance;

      newPumpkins.push({
        id: `${Date.now()}-${i}-${Math.random()}`, // More unique ID
        startX: centerX,
        startY: centerY,
        targetX,
        targetY,
      });
    }

    setPumpkins((prev) => [...prev, ...newPumpkins]);
  };

  // Remove completed pumpkins
  const removePumpkin = (id) => {
    setPumpkins((prev) => prev.filter((p) => p.id !== id));
  };

  // Remove completed maple leaves
  const removeMapleLeaf = (id) => {
    setMapleLeaves((prev) => prev.filter((leaf) => leaf.id !== id));
  };

  // Smooth follow animation with infinite scroll wrapping
  useEffect(() => {
    const animate = () => {
      // Use different ease factor for dragging vs. scrolling
      // During drag, use higher ease for more responsive 1:1 feel
      const ease = isDragging ? 0.02 : 0.08; // Higher value during drag = more responsive

      // Track previous position to calculate grid velocity
      const prevX = currentPosition.current.x;
      const prevY = currentPosition.current.y;

      currentPosition.current.x +=
        (targetPosition.current.x - currentPosition.current.x) * ease;
      currentPosition.current.y +=
        (targetPosition.current.y - currentPosition.current.y) * ease;

      // Calculate grid velocity for image momentum
      gridVelocity.current.x = currentPosition.current.x - prevX;
      gridVelocity.current.y = currentPosition.current.y - prevY;

      // Wrap target position for infinite scroll with conservative approach
      // Use 2x grid size threshold to provide more buffer
      const wrapThresholdX = gridWidth * 2;
      const wrapThresholdY = gridHeight * 2;

      // Calculate movement speed
      const deltaX = Math.abs(
        targetPosition.current.x - currentPosition.current.x
      );
      const deltaY = Math.abs(
        targetPosition.current.y - currentPosition.current.y
      );
      const totalDelta = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Track velocity magnitude
      const velocityMag = Math.sqrt(
        velocity.current.x ** 2 + velocity.current.y ** 2
      );

      // Only wrap when:
      // 1. Movement is very slow (delta < 50px)
      // 2. Velocity is low (< 10px/frame)
      // 3. At least 300ms since last wrap (cooldown)
      const now = Date.now();
      const timeSinceLastWrap = now - lastWrapTime.current;
      const canWrap =
        totalDelta < 50 && velocityMag < 10 && timeSinceLastWrap > 300;

      if (canWrap) {
        let didWrap = false;

        if (targetPosition.current.x > wrapThresholdX) {
          targetPosition.current.x -= gridWidth;
          currentPosition.current.x -= gridWidth;
          didWrap = true;
        } else if (targetPosition.current.x < -wrapThresholdX) {
          targetPosition.current.x += gridWidth;
          currentPosition.current.x += gridWidth;
          didWrap = true;
        }

        if (targetPosition.current.y > wrapThresholdY) {
          targetPosition.current.y -= gridHeight;
          currentPosition.current.y -= gridHeight;
          didWrap = true;
        } else if (targetPosition.current.y < -wrapThresholdY) {
          targetPosition.current.y += gridHeight;
          currentPosition.current.y += gridHeight;
          didWrap = true;
        }

        // Update last wrap time if we wrapped
        if (didWrap) {
          lastWrapTime.current = now;
        }
      }

      // Apply transform to content
      if (contentRef.current) {
        contentRef.current.style.transform = `translate(${currentPosition.current.x}px, ${currentPosition.current.y}px)`;
      }

      animationFrame.current = requestAnimationFrame(animate);
    };

    animationFrame.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [gridWidth, gridHeight, isDragging]);

  // Mouse/Touch drag handlers
  const handlePointerDown = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // If in stamp mode, create a maple leaf stamp
    if (isStampMode) {
      console.log("Stamping maple leaf at", clientX, clientY);
      const newLeaf = {
        id: `maple-${Date.now()}-${Math.random()}`,
        x: clientX,
        y: clientY,
      };
      setMapleLeaves((prev) => [...prev, newLeaf]);
      return; // Don't start dragging in stamp mode
    }

    setIsDragging(true);

    dragStart.current = {
      x: clientX - targetPosition.current.x,
      y: clientY - targetPosition.current.y,
    };

    lastPosition.current = { x: clientX, y: clientY };
    velocity.current = { x: 0, y: 0 };

    // Kill any ongoing GSAP animations
    gsap.killTweensOf(targetPosition.current);

    if (containerRef.current) {
      containerRef.current.style.cursor = "grabbing";
    }
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;

    // If stamp mode is active and user starts dragging, disable stamp mode
    if (isStampMode) {
      console.log("Drag detected - disabling stamp mode");
      setIsStampMode(false);
      if (stampModeTimer.current) {
        clearTimeout(stampModeTimer.current);
        stampModeTimer.current = null;
      }
    }

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // Calculate velocity for momentum (no limit during drag for smooth movement)
    velocity.current.x = clientX - lastPosition.current.x;
    velocity.current.y = clientY - lastPosition.current.y;

    lastPosition.current = { x: clientX, y: clientY };

    // Update target position directly for 1:1 drag feel
    targetPosition.current.x = clientX - dragStart.current.x;
    targetPosition.current.y = clientY - dragStart.current.y;
  };

  const handlePointerUp = () => {
    setIsDragging(false);

    if (containerRef.current) {
      containerRef.current.style.cursor = "grab";
    }

    // Apply momentum with GSAP and limit maximum momentum
    const maxMomentum = 400; // Reduced maximum momentum distance
    const momentumX = Math.max(
      -maxMomentum,
      Math.min(maxMomentum, velocity.current.x * 12)
    );
    const momentumY = Math.max(
      -maxMomentum,
      Math.min(maxMomentum, velocity.current.y * 12)
    );

    gsap.to(targetPosition.current, {
      x: targetPosition.current.x + momentumX,
      y: targetPosition.current.y + momentumY,
      duration: 1.0, // Longer duration for smoother deceleration
      ease: "power2.out",
    });
  };

  // Wheel scroll handler
  const handleWheel = (e) => {
    e.preventDefault();

    // Limit maximum scroll speed and apply smoothing multiplier
    const maxDelta = 40; // Maximum pixels to move per scroll event
    const smoothing = 0.8; // Reduce scroll speed
    const deltaX = Math.max(
      -maxDelta,
      Math.min(maxDelta, e.deltaX * smoothing)
    );
    const deltaY = Math.max(
      -maxDelta,
      Math.min(maxDelta, e.deltaY * smoothing)
    );

    // Update target position based on scroll with speed limit
    targetPosition.current.x -= deltaX;
    targetPosition.current.y -= deltaY;

    // Kill any ongoing animations
    gsap.killTweensOf(targetPosition.current);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Add wheel listener with passive: false to allow preventDefault
    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // Cleanup stamp mode timer on unmount
  useEffect(() => {
    return () => {
      if (stampModeTimer.current) {
        clearTimeout(stampModeTimer.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pet-names-canvas"
      style={{ cursor: isStampMode ? "crosshair" : "grab" }}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
    >
      {/* Loading overlay with progress bar */}
      {!allLoaded && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "#0a0a0f",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              width: "300px",
              height: "6px",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: "3px",
              overflow: "hidden",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                width: `${loadingProgress}%`,
                height: "100%",
                backgroundColor: "#8fa6f9",
                transition: "width 0.2s ease-out",
                borderRadius: "3px",
              }}
            />
          </div>
          <p
            style={{
              color: "#75758a",
              fontSize: "14px",
              fontFamily: "monospace",
              margin: 0,
            }}
          >
            Loading images... {loadingProgress}%
          </p>
        </div>
      )}

      {/* Only render canvas content when all images are loaded */}
      {allLoaded && (
        <>
          <div ref={contentRef} className="pet-images-grid">
            {/* Render 7x7 grid tiles for seamless infinite scroll with extra buffer for fast movement */}
            {[-3, -2, -1, 0, 1, 2, 3].map((tileY) =>
              [-3, -2, -1, 0, 1, 2, 3].map((tileX) =>
                petImages.map((image, index) => {
                  const col = index % cols;
                  const row = Math.floor(index / cols);
                  const x = col * (imageWidth + gap) + tileX * gridWidth;
                  const y = row * (imageHeight + gap) + tileY * gridHeight;

                  return (
                    <PetImageItem
                      key={`${tileX}-${tileY}-${index}`}
                      image={image}
                      x={x}
                      y={y}
                      imageWidth={imageWidth}
                      imageHeight={imageHeight}
                      index={index}
                      gridVelocity={gridVelocity}
                      onImageClick={handleImageClick}
                      imageId={image.split("/").pop()}
                    />
                  );
                })
              )
            )}
          </div>

          {/* Render spawned pumpkins */}
          {pumpkins.map((pumpkin) => (
            <Pumpkin
              key={pumpkin.id}
              id={pumpkin.id}
              startX={pumpkin.startX}
              startY={pumpkin.startY}
              targetX={pumpkin.targetX}
              targetY={pumpkin.targetY}
              onComplete={removePumpkin}
            />
          ))}

          {/* Render maple leaf stamps */}
          {mapleLeaves.map((leaf) => (
            <MapleLeaf
              key={leaf.id}
              id={leaf.id}
              x={leaf.x}
              y={leaf.y}
              onComplete={removeMapleLeaf}
            />
          ))}
        </>
      )}
    </div>
  );
}
