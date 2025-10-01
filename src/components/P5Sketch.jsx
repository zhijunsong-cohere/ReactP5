import { useEffect, useRef } from 'react';
import p5 from 'p5';

export function P5Sketch({ sketch }) {
  const containerRef = useRef();
  const p5InstanceRef = useRef();

  useEffect(() => {
    // Create the p5 instance
    p5InstanceRef.current = new p5(sketch, containerRef.current);

    // Cleanup function to remove the p5 instance when component unmounts
    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
      }
    };
  }, [sketch]);

  return <div ref={containerRef}></div>;
}
