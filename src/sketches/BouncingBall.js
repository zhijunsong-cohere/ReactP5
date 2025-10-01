export function bouncingBallSketch(p5) {
  let x = 100;
  let y = 100;
  let xSpeed = 3;
  let ySpeed = 2;

  p5.setup = () => {
    p5.createCanvas(600, 400);
  };

  p5.draw = () => {
    p5.background(220);
    
    // Draw the ball
    p5.fill(255, 0, 100);
    p5.noStroke();
    p5.circle(x, y, 50);
    
    // Move the ball
    x += xSpeed;
    y += ySpeed;
    
    // Bounce off edges
    if (x > p5.width - 25 || x < 25) {
      xSpeed *= -1;
    }
    if (y > p5.height - 25 || y < 25) {
      ySpeed *= -1;
    }
  };
}
