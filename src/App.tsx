import CourseSimulationApp from './CourseSimulationApp';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Crashcourse</h1>
        <p>Simulate and analyse your event course for accessibility and enjoyment.</p>
      </header>

      <main>
        <CourseSimulationApp />
      </main>

      <footer>
        <p>© 2025 Pete Johns - MIT License</p>
      </footer>
    </div>
  );
}

export default App;
