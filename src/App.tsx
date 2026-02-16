import CourseSimulationApp from './CourseSimulationApp';
import './App.css';
import packageJson from '../package.json';

function App() {
  return (
    <div className="App">
      <a className="skip-link" href="#content">
        Skip to main content
      </a>
      <header className="app-header">
        <div className="header-hamburger-slot" aria-hidden="true" />
        <div className="header-main">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <a href="https://www.johnsy.com/">johnsy.com</a>
            <span aria-hidden="true">/</span>
            <a href="https://www.johnsy.com/parkrun-utilities/">parkrun utilities</a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Crashcourse</span>
          </nav>
          <div className="header-content">
            <div className="header-title">
              <h1>Crashcourse</h1>
              <p>Simulate and analyse your event course for accessibility and enjoyment.</p>
            </div>
            <div className="header-actions" />
          </div>
        </div>
      </header>

      <main id="content">
        <CourseSimulationApp />
      </main>

      <footer className="app-footer">
        <p>
          <strong>Crashcourse</strong>{' '}
          <a
            href="https://github.com/johnsyweb/crashcourse/blob/main/CHANGELOG.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            v{packageJson.version}
          </a>{' '}
          by{' '}
          <a href="https://www.johnsy.com" target="_blank" rel="noopener noreferrer">
            Pete Johns
          </a>{' '}
          (
          <a href="https://github.com/johnsyweb" target="_blank" rel="noopener noreferrer">
            @johnsyweb
          </a>
          ) • Licensed under MIT • Not officially associated with parkrun • Written by parkrun
          volunteers for parkrun volunteers.
        </p>
      </footer>
    </div>
  );
}

export default App;
