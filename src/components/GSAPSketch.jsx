import { useEffect, useRef } from "react";
import GSAPInteractiveDrawing from "../sketches/GSAPInteractiveDrawing.js";

export function GSAPSketch() {
  const canvasRef = useRef();
  const drawingInstanceRef = useRef();

  useEffect(() => {
    // Clean up any existing instance
    if (drawingInstanceRef.current) {
      drawingInstanceRef.current.destroy();
    }

    // Create new GSAP drawing instance
    if (canvasRef.current) {
      drawingInstanceRef.current = new GSAPInteractiveDrawing(
        canvasRef.current
      );
    }

    // Cleanup function
    return () => {
      if (drawingInstanceRef.current) {
        drawingInstanceRef.current.destroy();
        drawingInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: "block",
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        background: "transparent",
      }}
    />
  );
}
