export function bouncingBallSketch(p) {
  let x = 100;
  let y = 100;
  let xSpeed = 3;
  let ySpeed = 2;

  p.setup = async () => {
    p.createCanvas(600, 400);
  };

  p.draw = () => {
    p.background(220);

    // Draw the ball
    p.fill(255, 0, 100);
    p.noStroke();
    p.circle(x, y, 50);

    // Move the ball
    x += xSpeed;
    y += ySpeed;

    // Bounce off edges
    if (x > p.width - 25 || x < 25) {
      xSpeed *= -1;
    }
    if (y > p.height - 25 || y < 25) {
      ySpeed *= -1;
    }
  };
}
