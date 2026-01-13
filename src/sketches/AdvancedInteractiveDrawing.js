import p5 from "p5";

export default function AdvancedInteractiveDrawing(p) {
  let drawingPath = [];
  let isDrawing = false;
  let smoothPath = [];
  let nodes = [];
  let nodeImages = [];
  let lastMousePos = { x: 0, y: 0 };
  let imagesLoaded = false;
  let nextNodeIndex = 0; // Track which vertex to place the next node on

  // Load some sample images for nodes - using public folder paths
  const imagePaths = [
    "/pet1.png",
    "/pet2.png",
    "/pet3.png",
    "/pet4.png",
    "/pet5.png",
    "/pet6.png",
    "/pet7.png",
    "/pet8.png",
  ];

  // Preload all images
  function preloadImages() {
    let loadedCount = 0;

    imagePaths.forEach((path, index) => {
      nodeImages[index] = p.loadImage(
        path,
        () => {
          console.log(`Image loaded: ${path}`);
          loadedCount++;
          if (loadedCount === imagePaths.length) {
            imagesLoaded = true;
            console.log("All images loaded!");
          }
        },
        () => {
          console.log(`Failed to load: ${path}`);
          loadedCount++;
          if (loadedCount === imagePaths.length) {
            imagesLoaded = true;
          }
        }
      );
    });
  }

  // Node class for circular nodes on the line
  class CircleNode {
    constructor(x, y, imageIndex = null) {
      this.x = x;
      this.y = y;
      this.radius = 60;
      this.targetRadius = 60;
      this.image = null;
      this.imageIndex = imageIndex;
      this.animationPhase = Math.random() * Math.PI * 2;
      this.pulsePhase = Math.random() * Math.PI * 2;
      this.color = p.color(p.random(360), 70, 90);

      // Use preloaded image if available
      if (imageIndex !== null && nodeImages[imageIndex]) {
        this.image = nodeImages[imageIndex];
      }
    }

    update() {
      this.animationPhase += 0.02;
      this.pulsePhase += 0.03;

      // Gentle floating animation
      this.radius = this.targetRadius;

      // Collision avoidance - repel from other nodes
      this.avoidCollisions();
    }

    avoidCollisions() {
      let repelForce = { x: 0, y: 0 };
      let minDistance = 120; // Minimum distance between nodes

      for (let other of nodes) {
        if (other === this) continue; // Skip self

        let distance = p.dist(this.x, this.y, other.x, other.y);
        if (distance < minDistance && distance > 0) {
          // Calculate repel direction
          // let angle = Math.atan2(this.y - other.y, this.x - other.x);
          let force = (minDistance - distance) * 0.02; // Repel strength
        }
      }

      // // Apply repel force
      // this.x += repelForce.x;
      // this.y += repelForce.y;

      // Keep nodes within canvas bounds
      this.x = p.constrain(this.x, this.radius, p.width - this.radius);
      this.y = p.constrain(this.y, this.radius, p.height - this.radius);
    }

    draw() {
      p.push();
      p.translate(this.x, this.y);

      // Draw main circle background
      p.fill(this.color);
      p.noStroke();
      p.circle(0, 0, this.radius * 1.8);

      // Draw image if loaded with circular clipping
      if (this.image && this.image.width > 0 && imagesLoaded) {
        p.push();

        // Calculate image scaling to fit circle
        let imgSize = this.radius * 1.5;
        let scale = Math.max(
          imgSize / this.image.width,
          imgSize / this.image.height
        );
        let scaledWidth = this.image.width * scale;
        let scaledHeight = this.image.height * scale;

        // Use clip() for circular masking - more reliable
        p.push();

        // Create circular clipping path
        let clipPath = p.createGraphics(imgSize, imgSize);
        clipPath.fill(255);
        clipPath.noStroke();
        clipPath.circle(imgSize / 2, imgSize / 2, imgSize);

        // Draw image with circular clipping using drawingContext
        p.drawingContext.save();
        p.drawingContext.beginPath();
        p.drawingContext.arc(0, 0, imgSize / 2, 0, Math.PI * 2);
        p.drawingContext.clip();

        // Draw the image
        p.image(
          this.image,
          -scaledWidth / 2,
          -scaledHeight / 2,
          scaledWidth,
          scaledHeight
        );

        p.drawingContext.restore();
        p.pop();

        p.pop();
      }

      // Draw border
      p.stroke(255, 200);
      p.strokeWeight(3);
      p.noFill();
      p.circle(0, 0, this.radius * 1.8);

      p.pop();
    }
  }

  // Smooth the drawing path using interpolation
  function createSmoothPath() {
    if (drawingPath.length < 2) return;

    smoothPath = [];

    // Add points with interpolation for smoother curves
    for (let i = 0; i < drawingPath.length - 1; i++) {
      let current = drawingPath[i];
      let next = drawingPath[i + 1];

      smoothPath.push(current);

      // Add interpolated points for smoother curves
      let steps = 5;
      for (let j = 1; j < steps; j++) {
        let t = j / steps;
        let x = p.lerp(current.x, next.x, t);
        let y = p.lerp(current.y, next.y, t);
        smoothPath.push({ x, y });
      }
    }

    // Add the last point
    if (drawingPath.length > 0) {
      smoothPath.push(drawingPath[drawingPath.length - 1]);
    }
  }

  // Check if a position collides with existing nodes
  function checkCollision(x, y, minDistance = 120) {
    for (let node of nodes) {
      let distance = p.dist(x, y, node.x, node.y);
      if (distance < minDistance) {
        return true; // Collision detected
      }
    }
    return false; // No collision
  }

  // Find a safe position near the target point
  function findSafePosition(targetX, targetY, maxAttempts = 10) {
    for (let attempts = 0; attempts < maxAttempts; attempts++) {
      let offsetX = p.random(-80, 80);
      let offsetY = p.random(-80, 80);
      let newX = targetX + offsetX;
      let newY = targetY + offsetY;

      // Keep position within canvas bounds
      newX = p.constrain(newX, 80, p.width - 80);
      newY = p.constrain(newY, 80, p.height - 80);

      if (!checkCollision(newX, newY)) {
        return { x: newX, y: newY };
      }
    }

    // If no safe position found, return null to skip this node
    return null;
  }

  // Generate nodes sequentially along the drawn path (called during drawing)
  function generateNodesOnPath() {
    if (smoothPath.length < 10) return;

    // Don't clear existing nodes - keep adding new ones
    // Only generate if we don't have too many nodes already
    if (nodes.length >= 20) return;

    // Add node sequentially - every 15 vertices along the path
    let stepSize = 15; // Distance between nodes on the path
    let targetIndex = nextNodeIndex * stepSize;

    // Check if we have enough vertices to place the next node
    if (targetIndex < smoothPath.length) {
      let point = smoothPath[targetIndex];

      // Find a safe position that doesn't collide with existing nodes
      let safePosition = findSafePosition(point.x, point.y);

      if (safePosition) {
        let imageIndex = nodes.length % imagePaths.length;
        let node = new CircleNode(safePosition.x, safePosition.y, imageIndex);
        nodes.push(node);
      }

      // Move to next sequential position regardless of whether we placed a node
      nextNodeIndex++;
    }
  }

  // Generate nodes continuously while drawing
  function generateRealTimeNodes() {
    if (isDrawing && smoothPath.length > 5) {
      // Call generateNodesOnPath every few frames while drawing
      if (p.frameCount % 8 === 0) {
        // Every 8 frames for more controlled timing
        generateNodesOnPath();
      }
    }
  }

  // Draw the thick smooth line
  function drawSmoothLine() {
    if (smoothPath.length < 2) return;

    // // Draw thick stroke
    p.stroke(255, 255, 255, 180);
    p.strokeWeight(200);
    p.strokeCap(p.ROUND);
    p.strokeJoin(p.ROUND);
    p.noFill();

    // // Draw the main thick line
    // p.beginShape();
    // p.noFill();
    // for (let point of smoothPath) {
    //   p.vertex(point.x, point.y);
    // }
    // p.endShape();

    // Add glow effect with multiple passes and random vertex dropping
    for (let i = 0; i < 5; i++) {
      p.stroke(255, 255, 255, 30 - i * 5);
      p.strokeWeight(20 + i * 10);
      p.beginShape();
      p.noFill();

      for (let j = 0; j < smoothPath.length; j++) {
        let point = smoothPath[j];

        // Randomly drop vertices (30% chance to skip)
        if (Math.random() < 0.3) {
          // Draw a clipped pet image at the dropped vertex position
          p.push();
          p.translate(point.x, point.y);

          // Get a random pet image from preloaded images
          let randomImageIndex = Math.floor(Math.random() * imagePaths.length);
          let tempImage = nodeImages[randomImageIndex];

          // Draw circular clipped image if loaded and images are ready
          if (tempImage && tempImage.width > 0 && imagesLoaded) {
            let circleSize = 15 + i * 5;

            // Calculate image scaling to fit circle
            let scale = Math.max(
              circleSize / tempImage.width,
              circleSize / tempImage.height
            );
            let scaledWidth = tempImage.width * scale;
            let scaledHeight = tempImage.height * scale;

            // Use canvas clipping for circular mask
            p.push();

            // Apply transparency based on glow layer
            p.tint(255, 50 - i * 8);

            // Create circular clipping path
            p.drawingContext.save();
            p.drawingContext.beginPath();
            p.drawingContext.arc(0, 0, circleSize / 2, 0, Math.PI * 2);
            p.drawingContext.clip();

            // Draw the image
            p.image(
              tempImage,
              -scaledWidth / 2,
              -scaledHeight / 2,
              scaledWidth,
              scaledHeight
            );

            p.drawingContext.restore();
            p.noTint();
            p.pop();
          }

          p.pop();

          // Skip this vertex in the line drawing
          continue;
        }

        p.vertex(point.x, point.y);
      }
      p.endShape();
    }
  }

  p.setup = function () {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.colorMode(p.HSB, 360, 100, 100, 255);

    // Preload all images
    preloadImages();
  };

  p.draw = function () {
    // Dynamic gradient background
    p.background(20, 30, 15);

    // Generate nodes in real-time while drawing
    generateRealTimeNodes();

    // Draw the thick smooth line
    drawSmoothLine();

    // Update and draw nodes
    nodes.forEach((node) => {
      node.update();
      node.draw();
    });

    // Show instructions
    p.push();
    p.fill(255, 200);
    p.textAlign(p.CENTER);
    p.textSize(16);
    p.text(
      "Click and drag to draw - pet nodes appear in real-time!",
      p.width / 2,
      40
    );
    p.text(
      "Nodes spawn at random previous vertices while drawing",
      p.width / 2,
      60
    );
    p.text("Press SPACE to clear", p.width / 2, 80);
    p.pop();
  };

  p.mousePressed = function () {
    isDrawing = true;
    drawingPath = [];
    nextNodeIndex = 0; // Reset sequential counter for new drawing
    drawingPath.push({ x: p.mouseX, y: p.mouseY });
    lastMousePos = { x: p.mouseX, y: p.mouseY };
  };

  p.mouseDragged = function () {
    if (isDrawing) {
      // Only add point if mouse moved significantly to avoid too many points
      let distance = p.dist(p.mouseX, p.mouseY, lastMousePos.x, lastMousePos.y);
      if (distance > 5) {
        drawingPath.push({ x: p.mouseX, y: p.mouseY });
        lastMousePos = { x: p.mouseX, y: p.mouseY };

        // Update smooth path in real-time
        createSmoothPath();
      }
    }
  };

  p.mouseReleased = function () {
    if (isDrawing) {
      isDrawing = false;

      // Finalize the smooth path
      createSmoothPath();

      // No need to generate nodes here anymore - they're generated in real-time
    }
  };

  p.keyPressed = function () {
    switch (p.key) {
      case " ":
        // Clear everything
        drawingPath = [];
        smoothPath = [];
        nodes = [];
        nextNodeIndex = 0; // Reset sequential counter
        break;
    }
  };

  p.windowResized = function () {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };

  // Cleanup function
  p.cleanup = function () {
    nodes = [];
    drawingPath = [];
    smoothPath = [];
    nodeImages = [];
  };

  // Override p5's remove function to include our cleanup
  const originalRemove = p.remove;
  p.remove = function () {
    if (p.cleanup) {
      p.cleanup();
    }
    if (originalRemove) {
      originalRemove.call(p);
    }
  };
}
