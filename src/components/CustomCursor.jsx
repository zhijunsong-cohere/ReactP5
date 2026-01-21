import React from "react";

/**
 * Custom cursor component that follows the mouse in stamp mode
 */
function CustomCursor({ imageSrc, size, cursorPosition }) {
  if (!cursorPosition || cursorPosition.x === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: `${cursorPosition.x}px`,
        top: `${cursorPosition.y}px`,
        width: `${size}px`,
        height: `${size}px`,
        pointerEvents: "none",
        zIndex: 10000,
        transform: "translate(-50%, -50%)",
        opacity: 0.7,
      }}
      aria-hidden="true"
    >
      <img
        src={imageSrc}
        alt=""
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
    </div>
  );
}

export default CustomCursor;

