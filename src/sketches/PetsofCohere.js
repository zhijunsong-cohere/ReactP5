export function effortlessHeader(p) {
  // Cursor tracking variables
  let mouseTrail = [];
  let prevMouseX = 0;
  let prevMouseY = 0;
  let mouseVelocity = 0;

  // Floating images array
  let floatingImages = [];
  let loadedImages = []; // Array to hold all loaded images
  let imagesLoaded = false;
  let currentImageIndex = 0; // Track current image index for sequential display
  let currentDepthAlphaIndex = 0; // Track current depth alpha index for sequential display

  // Font loading
  let customFont;
  let fontLoaded = false;

  // Background image
  let sunsetBackground;
  let backgroundLoaded = false;

  // Image paths (should be in public folder for p5.js to load)
  const imageAssets = "src/assets/sunrise/img_";
  const imagePaths = [];

  // Generate image paths using a for loop
  for (let i = 1; i <= 16; i++) {
    const imageNumber = i.toString().padStart(3, "0"); // Ensures 001, 002, 003 , etc.
    imagePaths.push(`${imageAssets}${imageNumber}.png`);
  }

  // Generate depth alpha values sequentially (from low to high alpha)
  const depthAlphaValues = [];
  for (let i = 0; i < 16; i++) {
    // Create alpha values from 0.3 to 1.0 sequentially
    depthAlphaValues.push(0.1 + (i / (16 - 1)) * 0.7);
  }

  // Velocity threshold for spawning images
  const velocityThreshold = 5;

  // Image class for physics-based floating
  class FloatingImage {
    constructor(x, y, initialVelocity) {
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * initialVelocity * 0.3;
      this.vy = (Math.random() - 0.5) * initialVelocity * 0.3;
      this.alpha = 255;

      // Sequentially select depth alpha value
      this.depthAlpha = depthAlphaValues[currentDepthAlphaIndex];
      currentDepthAlphaIndex =
        (currentDepthAlphaIndex + 1) % depthAlphaValues.length;

      this.baseSize = this.depthAlpha * 40 + 100; // Base size for scaling
      this.life = 1.0;
      this.creationTime = p.millis(); // Timestamp for creation order

      // Z-depth properties for 3D layering effect
      this.z = Math.random() * 100 + 50; // Z-depth from 50 to 150
      this.vz = (Math.random() - 0.5) * 0.5; // Z velocity for floating depth movement
      this.depthScale = 1.0; // Scale based on Z-depth (closer = larger)

      //this.rotation = Math.random() * p.TWO_PI;
      // this.rotationSpeed = (Math.random() - 0.5) * 0.1;

      // Sequentially select image and calculate aspect ratio
      if (imagesLoaded && loadedImages.length > 0) {
        this.image = loadedImages[currentImageIndex];
        // Increment index for next image, wrap around to beginning when reaching end
        currentImageIndex = (currentImageIndex + 1) % loadedImages.length;
        // Calculate aspect ratio (width / height)
        this.aspectRatio = this.image.width / this.image.height;

        // Calculate initial display dimensions maintaining aspect ratio
        if (this.aspectRatio >= 1) {
          // Landscape or square image
          this.baseWidth = this.baseSize;
          this.baseHeight = this.baseSize / this.aspectRatio;
        } else {
          // Portrait image
          this.baseWidth = this.baseSize * this.aspectRatio;
          this.baseHeight = this.baseSize;
        }
      } else {
        this.image = null;
        this.aspectRatio = 1.0; // Default square for fallback
        this.baseWidth = this.baseSize;
        this.baseHeight = this.baseSize;
      }

      // Calculate initial depth scale and display size
      this.updateDepthScale();
    }

    updateDepthScale() {
      // Calculate depth scale: closer objects (higher Z) are larger
      // Z range: 50-150, scale range: 0.5-1.5
      this.depthScale = p.map(this.z, 50, 150, 0.5, 1.5);

      // Apply depth scale to display dimensions
      this.displayWidth = this.baseWidth * this.depthScale;
      this.displayHeight = this.baseHeight * this.depthScale;
    }

    update() {
      // Apply physics - gradual movement towards edges
      // In 2D mode, center is at (width/2, height/2)
      const centerX = p.width / 2;
      const centerY = p.height / 2;

      // Force away from center
      const distanceFromCenter = p.dist(this.x, this.y, centerX, centerY);
      const forceStrength = 0.005;

      if (distanceFromCenter > 0) {
        const forceX =
          ((this.x - centerX) / distanceFromCenter) * forceStrength;
        const forceY =
          ((this.y - centerY) / distanceFromCenter) * forceStrength;

        this.vx += forceX;
        this.vy += forceY;
      }

      // Apply velocity with some drag
      this.x += this.vx;
      this.y += this.vy;
      this.z += this.vz; // Z-depth movement
      this.vx *= 0.98; // Drag
      this.vy *= 0.98;
      this.vz *= 0.99; // Slower Z drag for smoother depth movement

      // Keep Z within reasonable bounds
      this.z = p.constrain(this.z, 20, 200);

      // Update depth-based scaling and alpha
      this.updateDepthScale();

      // Update rotation
      //this.rotation += this.rotationSpeed;

      // Fade out over time
      this.life -= 0.01;
      this.alpha = this.life * 255 * this.depthAlpha; // Apply depth alpha
    }

    display() {
      if (this.alpha <= 0) return;

      p.push();
      p.translate(this.x, this.y);
      // p.rotate(this.rotation);

      if (this.image) {
        // Draw the loaded image maintaining aspect ratio with depth scaling
        p.imageMode(p.CENTER);
        p.image(this.image, 0, 0, this.displayWidth, this.displayHeight);
      } else {
        // Fallback: Draw a circle if image not loaded
        p.fill(255, 100, 150, this.alpha);
        p.noStroke();
        p.circle(0, 0, this.baseSize * this.depthScale);
      }

      p.pop();
    }

    isDead() {
      // 2D coordinates: check if outside canvas bounds
      return (
        this.life <= 0 ||
        this.x < -100 ||
        this.x > p.width + 100 ||
        this.y < -100 ||
        this.y > p.height + 100
      );
    }
  }

  p.setup = async () => {
    p.createCanvas(p.windowWidth, p.windowHeight); // Use 2D mode for better text compatibility
    p.pixelDensity(p.displayDensity() || 1);
    p.textAlign(p.CENTER, p.CENTER);
    p.imageMode(p.CENTER);

    // Load images after setup (async loading)
    loadImagesAsync();

    // Load custom font
    loadCustomFont();

    // Load sunset background
    loadSunsetBackground();

    // Initialize mouse position
    prevMouseX = p.mouseX;
    prevMouseY = p.mouseY;
  };

  // Async image loading function
  function loadImagesAsync() {
    for (let i = 0; i < imagePaths.length; i++) {
      p.loadImage(
        imagePaths[i],
        (img) => {
          // Success callback
          loadedImages.push(img);
          if (loadedImages.length === imagePaths.length) {
            imagesLoaded = true;
            console.log(`Loaded ${loadedImages.length} images successfully`);
          }
        },
        (err) => {
          // Error callback
          console.log(`Failed to load image: ${imagePaths[i]}`, err);
        }
      );
    }
  }

  // Custom font loading function
  function loadCustomFont() {
    p.loadFont(
      "src/assets/Unica77CohereTT-Bold.ttf",
      (font) => {
        // Success callback
        customFont = font;
        fontLoaded = true;
        console.log("Custom font loaded successfully");
      },
      (err) => {
        // Error callback
        console.log("Failed to load custom font:", err);
        // Fallback to system font
        fontLoaded = false;
      }
    );
  }

  // Sunset background loading function
  function loadSunsetBackground() {
    p.loadImage(
      "src/assets/sunset_effortless.jpg",
      (img) => {
        // Success callback
        sunsetBackground = img;
        backgroundLoaded = true;
        console.log("Sunset background loaded successfully");
      },
      (err) => {
        // Error callback
        console.log("Failed to load sunset background:", err);
        backgroundLoaded = false;
      }
    );
  }

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };

  p.draw = () => {
    // Display sunset background or fallback to pink
    if (backgroundLoaded && sunsetBackground) {
      // Draw the sunset image to fill the entire canvas
      p.image(sunsetBackground, p.width / 2, p.height / 2, p.width, p.height);
      // Add a semi-transparent overlay for trail effect
      p.fill(239, 206, 212, 30);
      p.noStroke();
      p.rect(0, 0, p.width, p.height);
    } else {
      // Fallback to pink background
      p.background(239, 206, 212, 50);
    }
    p.smooth();

    // Calculate mouse velocity using regular 2D coordinates
    const currentVelocity = p.dist(p.mouseX, p.mouseY, prevMouseX, prevMouseY);
    mouseVelocity = p.lerp(mouseVelocity, currentVelocity, 0.02);

    // Add current mouse position to trail (using 2D coordinates)
    if (p.mouseX !== prevMouseX || p.mouseY !== prevMouseY) {
      mouseTrail.push({
        x: p.mouseX,
        y: p.mouseY,
        velocity: mouseVelocity,
        age: 0,
      });

      // Spawn floating image on every mouse movement to loop through all images
      floatingImages.push(new FloatingImage(p.mouseX, p.mouseY, mouseVelocity));
    }

    // Limit trail length
    if (mouseTrail.length > 30) {
      mouseTrail.shift();
    }

    // Draw cursor trail
    for (let i = 0; i < mouseTrail.length; i++) {
      const point = mouseTrail[i];
      const alpha = p.map(i, 0, mouseTrail.length - 1, 0, 255);
      const size = p.map(point.velocity, 0, 20, 2, 10);

      p.fill(255, 255, 255, alpha * 0.7);
      p.noStroke();
      p.circle(point.x, point.y, size);

      // Age the trail points
      point.age++;
    }

    // Remove old trail points
    mouseTrail = mouseTrail.filter((point) => point.age < 60);

    // Update floating images
    for (let i = floatingImages.length - 1; i >= 0; i--) {
      const img = floatingImages[i];
      img.update();

      // Remove dead images
      if (img.isDead()) {
        floatingImages.splice(i, 1);
      }
    }

    // Sort images by creation time (oldest to newest) so latest images appear on top
    floatingImages.sort((a, b) => a.creationTime - b.creationTime);

    // Display floating images in creation order (latest on top)
    for (let img of floatingImages) {
      img.display();
    }

    // p.blendMode(p.BLEND); // Reset to default blend mode

    // Display the header text with responsive sizing (centered in 2D)
    p.fill(255, 255, 255, 250);
    p.textSize(p.width * 0.11);

    // Use custom font if loaded, otherwise fallback to system font
    if (fontLoaded && customFont) {
      p.textFont(customFont);
    } else {
      p.textFont("Arial, sans-serif");
    }

    // In 2D mode, center is at (width/2, height/2)
    p.text("Pets of Cohere", p.width / 2, p.height / 2);
    p.textSize(p.width * 0.025);

    // p.text("north.cohere.com", p.width - 200, p.height - 100);

    // Display velocity indicator (optional - for debugging)
    if (mouseVelocity > 1) {
      p.fill(184, 249, 243);
      p.textSize(12);
      p.text(`Velocity: ${mouseVelocity.toFixed(1)}`, p.mouseX, p.mouseY - 20);
    }

    // Update previous mouse position
    prevMouseX = p.mouseX;
    prevMouseY = p.mouseY;
  };
}
