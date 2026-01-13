import p5 from "p5";

export default function InteractiveDrawingSketch(p) {
  let nodes = [];
  let curves = [];
  let isDragging = false;
  let draggedNode = null;
  let hoveredNode = null;
  let previewCurve = null;
  let selectedNode = null;

  // Node class for interactive points
  class Node {
    constructor(x, y, id) {
      this.x = x;
      this.y = y;
      this.id = id;
      this.radius = 15;
      this.targetRadius = 15;
      this.color = p.color(100, 150, 255);
      this.targetColor = p.color(100, 150, 255);
      this.connections = [];
      this.image = null; // Could hold clipped images
      this.isDragging = false;
      this.animationPhase = 0;
    }

    update() {
      // Smooth radius animation
      this.radius = p.lerp(this.radius, this.targetRadius, 0.15);

      // Color animation
      this.color = p.lerpColor(this.color, this.targetColor, 0.1);

      // Floating animation
      this.animationPhase += 0.05;
    }

    draw() {
      p.push();
      p.translate(this.x, this.y + p.sin(this.animationPhase) * 2);

      // Glow effect
      for (let i = 0; i < 3; i++) {
        p.fill(
          p.red(this.color),
          p.green(this.color),
          p.blue(this.color),
          30 - i * 10
        );
        p.noStroke();
        p.circle(0, 0, this.radius + i * 8);
      }

      // Main node
      p.fill(this.color);
      p.stroke(255, 200);
      p.strokeWeight(2);
      p.circle(0, 0, this.radius);

      // Inner highlight
      p.fill(255, 100);
      p.noStroke();
      p.circle(-this.radius * 0.2, -this.radius * 0.2, this.radius * 0.3);

      // Node ID
      p.fill(255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(10);
      p.text(this.id, 0, 0);

      p.pop();
    }

    contains(x, y) {
      let d = p.dist(x, y, this.x, this.y);
      return d < this.radius + 10;
    }

    setHovered(hovered) {
      this.targetRadius = hovered ? 25 : 15;
      this.targetColor = hovered
        ? p.color(255, 200, 100)
        : p.color(100, 150, 255);
    }

    setSelected(selected) {
      this.targetRadius = selected ? 30 : 15;
      this.targetColor = selected
        ? p.color(255, 100, 150)
        : p.color(100, 150, 255);
    }
  }

  // Curve class for smooth connections
  class Curve {
    constructor(startNode, endNode) {
      this.startNode = startNode;
      this.endNode = endNode;
      this.controlPoints = this.calculateControlPoints();
      this.animationProgress = 0;
      this.targetProgress = 1;
      this.color = p.color(100, 200, 255, 150);
    }

    calculateControlPoints() {
      let dx = this.endNode.x - this.startNode.x;
      let dy = this.endNode.y - this.startNode.y;
      let distance = p.sqrt(dx * dx + dy * dy);

      // Create natural-looking control points
      let cp1x = this.startNode.x + dx * 0.3 + dy * 0.2;
      let cp1y = this.startNode.y + dy * 0.3 - dx * 0.2;
      let cp2x = this.endNode.x - dx * 0.3 + dy * 0.2;
      let cp2y = this.endNode.y - dy * 0.3 - dx * 0.2;

      return { cp1x, cp1y, cp2x, cp2y };
    }

    update() {
      this.animationProgress = p.lerp(
        this.animationProgress,
        this.targetProgress,
        0.08
      );
      // Recalculate control points if nodes moved
      this.controlPoints = this.calculateControlPoints();
    }

    draw() {
      if (this.animationProgress < 0.01) return;

      p.push();

      // Animated drawing effect
      let steps = p.floor(this.animationProgress * 50);
      if (steps < 1) return;

      // Draw curve segments
      p.stroke(this.color);
      p.strokeWeight(3);
      p.noFill();

      p.beginShape();
      p.noFill();

      for (let i = 0; i <= steps; i++) {
        let t = i / 50 / this.animationProgress;
        if (t > 1) t = 1;

        // Cubic Bézier curve calculation
        let x =
          p.pow(1 - t, 3) * this.startNode.x +
          3 * p.pow(1 - t, 2) * t * this.controlPoints.cp1x +
          3 * (1 - t) * p.pow(t, 2) * this.controlPoints.cp2x +
          p.pow(t, 3) * this.endNode.x;

        let y =
          p.pow(1 - t, 3) * this.startNode.y +
          3 * p.pow(1 - t, 2) * t * this.controlPoints.cp1y +
          3 * (1 - t) * p.pow(t, 2) * this.controlPoints.cp2y +
          p.pow(t, 3) * this.endNode.y;

        if (i === 0) {
          p.vertex(x, y);
        } else {
          p.vertex(x, y);
        }
      }
      p.endShape();

      // Draw control points (debug mode)
      if (p.keyIsPressed && p.key === "d") {
        p.fill(255, 0, 0, 100);
        p.noStroke();
        p.circle(this.controlPoints.cp1x, this.controlPoints.cp1y, 8);
        p.circle(this.controlPoints.cp2x, this.controlPoints.cp2y, 8);

        p.stroke(255, 0, 0, 100);
        p.strokeWeight(1);
        p.line(
          this.startNode.x,
          this.startNode.y,
          this.controlPoints.cp1x,
          this.controlPoints.cp1y
        );
        p.line(
          this.endNode.x,
          this.endNode.y,
          this.controlPoints.cp2x,
          this.controlPoints.cp2y
        );
      }

      p.pop();
    }
  }

  p.setup = function () {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.colorMode(p.RGB);

    // Create some initial nodes
    for (let i = 0; i < 5; i++) {
      let x = p.random(100, p.width - 100);
      let y = p.random(100, p.height - 100);
      nodes.push(new Node(x, y, nodes.length));
    }
  };

  p.draw = function () {
    // Dynamic background
    let bgColor = p.lerpColor(
      p.color(10, 15, 25),
      p.color(25, 30, 45),
      0.5 + 0.5 * p.sin(p.frameCount * 0.01)
    );
    p.background(bgColor);

    // Draw grid
    drawGrid();

    // Update and draw curves
    curves.forEach((curve) => {
      curve.update();
      curve.draw();
    });

    // Draw preview curve while creating connection
    if (previewCurve) {
      drawPreviewCurve();
    }

    // Update and draw nodes
    hoveredNode = null;
    nodes.forEach((node) => {
      node.update();

      if (!isDragging && node.contains(p.mouseX, p.mouseY)) {
        hoveredNode = node;
      }

      node.setHovered(node === hoveredNode);
      node.setSelected(node === selectedNode);
      node.draw();
    });

    // Instructions
    drawInstructions();
  };

  function drawGrid() {
    p.push();
    p.stroke(255, 20);
    p.strokeWeight(1);

    let gridSize = 50;
    for (let x = 0; x < p.width; x += gridSize) {
      p.line(x, 0, x, p.height);
    }
    for (let y = 0; y < p.height; y += gridSize) {
      p.line(0, y, p.width, y);
    }
    p.pop();
  }

  function drawPreviewCurve() {
    if (!selectedNode) return;

    p.push();
    p.stroke(255, 200, 100, 100);
    p.strokeWeight(2);
    p.noFill();

    // Simple preview line
    p.line(selectedNode.x, selectedNode.y, p.mouseX, p.mouseY);

    // Preview endpoint
    p.fill(255, 200, 100, 150);
    p.noStroke();
    p.circle(p.mouseX, p.mouseY, 10);
    p.pop();
  }

  function drawInstructions() {
    p.push();
    p.fill(255, 200);
    p.textAlign(p.LEFT);
    p.textSize(14);

    let instructions = [
      "Click node + click another node = connect with curve",
      "Click empty space = create new node",
      "Drag nodes to move them",
      "Hold 'd' to see control points",
      "Press 'c' to clear all curves",
      "Press 'r' to reset",
    ];

    instructions.forEach((instruction, i) => {
      p.text(instruction, 20, 30 + i * 20);
    });
    p.pop();
  }

  p.mousePressed = function () {
    // Check if clicking on a node
    let clickedNode = null;
    for (let node of nodes) {
      if (node.contains(p.mouseX, p.mouseY)) {
        clickedNode = node;
        break;
      }
    }

    if (clickedNode) {
      if (selectedNode && selectedNode !== clickedNode) {
        // Create connection between selected and clicked node
        createConnection(selectedNode, clickedNode);
        selectedNode = null;
      } else {
        // Select this node or start dragging
        selectedNode = clickedNode;
        draggedNode = clickedNode;
        isDragging = true;
      }
    } else {
      // Create new node at mouse position
      if (!selectedNode) {
        let newNode = new Node(p.mouseX, p.mouseY, nodes.length);
        nodes.push(newNode);
      } else {
        // Deselect if clicking empty space
        selectedNode = null;
      }
    }
  };

  p.mouseDragged = function () {
    if (isDragging && draggedNode) {
      draggedNode.x = p.mouseX;
      draggedNode.y = p.mouseY;
    }
  };

  p.mouseReleased = function () {
    isDragging = false;
    draggedNode = null;
  };

  function createConnection(node1, node2) {
    // Check if connection already exists
    let exists = curves.some(
      (curve) =>
        (curve.startNode === node1 && curve.endNode === node2) ||
        (curve.startNode === node2 && curve.endNode === node1)
    );

    if (!exists) {
      let curve = new Curve(node1, node2);
      curves.push(curve);

      // Add to node connections
      node1.connections.push(node2);
      node2.connections.push(node1);
    }
  }

  p.keyPressed = function () {
    if (p.key === "c") {
      // Clear all curves
      curves = [];
      nodes.forEach((node) => (node.connections = []));
    } else if (p.key === "r") {
      // Reset everything
      nodes = [];
      curves = [];
      selectedNode = null;

      // Create new random nodes
      for (let i = 0; i < 5; i++) {
        let x = p.random(100, p.width - 100);
        let y = p.random(100, p.height - 100);
        nodes.push(new Node(x, y, nodes.length));
      }
    }
  };

  p.windowResized = function () {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
}
