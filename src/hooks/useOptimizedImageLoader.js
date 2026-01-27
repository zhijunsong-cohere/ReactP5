/**
 * Optimized image preloader with priority loading
 * Loads critical images first, then progressively loads remaining assets
 */
export const useOptimizedImageLoader = (petImages, onProgress) => {
  const [isReady, setIsReady] = React.useState(false);
  
  React.useEffect(() => {
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
    
    // Load first 12 images (visible on load) with high priority
    const criticalImages = petImages.slice(0, 12);
    const secondaryImages = petImages.slice(12);
    const allImages = [...petImages, ...specialImages];

    let loadedCount = 0;
    const totalImages = allImages.length;
    let cancelled = false;

    const loadImage = (src, timeout = 5000) => {
      return new Promise((resolve) => {
        if (cancelled) {
          resolve();
          return;
        }
        
        const img = new Image();
        img.src = src;
        
        const onComplete = () => {
          if (!cancelled) {
            loadedCount++;
            onProgress?.(Math.floor((loadedCount / totalImages) * 100));
          }
          resolve();
        };
        
        img.onload = onComplete;
        img.onerror = () => {
          console.warn(`Failed to load: ${src}`);
          onComplete();
        };
        
        // Timeout fallback
        setTimeout(onComplete, timeout);
      });
    };

    // Load critical images first
    Promise.all(criticalImages.map((src) => loadImage(src, 3000))).then(() => {
      if (cancelled) return;
      
      // Show canvas early with critical content loaded
      setIsReady(true);
      
      // Load remaining images in background using idle time
      const loadSecondary = () => {
        if (cancelled) return;
        Promise.all([...secondaryImages, ...specialImages].map((src) => loadImage(src, 8000)));
      };
      
      if (window.requestIdleCallback) {
        requestIdleCallback(loadSecondary, { timeout: 2000 });
      } else {
        setTimeout(loadSecondary, 100);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [petImages, onProgress]);
  
  return isReady;
};

