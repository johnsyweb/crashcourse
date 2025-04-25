const SimulatorDisplay = ({
  courseLength,
  elapsedTime,
  startSimulation,
  stopSimulation,
  resetSimulation,
}: {
  courseLength: number;
  elapsedTime: number;
  startSimulation: () => void;
  stopSimulation: () => void;
  resetSimulation: () => void;
}) => {
  const formatElapsedTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div>
      <p>Course Length: {(courseLength / 1000).toFixed(2)} km</p>
      <p>Elapsed Time: {formatElapsedTime(elapsedTime)}</p>
      <button
        onClick={startSimulation}
        style={{ backgroundColor: 'green', color: 'white' }}
      >
        Start Simulation
      </button>
      <button
        onClick={stopSimulation}
        style={{ backgroundColor: 'red', color: 'white' }}
      >
        Stop Simulation
      </button>
      <button
        onClick={resetSimulation}
        style={{ backgroundColor: 'blue', color: 'white' }}
      >
        Reset Simulation
      </button>
    </div>
  );
};

export default SimulatorDisplay;
