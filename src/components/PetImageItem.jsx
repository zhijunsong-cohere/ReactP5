import React, { useRef, useState, useEffect } from "react";

/**
 * Individual image component with momentum physics and various interaction effects
 */
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
  showEntrance,
  reducedMotion,
}) {
  const imageRef = useRef(null);
  const itemRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isWiggling, setIsWiggling] = useState(false);
  const [tileOffset, setTileOffset] = useState({ x: 0, y: 0 });
  const lastClickTime = useRef(0); // Add debounce for clicks
  const wiggleTimerRef = useRef(null); // Store wiggle timer for cleanup
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

  // Check if this image should scale up on hover (01.png)
  const shouldScaleUp = imageId === "01.png";

  // Check if this image should spin on hover
  const shouldSpin = imageId === "02.png";

  // Check if this image should flip horizontally on hover
  const shouldFlip = imageId === "24.png";

  // Check if this is a video file
  const isVideo = imageId.endsWith(".mp4") || imageId.endsWith(".webm") || imageId.endsWith(".mov");

  // Check if this image should have shiny tile SVG effect (using 19.svg as co:here logo)
  const shouldShinyTile = imageId === "19.svg";

  // Check if this image should have a colored frame (21.png)
  const shouldHaveFrame = imageId === "21.png";

  // Check if this image should play stop motion animation on hover (17.png)
  const shouldPlayStopMotion = imageId === "17.png";

  // Check if this image should play sound on hover (01.png)
  const shouldPlaySound = imageId === "01.png";
  const audioRef = useRef(null);

  // Check if this image should wiggle and spawn pumpkins on click (23.png)
  const shouldWiggleAndSpawn = imageId === "23.png";

  // Check if this image should change based on momentum (13.png)
  const shouldChangeMomentum = imageId === "13.png";
  const [momentumState, setMomentumState] = useState("coasting"); // "coasting", "forward", "backward"
  const [frameRotation, setFrameRotation] = useState(0); // Dynamic rotation for frame.svg

  // Monitor grid velocity for 13.png momentum-based image switching
  useEffect(() => {
    if (!shouldChangeMomentum) return;

    const checkMomentum = () => {
      const velocityX = gridVelocity.current.x;
      const velocityY = gridVelocity.current.y;
      const totalVelocity = Math.sqrt(velocityX * velocityX + velocityY * velocityY);

      // Calculate dramatic rotation based on velocity
      // Use atan2 to get angle, then amplify it
      const angle = Math.atan2(velocityY, velocityX) * (180 / Math.PI);
      const rotationIntensity = Math.min(totalVelocity * 3, 15); // Max 15 degrees tilt
      
      // Apply rotation based on direction
      let rotation = 0;
      if (totalVelocity > 0.5) {
        // Tilt in the direction of movement
        rotation = angle * 0.3 + rotationIntensity * Math.sign(velocityX);
      }
      
      setFrameRotation(rotation);

      // Determine direction based on dominant axis
      let newState = momentumState;
      
      if (totalVelocity < 0.5) {
        // Nearly stationary - coasting
        newState = "coasting";
      } else if (Math.abs(velocityX) > Math.abs(velocityY)) {
        // Horizontal movement dominates
        if (velocityX > 0) {
          newState = "forward"; // Moving right
        } else {
          newState = "backward"; // Moving left
        }
      } else {
        // Vertical movement dominates
        if (velocityY > 0) {
          newState = "forward"; // Moving down
        } else {
          newState = "backward"; // Moving up
        }
      }

      if (newState !== momentumState) {
        setMomentumState(newState);
      }
    };

    const intervalId = setInterval(checkMomentum, 50); // Check every 50ms for smoother rotation

    return () => clearInterval(intervalId);
  }, [shouldChangeMomentum, gridVelocity, momentumState]);

  // Get descriptive name for accessibility
  const getImageDescription = () => {
    const descriptions = {
      "01.png": "Cat with purr sound effect - Click to hear",
      "02.png": "Spinning pet",
      "03.png": "3D tilting card - Hover to interact",
      "05.png": "Canadian maple leaf - Click to activate stamp mode",
      "07.png": "Daisy flower - Click to activate stamp mode",
      "13.png": `Dynamic momentum animation - Currently ${momentumState}`,
      "17.png": "Fortune cookie - Hover to see animation",
      "19.svg": "Cohere logo with holographic effect",
      "22.mp4": "Looping video animation",
      "23.png": "Pumpkin - Click to spawn flying pumpkins",
      "24.png": "Flipping image",
    };
    return descriptions[imageId] || `Interactive pet ${isVideo ? 'video' : 'image'} ${index + 1}`;
  };

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
  const animationInterval = useRef(null); // Store interval ID to prevent cleanup issues

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
      audioRef.current.currentTime = 0; // Reset to start
      audioRef.current.volume = 0; // Start from 0

      audioRef.current.play().catch(() => {});

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

  // Stop motion animation on hover for 17.png - plays once and stops at last frame
  useEffect(() => {
    if (!shouldPlayStopMotion) return;

    if (isHovered) {
      let frameIndex = 0;

      // Play through all frames once
      animationInterval.current = setInterval(() => {
        frameIndex++;

        // Stop at the last frame
        if (frameIndex >= animationFrames.length) {
          clearInterval(animationInterval.current);
          animationInterval.current = null;
        } else {
          setCurrentAnimFrame(frameIndex);
        }
      }, 120); // 120ms per frame (~8.3fps) for smoother visibility of each frame

      return () => {
        if (animationInterval.current) {
          clearInterval(animationInterval.current);
          animationInterval.current = null;
        }
      };
    } else {
      // Reset when not hovering
      if (animationInterval.current) {
        clearInterval(animationInterval.current);
        animationInterval.current = null;
      }
      setCurrentAnimFrame(0);
    }
  }, [isHovered, shouldPlayStopMotion, animationFrames.length]);

  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent any default behavior

    // Debounce: prevent multiple rapid clicks
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime.current;

    // For 23.png (pumpkins), use longer debounce (2000ms)
    // For other images, use shorter debounce (500ms)
    const debounceTime = shouldWiggleAndSpawn ? 2000 : 500;

    if (timeSinceLastClick < debounceTime) {
      return;
    }
    lastClickTime.current = now;

    // If this is 23.png, wiggle first then spawn pumpkins
    if (shouldWiggleAndSpawn) {

      // Clear any existing wiggle timer
      if (wiggleTimerRef.current) {
        clearTimeout(wiggleTimerRef.current);
        wiggleTimerRef.current = null;
      }

      setIsWiggling(true);

      // After wiggle completes (600ms), stop wiggling and spawn pumpkins
      wiggleTimerRef.current = setTimeout(() => {
        setIsWiggling(false);
        onImageClick(imageId, { x: x, y: y });
        wiggleTimerRef.current = null;
      }, 600);
    } else {
      // For other images, just trigger the click handler immediately
      onImageClick(imageId, { x: x, y: y });
    }
  };

  // Keyboard handler for accessibility
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick(e);
    }
  };

  // Prevent context menu and long-press on images
  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  // Prevent drag start on images
  const handleDragStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  // Throttle mouse move for better performance
  const lastMouseMoveTime = useRef(0);
  const handleMouseMove = (e) => {
    if (!shouldTiltAndSwap || !itemRef.current) return;

    // Throttle to max 60fps (16ms)
    const now = Date.now();
    if (now - lastMouseMoveTime.current < 16) return;
    lastMouseMoveTime.current = now;

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
      physics.current.offsetY += physics.current.velocityY;

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

  // Cleanup wiggle timer on unmount
  useEffect(() => {
    return () => {
      if (wiggleTimerRef.current) {
        clearTimeout(wiggleTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={itemRef}
      className={`pet-image-item ${isWiggling ? "wiggling" : ""} ${
        shouldSpin && isHovered ? "spinning" : ""
      } ${shouldFlip && isHovered ? "flipping" : ""} ${
        shouldScaleUp && isHovered ? "scale-up" : ""
      } ${shouldShinyTile ? "shiny-tile-container" : ""} ${
        shouldHaveFrame ? "has-frame" : ""
      } ${showEntrance && !reducedMotion ? "entrance-animation" : ""}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        cursor: "pointer",
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        tiltRef.current = { x: 0, y: 0 };
      }}
      onMouseMove={handleMouseMove}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      role="button"
      tabIndex={0}
      aria-label={getImageDescription()}
      aria-pressed={isHovered}
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
                  transform: "rotate(45deg)",
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
                mixBlendMode:"soft-light",
                pointerEvents: "none",
              }}
            />
          </div>
        ) : shouldChangeMomentum ? (
          // Momentum-based image switching for 13.png with constant frame.svg overlay
          <div
            className="momentum-animation-container"
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {/* Background animation - changes based on momentum */}
            <img
              src={
                momentumState === "coasting"
                  ? "/pets/Coasting.gif"
                  : momentumState === "forward"
                  ? "/pets/Transition.gif"
                  : "/pets/Push.gif"
              }
              alt={`${momentumState} animation`}
              draggable={false}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                objectFit: "contain",
                zIndex: 1,
              }}
            />
          </div>
        ) : isVideo ? (
          <video
            src={image}
            autoPlay
            loop
            muted
            playsInline
            className="pet-image-base"
            style={{
              position: "relative",
              zIndex: 2,
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
            onLoadedMetadata={(e) => {
              // Maintain aspect ratio
              const video = e.target;
              const aspectRatio = video.videoWidth / video.videoHeight;
              if (aspectRatio > 1) {
                // Landscape
                video.style.width = "100%";
                video.style.height = "auto";
              } else {
                // Portrait or square
                video.style.width = "auto";
                video.style.height = "100%";
              }
            }}
          />
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

export default PetImageItem;

