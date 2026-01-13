import React, { useRef, useEffect } from "react";
import p5 from "p5";
import InteractiveDrawingSketch from "../sketches/InteractiveDrawing.js";

const InteractiveDrawing = () => {
  const sketchRef = useRef();
  const p5InstanceRef = useRef();

  useEffect(() => {
    // Create p5 instance
    p5InstanceRef.current = new p5(InteractiveDrawingSketch, sketchRef.current);

    // Cleanup function
    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
      }
    };
  }, []);

  return (
    <div className="interactive-drawing-container">
      <div
        ref={sketchRef}
        className="interactive-drawing"
        style={{
          width: "100%",
          height: "100vh",
          overflow: "hidden",
        }}
      />
    </div>
  );
};

export default InteractiveDrawing;
