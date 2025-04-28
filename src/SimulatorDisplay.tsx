const SimulatorDisplay = ({ courseLength }: { courseLength: number }) => {
  return (
    <div>
      <p>Course Length: {(courseLength / 1000).toFixed(2)} km</p>
    </div>
  );
};

export default SimulatorDisplay;
