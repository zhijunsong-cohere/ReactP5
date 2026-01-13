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

  // Determine if this image should swap on hover
  const hasHoverSwap = imageId === "03.png";
  const hoverImage = hasHoverSwap ? image.replace("03.png", "03-1.png") : image;

  // Check if this image should spin on hover
  const shouldSpin = imageId === "02.png";

  // Check if this image should flip horizontally on hover
  const shouldFlip = imageId === "24.png";

  // Check if this image should have shiny tile SVG effect (using 19.svg as co:here logo)
  const shouldShinyTile = imageId === "19.svg";

  // Check if this image should have a colored frame (21.png)
  const shouldHaveFrame = imageId === "21.png";

  // Random chance to wiggle on hover (40% of images will wiggle when hovered)
  const shouldWiggleOnHover = useRef(Math.random() < 0.4);

  // Wiggle when hovering over randomly selected images
  useEffect(() => {
    if (isHovered && shouldWiggleOnHover.current) {
      setIsWiggling(true);
      const timer = setTimeout(() => setIsWiggling(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isHovered]);

  const handleClick = (e) => {
    e.stopPropagation();

    onImageClick(imageId, { x: x, y: y });
  };

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
      onMouseLeave={() => setIsHovered(false)}
    >
      <div ref={imageRef} className="pet-image-inner">
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
            src={image}
            alt={`Pet ${index + 1}`}
            draggable={false}
            className="pet-image-base"
            style={{
              opacity: isHovered && hasHoverSwap ? 0 : 1,
              transition: hasHoverSwap ? "opacity 0.15s ease-in" : "none",
              position: "relative",
              zIndex: 2,
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
        {/* Hover image (only for 03.png) - crisp transition */}
        {hasHoverSwap && (
          <img
            src={hoverImage}
            alt={`Pet ${index + 1} hover`}
            draggable={false}
            className="pet-image-hover"
            style={{
              opacity: isHovered ? 1 : 0,
              transition: "opacity 0.15s ease-out",
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

export default function PetNamesCanvas() {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

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

  // Handle image click and spawn pumpkins
  const handleImageClick = (imageId, position) => {
    // Only spawn pumpkins for 01.png
    if (imageId !== "23.png") return;

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
        id: `${Date.now()}-${i}`,
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
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

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

  return (
    <div
      ref={containerRef}
      className="pet-names-canvas"
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
    >
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
    </div>
  );
}
