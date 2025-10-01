# ReactP5

A template project that integrates P5.js into a React + Vite application.

## Features

- **React 19**: Latest version of React
- **Vite**: Fast build tool and dev server with HMR (Hot Module Replacement)
- **P5.js**: Creative coding library for creating interactive graphics
- **Custom P5 React Wrapper**: A lightweight wrapper component for seamless P5.js integration with React

## Getting Started

### Prerequisites

- Node.js (v20 or higher recommended)
- npm (v10 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/zhijunsong-cohere/ReactP5.git
cd ReactP5
```

2. Install dependencies:
```bash
npm install
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173/`

### Build

Build for production:
```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

Preview the production build locally:
```bash
npm run preview
```

## Project Structure

```
ReactP5/
├── src/
│   ├── components/
│   │   └── P5Sketch.jsx        # Custom React wrapper for P5.js
│   ├── sketches/
│   │   └── BouncingBall.js     # Example P5.js sketch
│   ├── App.jsx                  # Main application component
│   ├── App.css                  # Application styles
│   ├── main.jsx                 # Application entry point
│   └── index.css                # Global styles
├── index.html                   # HTML template
├── vite.config.js              # Vite configuration
└── package.json                # Project dependencies
```

## Creating Your Own P5.js Sketches

1. Create a new file in `src/sketches/` (e.g., `MySketch.js`)
2. Define your sketch using the P5.js instance mode:

```javascript
export function mySketch(p5) {
  p5.setup = () => {
    p5.createCanvas(600, 400);
  };

  p5.draw = () => {
    p5.background(220);
    // Your drawing code here
  };
}
```

3. Import and use it in your component:

```jsx
import { P5Sketch } from './components/P5Sketch';
import { mySketch } from './sketches/MySketch';

function MyComponent() {
  return <P5Sketch sketch={mySketch} />;
}
```

## Technologies Used

- [React](https://react.dev/) - UI library
- [Vite](https://vite.dev/) - Build tool
- [P5.js](https://p5js.org/) - Creative coding library

## License

This is a template project for educational and development purposes.

