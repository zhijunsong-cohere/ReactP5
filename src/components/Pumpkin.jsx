import React, { useRef, useEffect } from "react";
import gsap from "gsap";

/**
 * Pumpkin particle component that animates a pumpkin flying in a parabolic arc
 */
function Pumpkin({ id, startX, startY, targetX, targetY, peakY, onComplete }) {
  const pumpkinRef = useRef(null);

  useEffect(() => {
    if (!pumpkinRef.current) return;

    const tl = gsap.timeline({
      onComplete: () => onComplete(id),
    });

    const duration = 1.8 + Math.random() * 0.4;

    // Set initial state
    gsap.set(pumpkinRef.current, {
      x: startX,
      y: startY,
      scale: 0.2,
      rotation: 0,
      opacity: 1,
    });

    // Animate horizontal movement (constant velocity)
    tl.to(
      pumpkinRef.current,
      {
        x: targetX,
        duration: duration,
        ease: "none", // Linear movement
      },
      0
    );

    // Animate vertical movement (parabolic arc - throw up and fall down)
    tl.to(
      pumpkinRef.current,
      {
        y: peakY,
        duration: duration * 0.4, // 40% of time going up
        ease: "power2.out", // Decelerate as it goes up
      },
      0
    );

    tl.to(
      pumpkinRef.current,
      {
        y: targetY,
        duration: duration * 0.6, // 60% of time falling down
        ease: "power2.in", // Accelerate as it falls (gravity)
      },
      duration * 0.4 // Start after upward motion
    );

    // Scale up as it launches
    tl.to(
      pumpkinRef.current,
      {
        scale: 1,
        duration: 0.3,
        ease: "back.out(2)",
      },
      0
    );

    // Rotation throughout the motion
    tl.to(
      pumpkinRef.current,
      {
        rotation: Math.random() * 720 - 360,
        duration: duration,
        ease: "none",
      },
      0
    );

    // Fade out at the end
    tl.to(
      pumpkinRef.current,
      {
        opacity: 0,
        duration: 0.4,
        ease: "power2.in",
      },
      duration - 0.4 // Start fading near the end
    );

    return () => {
      tl.kill();
    };
  }, [startX, startY, targetX, targetY, peakY, id, onComplete]);

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

export default Pumpkin;

