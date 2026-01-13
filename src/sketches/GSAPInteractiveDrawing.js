import { gsap } from "gsap";

export default class GSAPInteractiveDrawing {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.isDrawing = false;
    this.drawingPath = [];
    this.smoothPath = [];
    this.droppedVertices = []; // Store dropped vertices permanently
    this.nodes = [];
    this.nodeImages = [];
    this.lastMousePos = { x: 0, y: 0 };
    this.nextNodeIndex = 0;
    this.imagesLoaded = false;
    this.animationId = null;
    this.titleSvg = null;
    this.titleSvgLoaded = false;
    this.svgBounds = { x: 0, y: 0, width: 0, height: 0 };

    // Image paths
    this.imagePaths = [
      "/pet1.png",
      "/pet2.png",
      "/pet3.png",
      "/pet4.png",
      "/pet5.png",
      "/pet6.png",
      "/pet7.png",
      "/pet8.png",
    ];

    this.init();
  }

  init() {
    this.setupCanvas();
    this.preloadImages();
    this.setupEventListeners();
    this.startAnimation();
  }

  setupCanvas() {
    // Get device pixel ratio for high-DPI displays
    const dpr = window.devicePixelRatio || 1;

    // Set actual canvas size accounting for device pixel ratio
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;

    // Scale CSS size back to normal
    this.canvas.style.width = window.innerWidth + "px";
    this.canvas.style.height = window.innerHeight + "px";
    this.canvas.style.cursor = "crosshair";

    // Scale the drawing context to match device pixel ratio
    this.ctx.scale(dpr, dpr);

    // Enable high-quality image rendering
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = "high";

    // Store DPR for later use
    this.devicePixelRatio = dpr;
  }

  preloadImages() {
    let loadedCount = 0;
    const totalAssets = this.imagePaths.length + 1; // +1 for SVG

    // Load pet images
    this.imagePaths.forEach((path, index) => {
      const img = new Image();
      img.onload = () => {
        console.log(`Image loaded: ${path}`);
        loadedCount++;
        if (loadedCount === totalAssets) {
          this.imagesLoaded = true;
          console.log("All assets loaded!");
        }
      };
      img.onerror = () => {
        console.log(`Failed to load: ${path}`);
        loadedCount++;
        if (loadedCount === totalAssets) {
          this.imagesLoaded = true;
        }
      };
      img.src = path;
      this.nodeImages[index] = img;
    });

    // Load title SVG
    const svgImg = new Image();
    svgImg.onload = () => {
      console.log("Title SVG loaded!");
      this.titleSvgLoaded = true;

      // Calculate SVG position (center of canvas)
      const svgWidth = Math.min(400, window.innerWidth * 0.4);
      const svgHeight = (svgImg.height / svgImg.width) * svgWidth;

      this.svgBounds = {
        x: (window.innerWidth - svgWidth) / 2,
        y: (window.innerHeight - svgHeight) / 2,
        width: svgWidth,
        height: svgHeight,
      };

      loadedCount++;
      if (loadedCount === totalAssets) {
        this.imagesLoaded = true;
        console.log("All assets loaded!");
      }
    };
    svgImg.onerror = () => {
      console.log("Failed to load title SVG");
      loadedCount++;
      if (loadedCount === totalAssets) {
        this.imagesLoaded = true;
      }
    };
    svgImg.src = "/title.svg";
    this.titleSvg = svgImg;
  }

  setupEventListeners() {
    // Mouse events
    this.canvas.addEventListener("mousedown", (e) => this.onMouseDown(e));
    this.canvas.addEventListener("mousemove", (e) => this.onMouseMove(e));
    this.canvas.addEventListener("mouseup", () => this.onMouseUp());
    this.canvas.addEventListener("mouseleave", () => this.onMouseUp());

    // Touch events for mobile
    this.canvas.addEventListener("touchstart", (e) => this.onTouchStart(e));
    this.canvas.addEventListener("touchmove", (e) => this.onTouchMove(e));
    this.canvas.addEventListener("touchend", () => this.onMouseUp());

    // Keyboard events
    window.addEventListener("keydown", (e) => this.onKeyDown(e));
    window.addEventListener("resize", () => this.onResize());
  }

  getMousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    return {
      x: ((e.clientX - rect.left) * scaleX) / this.devicePixelRatio,
      y: ((e.clientY - rect.top) * scaleY) / this.devicePixelRatio,
    };
  }

  getTouchPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    return {
      x: ((e.touches[0].clientX - rect.left) * scaleX) / this.devicePixelRatio,
      y: ((e.touches[0].clientY - rect.top) * scaleY) / this.devicePixelRatio,
    };
  }

  onMouseDown(e) {
    this.isDrawing = true;
    this.drawingPath = [];
    // Don't clear dropped vertices - keep previous lines
    // this.droppedVertices = []; // Keep previous drawings
    this.nextNodeIndex = 0;
    const pos = this.getMousePos(e);
    this.drawingPath.push(pos);
    this.lastMousePos = pos;
  }

  onMouseMove(e) {
    if (!this.isDrawing) return;

    const pos = this.getMousePos(e);
    const distance = Math.sqrt(
      Math.pow(pos.x - this.lastMousePos.x, 2) +
        Math.pow(pos.y - this.lastMousePos.y, 2)
    );

    if (distance > 5) {
      this.drawingPath.push(pos);
      this.lastMousePos = pos;
      this.createSmoothPath();
    }
  }

  onMouseUp() {
    if (this.isDrawing) {
      this.isDrawing = false;
      this.createSmoothPath();
    }
  }

  onTouchStart(e) {
    e.preventDefault();
    const pos = this.getTouchPos(e);
    this.onMouseDown({
      clientX: pos.x + this.canvas.offsetLeft,
      clientY: pos.y + this.canvas.offsetTop,
    });
  }

  onTouchMove(e) {
    e.preventDefault();
    const pos = this.getTouchPos(e);
    this.onMouseMove({
      clientX: pos.x + this.canvas.offsetLeft,
      clientY: pos.y + this.canvas.offsetTop,
    });
  }

  onKeyDown(e) {
    if (e.key === " ") {
      e.preventDefault();
      this.clearCanvas();
    }
  }

  onResize() {
    const dpr = window.devicePixelRatio || 1;

    // Set actual canvas size accounting for device pixel ratio
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;

    // Scale CSS size back to normal
    this.canvas.style.width = window.innerWidth + "px";
    this.canvas.style.height = window.innerHeight + "px";

    // Scale the drawing context to match device pixel ratio
    this.ctx.scale(dpr, dpr);

    // Re-enable high-quality rendering
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = "high";

    this.devicePixelRatio = dpr;

    // Recalculate SVG bounds on resize
    if (this.titleSvg && this.titleSvgLoaded) {
      const svgWidth = Math.min(400, window.innerWidth * 0.4);
      const svgHeight = (this.titleSvg.height / this.titleSvg.width) * svgWidth;

      this.svgBounds = {
        x: (window.innerWidth - svgWidth) / 2,
        y: (window.innerHeight - svgHeight) / 2,
        width: svgWidth,
        height: svgHeight,
      };
    }
  }

  clearCanvas() {
    // Only clear everything when explicitly called (spacebar)
    this.drawingPath = [];
    this.smoothPath = [];
    this.droppedVertices = []; // Clear all dropped vertices

    // Animate nodes out before removing them
    this.nodes.forEach((node, index) => {
      gsap.to(node, {
        duration: 0.5,
        scale: 0,
        rotation: 360,
        ease: "back.in",
        delay: index * 0.05,
        onComplete: () => {
          const nodeIndex = this.nodes.indexOf(node);
          if (nodeIndex > -1) {
            this.nodes.splice(nodeIndex, 1);
          }
        },
      });
    });

    this.nextNodeIndex = 0;
  }

  createSmoothPath() {
    if (this.drawingPath.length < 2) return;

    const prevLength = this.smoothPath.length;
    // Create temporary array for current stroke instead of clearing smoothPath
    const currentStroke = [];

    for (let i = 0; i < this.drawingPath.length - 1; i++) {
      const current = this.drawingPath[i];
      const next = this.drawingPath[i + 1];

      currentStroke.push(current);

      // Add interpolated points for smoother curves
      const steps = 5;
      for (let j = 1; j < steps; j++) {
        const t = j / steps;
        const x = current.x + (next.x - current.x) * t;
        const y = current.y + (next.y - current.y) * t;
        currentStroke.push({ x, y });
      }
    }

    if (this.drawingPath.length > 0) {
      currentStroke.push(this.drawingPath[this.drawingPath.length - 1]);
    }

    // Add new stroke points to existing smoothPath
    this.smoothPath = this.smoothPath.concat(currentStroke);

    // Only generate new dropped vertices for new points
    if (this.smoothPath.length > prevLength) {
      for (let i = prevLength; i < this.smoothPath.length; i++) {
        // Stable random decision based on point index, not random each frame
        const seed = i * 12345; // Simple deterministic seed
        const pseudoRandom = ((seed * 9301 + 49297) % 233280) / 233280;

        if (pseudoRandom < 0.3) {
          const point = this.smoothPath[i];
          const randomImageIndex =
            Math.floor(pseudoRandom * this.imagePaths.length * 8) %
            this.imagePaths.length;

          this.droppedVertices.push({
            x: point.x,
            y: point.y,
            imageIndex: randomImageIndex,
            index: i,
          });
        }
      }
    }
  }

  checkCollision(x, y, minDistance = 120) {
    // Check collision with other nodes
    for (const node of this.nodes) {
      const distance = Math.sqrt(
        Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2)
      );
      if (distance < minDistance) {
        return true;
      }
    }

    // Check collision with SVG bounds
    if (this.svgBounds && this.titleSvgLoaded) {
      const margin = 80; // Keep nodes away from SVG
      if (
        x > this.svgBounds.x - margin &&
        x < this.svgBounds.x + this.svgBounds.width + margin &&
        y > this.svgBounds.y - margin &&
        y < this.svgBounds.y + this.svgBounds.height + margin
      ) {
        return true;
      }
    }

    return false;
  }

  findSafePosition(targetX, targetY, maxAttempts = 10) {
    for (let attempts = 0; attempts < maxAttempts; attempts++) {
      const offsetX = (Math.random() - 0.5) * 160; // -80 to 80
      const offsetY = (Math.random() - 0.5) * 160;
      const newX = Math.max(
        80,
        Math.min(this.canvas.width - 80, targetX + offsetX)
      );
      const newY = Math.max(
        80,
        Math.min(this.canvas.height - 80, targetY + offsetY)
      );

      if (!this.checkCollision(newX, newY)) {
        return { x: newX, y: newY };
      }
    }
    return null;
  }

  createNode(x, y, imageIndex) {
    const node = {
      x: x,
      y: y,
      radius: 60,
      scale: 0, // Start invisible
      rotation: 0,
      animationPhase: Math.random() * Math.PI * 2,
      pulsePhase: Math.random() * Math.PI * 2,
      imageIndex: imageIndex,
      image: this.nodeImages[imageIndex],
      hue: Math.random() * 360,
      timeline: gsap.timeline(),
    };

    // Animate node in
    node.timeline.to(node, {
      duration: 0.8,
      scale: 1,
      ease: "back.out(1.7)",
    });

    // Add floating animation
    gsap.to(node, {
      duration: 3 + Math.random() * 2,
      y: node.y + (Math.random() - 0.5) * 20,
      ease: "sine.inOut",
      yoyo: false,
      repeat: -1,
    });

    return node;
  }

  generateNodesOnPath() {
    if (this.smoothPath.length < 10) return;
    if (this.nodes.length >= 20) return;

    const stepSize = 15;
    const targetIndex = this.nextNodeIndex * stepSize;

    if (targetIndex < this.smoothPath.length) {
      const point = this.smoothPath[targetIndex];
      const safePosition = this.findSafePosition(point.x, point.y);

      if (safePosition) {
        const imageIndex = this.nodes.length % this.imagePaths.length;
        const node = this.createNode(
          safePosition.x,
          safePosition.y,
          imageIndex
        );
        this.nodes.push(node);
      }

      this.nextNodeIndex++;
    }
  }

  updateNodes() {
    this.nodes.forEach((node) => {
      node.animationPhase += 0.02;
      node.pulsePhase += 0.03;

      // Collision avoidance
      let repelForceX = 0;
      let repelForceY = 0;
      const minDistance = 120;

      // Repel from other nodes
      for (const other of this.nodes) {
        if (other === node) continue;

        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance && distance > 0) {
          const angle = Math.atan2(dy, dx);
          const force = (minDistance - distance) * 0.02;

          repelForceX += Math.cos(angle) * force;
          repelForceY += Math.sin(angle) * force;
        }
      }

      // Repel from SVG bounds
      if (this.svgBounds && this.titleSvgLoaded) {
        const svgMargin = 100;
        const svgCenterX = this.svgBounds.x + this.svgBounds.width / 2;
        const svgCenterY = this.svgBounds.y + this.svgBounds.height / 2;

        // Check if node is within SVG influence area
        if (
          node.x > this.svgBounds.x - svgMargin &&
          node.x < this.svgBounds.x + this.svgBounds.width + svgMargin &&
          node.y > this.svgBounds.y - svgMargin &&
          node.y < this.svgBounds.y + this.svgBounds.height + svgMargin
        ) {
          // Calculate repulsion from SVG center
          const dx = node.x - svgCenterX;
          const dy = node.y - svgCenterY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 0) {
            const force = 0.8; // Strong repulsion from SVG
            repelForceX += (dx / distance) * force;
            repelForceY += (dy / distance) * force;
          }
        }
      }

      // Apply repel force with GSAP for smooth movement
      if (Math.abs(repelForceX) > 0.1 || Math.abs(repelForceY) > 0.1) {
        gsap.to(node, {
          duration: 0.3,
          x: Math.max(
            node.radius,
            Math.min(this.canvas.width - node.radius, node.x + repelForceX)
          ),
          y: Math.max(
            node.radius,
            Math.min(this.canvas.height - node.radius, node.y + repelForceY)
          ),
          ease: "power2.out",
        });
      }
    });
  }

  drawAnimatedBackground() {
    // Create parchment base colors
    const parchmentColors = [
      "#F4E8D0", // Cream
      "#E8D5B7", // Light tan
      "#DCC59A", // Darker tan
      "#D4B896", // Aged beige
      "#C9A876", // Worn brown
    ];

    // Fill with base parchment color
    const gradient = this.ctx.createRadialGradient(
      this.canvas.width * 0.3,
      this.canvas.height * 0.2,
      0,
      this.canvas.width * 0.7,
      this.canvas.height * 0.8,
      Math.max(this.canvas.width, this.canvas.height)
    );

    gradient.addColorStop(0, "#F7F0E3"); // Light center
    gradient.addColorStop(0.7, "#E8D5B7"); // Mid tone
    gradient.addColorStop(1, "#D4B896"); // Darker edges

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Add parchment texture with noise
    this.drawParchmentTexture();

    // Add subtle aging stains
    this.drawAgingStains();

    // Add paper grain effect
    this.drawPaperGrain();
  }

  drawParchmentTexture() {
    const imageData = this.ctx.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );
    const data = imageData.data;

    // Add random noise for texture
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 20; // Subtle noise
      data[i] += noise; // Red
      data[i + 1] += noise; // Green
      data[i + 2] += noise; // Blue
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  drawAgingStains() {
    // Create random aging spots
    const numStains = 8;
    for (let i = 0; i < numStains; i++) {
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * this.canvas.height;
      const size = 50 + Math.random() * 100;

      const stainGradient = this.ctx.createRadialGradient(x, y, 0, x, y, size);
      stainGradient.addColorStop(0, "rgba(139, 115, 85, 0.03)");
      stainGradient.addColorStop(0.5, "rgba(160, 130, 98, 0.02)");
      stainGradient.addColorStop(1, "rgba(139, 115, 85, 0)");

      this.ctx.fillStyle = stainGradient;
      this.ctx.fillRect(x - size, y - size, size * 2, size * 2);
    }
  }

  drawPaperGrain() {
    // Create subtle paper grain lines
    this.ctx.globalAlpha = 0.03;
    this.ctx.strokeStyle = "#8B7355";
    this.ctx.lineWidth = 0.5;

    // Horizontal grain lines
    for (let y = 0; y < this.canvas.height; y += 3 + Math.random() * 2) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y + (Math.random() - 0.5) * 2);
      this.ctx.stroke();
    }

    // Vertical grain lines (lighter)
    this.ctx.globalAlpha = 0.02;
    for (let x = 0; x < this.canvas.width; x += 4 + Math.random() * 3) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x + (Math.random() - 0.5) * 2, this.canvas.height);
      this.ctx.stroke();
    }

    this.ctx.globalAlpha = 1; // Reset alpha
  }

  drawSmoothLine() {
    if (this.smoothPath.length < 2) return;

    // Enable anti-aliasing for smooth strokes
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";

    // Draw solid stroke with high saturation colors
    const vibrantColors = [
      "#FF3366", // Bright red-pink
      "#FF6600", // Vibrant orange
      "#3366FF", // Electric blue
      "#CC33FF", // Bright purple
      "#00FF66", // Neon green
    ];

    // Pick a random vibrant color for this stroke
    const colorIndex =
      Math.floor(Math.abs(this.smoothPath[0]?.x || 0) * 123) %
      vibrantColors.length;
    const strokeColor = vibrantColors[colorIndex];

    // Draw main solid stroke
    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = 6; // Solid, medium thickness

    this.ctx.beginPath();

    // Create a set of dropped vertex indices
    const droppedSet = new Set(this.droppedVertices.map((v) => v.index));

    let pathStarted = false;

    for (let j = 0; j < this.smoothPath.length; j++) {
      const point = this.smoothPath[j];

      // Skip this vertex if it's in the dropped set
      if (droppedSet.has(j)) {
        // If we were drawing a path, finish it
        if (pathStarted) {
          this.ctx.stroke();
          pathStarted = false;
        }
        continue;
      }

      // Start or continue the path
      if (!pathStarted) {
        this.ctx.beginPath();
        this.ctx.moveTo(point.x, point.y);
        pathStarted = true;
      } else {
        this.ctx.lineTo(point.x, point.y);
      }
    }

    // Finish the final path segment
    if (pathStarted) {
      this.ctx.stroke();
    }

    // Draw the dropped vertex images (stable)
    this.droppedVertices.forEach((droppedVertex) => {
      for (let i = 0; i < 3; i++) {
        // Draw for multiple glow layers
        this.drawDroppedVertexImage(droppedVertex, i);
      }
    });
  }

  drawDroppedVertexImage(droppedVertex, glowLayer) {
    const img = this.nodeImages[droppedVertex.imageIndex];

    if (img && img.complete && this.imagesLoaded) {
      // Use node-sized images for better clarity (same as node radius * 1.5)
      const baseSize = 60 * 1.5; // Same as node image size (90px)
      const size = baseSize + glowLayer * 5; // Slight size variation for glow layers

      this.ctx.save();

      // Better alpha for clearer images
      this.ctx.globalAlpha = glowLayer === 0 ? 0.9 : 0.3 - glowLayer * 0.1;

      // Create circular clipping path
      this.ctx.beginPath();
      this.ctx.arc(droppedVertex.x, droppedVertex.y, size / 2, 0, Math.PI * 2);
      this.ctx.clip();

      // Enable maximum quality scaling for crisp images
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = "high";

      // Draw image with better quality and proper sizing
      this.ctx.drawImage(
        img,
        droppedVertex.x - size / 2,
        droppedVertex.y - size / 2,
        size,
        size
      );

      this.ctx.restore();

      // Add a subtle border for the main image (glowLayer 0)
      if (glowLayer === 0) {
        this.ctx.save();
        this.ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(
          droppedVertex.x,
          droppedVertex.y,
          size / 2,
          0,
          Math.PI * 2
        );
        this.ctx.stroke();
        this.ctx.restore();
      }
    }
  }

  drawNode(node) {
    this.ctx.save();
    this.ctx.translate(node.x, node.y);
    this.ctx.scale(node.scale, node.scale);
    this.ctx.rotate((node.rotation * Math.PI) / 180);

    const floatOffset = Math.sin(node.animationPhase) * 4;
    const pulseEffect = 1 + Math.sin(node.pulsePhase) * 0.05;

    this.ctx.translate(0, floatOffset);
    this.ctx.scale(pulseEffect, pulseEffect);

    // Draw glow rings
    for (let i = 0; i < 5; i++) {
      this.ctx.fillStyle = `hsla(${node.hue}, 70%, 70%, ${(20 - i * 3) / 255})`;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, (node.radius * 2 + i * 10) / 2, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Draw main circle
    this.ctx.fillStyle = `hsl(${node.hue}, 70%, 60%)`;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, node.radius * 0.9, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw image if loaded
    if (node.image && node.image.complete && this.imagesLoaded) {
      const imgSize = node.radius * 1.5;

      this.ctx.save();
      // Create circular clipping path
      this.ctx.beginPath();
      this.ctx.arc(0, 0, imgSize / 2, 0, Math.PI * 2);
      this.ctx.clip();

      // Enable high-quality scaling for this image
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = "high";

      // Draw image with better quality
      this.ctx.drawImage(
        node.image,
        -imgSize / 2,
        -imgSize / 2,
        imgSize,
        imgSize
      );

      this.ctx.restore();
    }

    // Draw border
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, node.radius * 0.9, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawTitleSvg() {
    if (this.titleSvg && this.titleSvgLoaded && this.svgBounds) {
      this.ctx.save();
      this.ctx.globalAlpha = 0.8;

      // Enable high-quality scaling for SVG
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = "high";

      this.ctx.drawImage(
        this.titleSvg,
        this.svgBounds.x,
        this.svgBounds.y,
        this.svgBounds.width,
        this.svgBounds.height
      );

      this.ctx.restore();
    }
  }

  drawInstructions() {
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    this.ctx.font = "16px Arial";
    this.ctx.textAlign = "center";

    this.ctx.fillText(
      "Click and drag to draw - pet nodes appear in real-time!",
      this.canvas.width / 2,
      40
    );
    this.ctx.fillText(
      "Nodes spawn sequentially along your drawing path",
      this.canvas.width / 2,
      60
    );
    this.ctx.fillText(
      "Press SPACE to clear with animation",
      this.canvas.width / 2,
      80
    );
  }

  animate() {
    // Clear canvas
    this.drawAnimatedBackground();

    // Generate nodes while drawing
    if (this.isDrawing && this.smoothPath.length > 5) {
      // Generate nodes every few frames
      if (Date.now() % 200 < 16) {
        // Roughly every 200ms
        this.generateNodesOnPath();
      }
    }

    // Update nodes
    this.updateNodes();

    // Draw smooth line
    this.drawSmoothLine();

    // Draw title SVG
    this.drawTitleSvg();

    // Draw all nodes
    // this.nodes.forEach((node) => {
    //   this.drawNode(node);
    // });

    // Draw instructions
    this.drawInstructions();

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  startAnimation() {
    this.animate();
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    // Kill all GSAP animations
    this.nodes.forEach((node) => {
      if (node.timeline) {
        node.timeline.kill();
      }
    });
    gsap.killTweensOf(this.nodes);

    // Remove event listeners
    this.canvas.removeEventListener("mousedown", this.onMouseDown);
    this.canvas.removeEventListener("mousemove", this.onMouseMove);
    this.canvas.removeEventListener("mouseup", this.onMouseUp);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("resize", this.onResize);
  }
}
