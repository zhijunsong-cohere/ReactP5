import { useEffect, useRef } from "react";
import p5 from "p5";

export function P5Sketch({ sketch }) {
  const containerRef = useRef();
  const p5InstanceRef = useRef();
  const isCleaningUpRef = useRef(false);

  useEffect(() => {
    // Prevent multiple instances during cleanup
    if (isCleaningUpRef.current) return;

    // Clean up any existing instance first (handles StrictMode double-mounting)
    if (p5InstanceRef.current) {
      isCleaningUpRef.current = true;
      try {
        p5InstanceRef.current.remove();
      } catch (error) {
        console.warn("Error during p5 cleanup:", error);
      }
      p5InstanceRef.current = null;
      isCleaningUpRef.current = false;
    }

    // Small delay to ensure proper cleanup before creating new instance
    const timer = setTimeout(() => {
      if (containerRef.current && !isCleaningUpRef.current) {
        try {
          p5InstanceRef.current = new p5(sketch, containerRef.current);
        } catch (error) {
          console.error("Error creating p5 instance:", error);
        }
      }
    }, 10);

    // Cleanup function to remove the p5 instance when component unmounts
    return () => {
      clearTimeout(timer);
      if (p5InstanceRef.current && !isCleaningUpRef.current) {
        isCleaningUpRef.current = true;
        try {
          p5InstanceRef.current.remove();
        } catch (error) {
          console.warn("Error during p5 cleanup:", error);
        }
        p5InstanceRef.current = null;
        isCleaningUpRef.current = false;
      }
    };
  }, [sketch]);

  return <div ref={containerRef}></div>;
}
