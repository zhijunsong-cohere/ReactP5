import React, { useRef, useEffect } from "react";
import gsap from "gsap";

/**
 * Generic stamp component for images (maple leaf, daisy, etc.)
 * Creates a temporary stamp that fades in, stays visible, then fades out
 */
function Stamp({ id, x, y, imageSrc, imageAlt, size = 80, onComplete }) {
  const stampRef = useRef(null);
  const initialRotation = useRef(Math.random() * 360); // Random initial rotation

  useEffect(() => {
    if (!stampRef.current) return;

    const tl = gsap.timeline({
      onComplete: () => {
        onComplete(id);
      },
    });

    // Fade in
    tl.fromTo(
      stampRef.current,
      {
        opacity: 0,
      },
      {
        opacity: 0.9,
        duration: 0.1,
        ease: "power2.out",
      }
    );

    // Simple fade out after staying visible
    tl.to(
      stampRef.current,
      {
        opacity: 0,
        duration: 0.5,
        ease: "power2.in",
      },
      "+=2.55" // Wait 2.55 seconds after fade in completes (total visible time: ~2.8s)
    );

    return () => {
      // Cleanup timeline on unmount only
      if (tl) {
        tl.kill();
      }
    };
  }, []); // Empty dependency array - run only once on mount

  const halfSize = size / 2;

  return (
    <div
      ref={stampRef}
      className="stamp"
      style={{
        position: "fixed",
        width: `${size}px`,
        height: `${size}px`,
        pointerEvents: "none",
        zIndex: 1000,
        left: `${x - halfSize}px`, // Center the stamp
        top: `${y - halfSize}px`,
        transform: `rotate(${initialRotation.current}deg)`, // Fixed initial rotation
      }}
    >
      <img
        src={imageSrc}
        alt={imageAlt}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </div>
  );
}

export default Stamp;

