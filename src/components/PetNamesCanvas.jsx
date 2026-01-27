import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import PetImageItem from "./PetImageItem";
import Stamp from "./Stamp";
import Pumpkin from "./Pumpkin";
import CustomCursor from "./CustomCursor";
import useReducedMotion from "../hooks/useReducedMotion";
import { petImages } from "../constants/petImages";
import "./PetNamesCanvas.css";

export default function PetNamesCanvas() {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const [allLoaded, setAllLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showEntrance, setShowEntrance] = useState(false); // Trigger entrance animation

  // Check for reduced motion preference using custom hook
  const reducedMotion = useReducedMotion();

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
  const isPumpkinSpawning = useRef(false); // Global flag to prevent multiple spawns across all 23.png instances
  const currentPumpkinBatch = useRef(null); // Track current batch ID
  const pumpkinBatchCount = useRef(0); // Count pumpkins in current batch

  // Maple leaf stamp mode state
  const [isStampMode, setIsStampMode] = useState(false);
  const [mapleLeaves, setMapleLeaves] = useState([]);
  const stampModeTimer = useRef(null);

  // Daisy stamp mode state
  const [isDaisyStampMode, setIsDaisyStampMode] = useState(false);
  const [daisies, setDaisies] = useState([]);
  const daisyStampModeTimer = useRef(null);

  // Maximum drag and scroll distances to prevent excessive panning
  const maxDragDistance = 5000; // pixels
  const maxScrollDistance = 5000; // pixels

  // Custom cursor position for stamp modes
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  // Announcement for screen readers
  const [announcement, setAnnouncement] = useState("");

  // Grid dimensions
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
      "/pets/daisy.png",
      "/pets/frame.svg",
      "/pets/Coasting.gif",
      "/pets/Transition.gif",
      "/pets/Push.gif",
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
      // Trigger entrance animation after a brief delay
      setTimeout(() => {
        setShowEntrance(true);
      }, 100);
    });
  }, []);

  // Reset entrance animation after it completes
  useEffect(() => {
    if (showEntrance) {
      const timer = setTimeout(() => {
        setShowEntrance(false);
      }, 800); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [showEntrance]);

  // Handle image hover/click for special features
  const handleImageClick = (imageId, position) => {
    // Enable maple leaf stamp mode for 05.png (click only)
    if (imageId === "05.png") {
      console.log("🍁 Enabling maple leaf stamp mode for 8 seconds");
      setIsStampMode(true);
      setAnnouncement("Maple leaf stamp mode activated. Click anywhere to place maple leaves.");

      // Clear any existing timer
      if (stampModeTimer.current) {
        clearTimeout(stampModeTimer.current);
      }

      // Disable stamp mode after 8 seconds
      stampModeTimer.current = setTimeout(() => {
        setIsStampMode(false);
        setAnnouncement("Maple leaf stamp mode deactivated.");
        console.log("🍁 Maple leaf stamp mode disabled");
      }, 8000); // 8 seconds

      return;
    }

    // Enable daisy stamp mode for 07.png (click only)
    if (imageId === "07.png") {
      console.log("🌼 Enabling daisy stamp mode for 8 seconds");
      setIsDaisyStampMode(true);
      setAnnouncement("Daisy stamp mode activated. Click anywhere to place daisies.");

      // Clear any existing timer
      if (daisyStampModeTimer.current) {
        clearTimeout(daisyStampModeTimer.current);
      }

      // Disable daisy stamp mode after 8 seconds
      daisyStampModeTimer.current = setTimeout(() => {
        setIsDaisyStampMode(false);
        setAnnouncement("Daisy stamp mode deactivated.");
        console.log("🌼 Daisy stamp mode disabled");
      }, 8000); // 8 seconds

      return;
    }

    // Spawn pumpkins for 23.png (triggered by click)
    if (imageId === "23.png") {
      // Check global flag to prevent multiple spawns from different 23.png instances
      if (isPumpkinSpawning.current) {
        console.log("Pumpkin spawn already in progress (global) - ignoring");
        return;
      }

      console.log("Spawning pumpkin burst!");
      isPumpkinSpawning.current = true; // Set global flag

      const now = Date.now();
      const batchId = `batch-${now}`;

      const containerRect = containerRef.current.getBoundingClientRect();
      const centerX =
        containerRect.width / 2 + position.x + currentPosition.current.x;
      const centerY =
        containerRect.height / 2 + position.y + currentPosition.current.y;

      // Spawn 12 pumpkins throwing upward and falling
      const newPumpkins = [];
      const pumpkinCount = 10;

      for (let i = 0; i < pumpkinCount; i++) {
        // Random horizontal direction and distance
        const horizontalDirection = (Math.random() - 0.5) * 2; // -1 to 1
        const horizontalDistance = 150 + Math.random() * 250;
        const targetX = centerX + horizontalDirection * horizontalDistance;

        // Target Y is below the start (falling down)
        const fallDistance = 400 + Math.random() * 200;
        const targetY = centerY + fallDistance;

        // Peak height (how high the pumpkin goes before falling)
        const peakHeight = -200 - Math.random() * 150; // Negative = upward

        newPumpkins.push({
          id: `${batchId}-${i}`,
          startX: centerX,
          startY: centerY,
          targetX,
          targetY,
          peakY: centerY + peakHeight, // Peak of the arc
        });
      }

      // Track this batch
      currentPumpkinBatch.current = batchId;
      pumpkinBatchCount.current = pumpkinCount;

      console.log(`Adding ${newPumpkins.length} pumpkins to state (batch: ${batchId})`);
      setPumpkins((prev) => [...prev, ...newPumpkins]);
    }
  };

  // Remove completed pumpkins
  const removePumpkin = (id) => {
    console.log(`Pumpkin ${id} completed animation - removing from state`);
    
    // Check if this pumpkin belongs to the current batch
    const batchId = currentPumpkinBatch.current;
    if (batchId && id.startsWith(batchId)) {
      pumpkinBatchCount.current -= 1;
      console.log(`Batch ${batchId}: ${pumpkinBatchCount.current} pumpkins remaining`);
      
      // If all pumpkins in the batch are done, reset the spawn flag
      if (pumpkinBatchCount.current <= 0) {
        isPumpkinSpawning.current = false;
        currentPumpkinBatch.current = null;
        console.log(`Batch ${batchId} complete - ready for next spawn`);
      }
    }
    
    setPumpkins((prev) => prev.filter((p) => p.id !== id));
  };

  // Remove completed maple leaves
  const removeMapleLeaf = (id) => {
    setMapleLeaves((prev) => prev.filter((leaf) => leaf.id !== id));
  };

  // Remove completed daisies
  const removeDaisy = (id) => {
    setDaisies((prev) => prev.filter((daisy) => daisy.id !== id));
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

      // Wrap target position for infinite scroll - immediate wrapping
      // Use 1.2x grid size threshold for quicker wrapping
      const wrapThresholdX = gridWidth * 1.2;
      const wrapThresholdY = gridHeight * 1.2;

      // Wrap immediately when crossing threshold
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

      // Update last wrap time if wrapped
        if (didWrap) {
        lastWrapTime.current = Date.now();
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

  // Prevent context menu and long-press
  const handleContextMenu = (e) => {
    e.preventDefault();
    return false;
  };

  // Prevent drag start
  const handleDragStart = (e) => {
    e.preventDefault();
    return false;
  };

  // Handle clicks for stamp modes
  const handleCanvasClick = (e) => {
    const clientX = e.clientX;
    const clientY = e.clientY;

    // If in stamp mode, create a maple leaf stamp
    if (isStampMode) {
      console.log("Stamping maple leaf at", clientX, clientY);
      const newLeaf = {
        id: `maple-${Date.now()}-${Math.random()}`,
        x: clientX,
        y: clientY,
      };
      setMapleLeaves((prev) => [...prev, newLeaf]);
      return;
    }

    // If in daisy stamp mode, create a daisy stamp
    if (isDaisyStampMode) {
      console.log("Stamping daisy at", clientX, clientY);
      const newDaisy = {
        id: `daisy-${Date.now()}-${Math.random()}`,
        x: clientX,
        y: clientY,
      };
      setDaisies((prev) => [...prev, newDaisy]);
      return;
    }
  };

  // Track mouse move for cursor position
  const handleMouseMove = (e) => {
    if (isStampMode || isDaisyStampMode) {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    }
  };

  // Mouse/Touch drag handlers
  const handlePointerDown = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // Update cursor position for stamp modes
    setCursorPosition({ x: clientX, y: clientY });

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

    // If in daisy stamp mode, create a daisy stamp
    if (isDaisyStampMode) {
      console.log("Stamping daisy at", clientX, clientY);
      const newDaisy = {
        id: `daisy-${Date.now()}-${Math.random()}`,
        x: clientX,
        y: clientY,
      };
      setDaisies((prev) => [...prev, newDaisy]);
      return; // Don't start dragging in daisy stamp mode
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
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // Update cursor position for custom stamp cursor
    if (isStampMode || isDaisyStampMode) {
      setCursorPosition({ x: clientX, y: clientY });
    }

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

    // If daisy stamp mode is active and user starts dragging, disable daisy stamp mode
    if (isDaisyStampMode) {
      console.log("Drag detected - disabling daisy stamp mode");
      setIsDaisyStampMode(false);
      if (daisyStampModeTimer.current) {
        clearTimeout(daisyStampModeTimer.current);
        daisyStampModeTimer.current = null;
      }
    }

    // Calculate velocity for momentum
    velocity.current.x = clientX - lastPosition.current.x;
    velocity.current.y = clientY - lastPosition.current.y;

    lastPosition.current = { x: clientX, y: clientY };

    // Update target position directly for 1:1 drag feel
    const newX = clientX - dragStart.current.x;
    const newY = clientY - dragStart.current.y;

    targetPosition.current.x = Math.max(
      -maxDragDistance,
      Math.min(maxDragDistance, newX)
    );
    targetPosition.current.y = Math.max(
      -maxDragDistance,
      Math.min(maxDragDistance, newY)
    );
  };

  const handlePointerUp = () => {
    setIsDragging(false);

    if (containerRef.current) {
      containerRef.current.style.cursor = "grab";
    }

    // Apply momentum with GSAP
    const momentumMultiplier = 12;
    const maxMomentum = 400;
    const momentumX = Math.max(
      -maxMomentum,
      Math.min(maxMomentum, velocity.current.x * momentumMultiplier)
    );
    const momentumY = Math.max(
      -maxMomentum,
      Math.min(maxMomentum, velocity.current.y * momentumMultiplier)
    );

    gsap.to(targetPosition.current, {
      x: Math.max(
        -maxDragDistance,
        Math.min(maxDragDistance, targetPosition.current.x + momentumX)
      ),
      y: Math.max(
        -maxDragDistance,
        Math.min(maxDragDistance, targetPosition.current.y + momentumY)
      ),
      duration: 1.0,
      ease: "power2.out",
    });
  };

  // Wheel scroll handler
  const handleWheel = (e) => {
    e.preventDefault();

    // Limit maximum scroll speed and apply smoothing multiplier
    const maxDelta = 40;
    const smoothing = 0.8;
    const deltaX = Math.max(
      -maxDelta,
      Math.min(maxDelta, e.deltaX * smoothing)
    );
    const deltaY = Math.max(
      -maxDelta,
      Math.min(maxDelta, e.deltaY * smoothing)
    );

    // Update target position with scroll delta
    targetPosition.current.x = Math.max(
      -maxScrollDistance,
      Math.min(maxScrollDistance, targetPosition.current.x - deltaX)
    );
    targetPosition.current.y = Math.max(
      -maxScrollDistance,
      Math.min(maxScrollDistance, targetPosition.current.y - deltaY)
    );

    // Kill any ongoing animations for immediate response
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
  }, [maxScrollDistance]);

  // Track cursor position when stamp modes are active
  useEffect(() => {
    if (!isStampMode && !isDaisyStampMode) return;

    const updateCursorPos = (e) => {
      const clientX = e.clientX;
      const clientY = e.clientY;
      setCursorPosition({ x: clientX, y: clientY });
    };

    // Add listener to window to track cursor globally
    window.addEventListener("mousemove", updateCursorPos);

    return () => {
      window.removeEventListener("mousemove", updateCursorPos);
    };
  }, [isStampMode, isDaisyStampMode]);

  // Cleanup stamp mode timers and pumpkin spawn flag on unmount
  useEffect(() => {
    return () => {
      if (stampModeTimer.current) {
        clearTimeout(stampModeTimer.current);
      }
      if (daisyStampModeTimer.current) {
        clearTimeout(daisyStampModeTimer.current);
      }
      isPumpkinSpawning.current = false; // Reset global flag
      currentPumpkinBatch.current = null;
      pumpkinBatchCount.current = 0;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`pet-names-canvas ${
        isDaisyStampMode ? "daisy-stamp-mode" : ""
      } ${isStampMode ? "maple-stamp-mode" : ""}`}
      style={{ 
        cursor: isDaisyStampMode 
          ? "cell" 
          : isStampMode 
          ? "crosshair" 
          : "grab",
        pointerEvents: "auto"
      }}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      role="application"
      aria-label="Interactive pet images canvas - Drag to navigate, click on images to interact"
      aria-busy={!allLoaded}
    >
      {/* Screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "absolute",
          left: "-10000px",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      >
        {announcement}
      </div>

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
          role="status"
          aria-live="polite"
          aria-label={`Loading images: ${loadingProgress}% complete`}
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
            role="progressbar"
            aria-valuenow={loadingProgress}
            aria-valuemin={0}
            aria-valuemax={100}
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
            aria-hidden="true"
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
                      showEntrance={showEntrance}
                      reducedMotion={reducedMotion}
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
              peakY={pumpkin.peakY}
              onComplete={removePumpkin}
            />
          ))}

          {/* Render maple leaf stamps */}
          {mapleLeaves.map((leaf) => (
            <Stamp
              key={leaf.id}
              id={leaf.id}
              x={leaf.x}
              y={leaf.y}
              imageSrc="/pets/mapleleaf.png"
              imageAlt="maple leaf"
              size={80}
              onComplete={removeMapleLeaf}
            />
          ))}

          {/* Render daisy stamps */}
          {daisies.map((daisy) => (
            <Stamp
              key={daisy.id}
              id={daisy.id}
              x={daisy.x}
              y={daisy.y}
              imageSrc="/pets/daisy.png"
              imageAlt="daisy"
              size={30}
              onComplete={removeDaisy}
            />
          ))}

          {/* Custom cursor for stamp modes */}
          {isStampMode && (
            <CustomCursor
              imageSrc="/pets/mapleleaf.png"
              size={80}
              cursorPosition={cursorPosition}
            />
          )}
          {isDaisyStampMode && (
            <CustomCursor
              imageSrc="/pets/daisy.png"
              size={30}
              cursorPosition={cursorPosition}
            />
          )}
        </>
      )}
    </div>
  );
}
