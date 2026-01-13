import "./App.css";

import PetNamesCanvas from "./components/PetNamesCanvas";
function App() {
  var path = document.querySelector(".path");

  return (
    <div className="app">
      <section className="content-section sticky-section">
        <div className="sticky-wrapper">
          <PetNamesCanvas />
        </div>
      </section>
    </div>
  );
}

export default App;
