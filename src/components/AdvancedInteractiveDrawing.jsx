import React, { useRef, useEffect } from "react";
import p5 from "p5";
import AdvancedInteractiveDrawingSketch from "../sketches/AdvancedInteractiveDrawing.js";

const AdvancedInteractiveDrawing = () => {
  const sketchRef = useRef();
  const p5InstanceRef = useRef();

  useEffect(() => {
    // Create p5 instance
    p5InstanceRef.current = new p5(
      AdvancedInteractiveDrawingSketch,
      sketchRef.current
    );

    // Cleanup function
    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
      }
    };
  }, []);

  return (
    <div className="advanced-drawing-container">
      <div
        ref={sketchRef}
        className="advanced-drawing"
        style={{
          width: "100%",
          height: "100vh",
          overflow: "hidden",
          borderRadius: "12px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
        }}
      />
    </div>
  );
};

export default AdvancedInteractiveDrawing;
