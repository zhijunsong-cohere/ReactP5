import { P5Sketch } from './components/P5Sketch'
import { bouncingBallSketch } from './sketches/BouncingBall'
import './App.css'

function App() {
  return (
    <div className="app">
      <h1>React + Vite + P5.js</h1>
      <p>A bouncing ball demonstration using P5.js in React</p>
      <div className="sketch-container">
        <P5Sketch sketch={bouncingBallSketch} />
      </div>
    </div>
  )
}

export default App
