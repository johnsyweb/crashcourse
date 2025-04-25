const SimulatorDisplay = ({
  courseLength,
  elapsedTime,
  startSimulation,
  stopSimulation,
}: {
  courseLength: number;
  elapsedTime: number;
  startSimulation: () => void;
  stopSimulation: () => void;
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
      <button onClick={startSimulation}>Start Simulation</button>
      <button onClick={stopSimulation}>Stop Simulation</button>
    </div>
  );
};

export default SimulatorDisplay;
