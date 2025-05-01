import { Participant } from './Participant';
import { LatLngTuple } from 'leaflet';
import { Course } from '../Course';

// Mock the Course class
jest.mock('../Course', () => {
  return {
    Course: jest.fn().mockImplementation((points) => {
      return {
        length: 5000, // 5km mock length
        startPoint: points[0],
        getPositionAtDistance: (distance: number) => {
          if (distance <= 0) return points[0];
          if (distance >= 5000) return points[points.length - 1];

          // Simple mock implementation
          const ratio = distance / 5000;
          const [lat1, lon1] = points[0];
          const [lat2, lon2] = points[points.length - 1];

          return [lat1 + (lat2 - lat1) * ratio, lon1 + (lon2 - lon1) * ratio];
        },
      };
    }),
  };
});

describe('Participant', () => {
  // Australian locations for our test course
  const testCourse: LatLngTuple[] = [
    [-33.8568, 151.2153], // Sydney Opera House
    [-33.8523, 151.2108], // Sydney Harbour Bridge
    [-33.8568, 151.2002], // Darling Harbour
    [-33.8688, 151.2093], // Royal Botanic Garden
  ];

  it('should create a participant with default values', () => {
    const participant = new Participant(testCourse);
    expect(participant).toBeDefined();
    expect(participant.getPosition()).toEqual(testCourse[0]);
  });

  it('should create a participant with custom pace', () => {
    const participant = new Participant(testCourse, 0, '5:30');
    const props = participant.getProperties();
    expect(props.pace).toBe('5:30/km');
  });

  it('should update position when elapsed time changes', () => {
    const participant = new Participant(testCourse);

    // Initial position should be at start
    expect(participant.getPosition()).toEqual(testCourse[0]);

    // Update time to move participant along the course
    participant.updateElapsedTime(600); // 10 minutes at default 4:00/km pace should move ~2.5km

    // Position should now be different from start
    expect(participant.getPosition()).not.toEqual(testCourse[0]);

    const props = participant.getProperties();
    expect(props.elapsedTime).toBe(600);
    expect(props.cumulativeDistance).toBeGreaterThan(0);
  });

  it('should correctly get total distance of course', () => {
    const participant = new Participant(testCourse);
    const props = participant.getProperties();

    // Total distance should match our mock course length
    expect(props.totalDistance).toBe(5000);
  });

  it('should reset participant to starting position', () => {
    const participant = new Participant(testCourse);

    // Move participant
    participant.updateElapsedTime(600);
    expect(participant.getPosition()).not.toEqual(testCourse[0]);

    // Reset
    participant.reset();

    // Should be back at start
    expect(participant.getPosition()).toEqual(testCourse[0]);

    const props = participant.getProperties();
    expect(props.elapsedTime).toBe(0);
    expect(props.cumulativeDistance).toBe(0);
  });

  it('should accept a Course instance directly', () => {
    // Create a separate mock Course instance directly
    const courseMock = {
      length: 6000,
      startPoint: [-34.0, 151.0],
      getPositionAtDistance: jest.fn().mockReturnValue([-34.0, 151.0]),
    };

    const participant = new Participant(courseMock as unknown as Course);
    expect(participant).toBeDefined();
    expect(participant.getPosition()).toEqual([-34.0, 151.0]);

    const props = participant.getProperties();
    expect(props.totalDistance).toBe(6000);
  });

  it('should set the default width of a participant', () => {
    const participant = new Participant(testCourse);
    expect(participant.width).toBe(0.5); // Default width is 0.5 meters
  });

  it('should allow setting a custom width for a participant', () => {
    const participant = new Participant(testCourse, 0, '4:00', 1.0);
    expect(participant.width).toBe(1.0); // Custom width is 1.0 meters
  });

  it('should move the participant based on clock ticks and pace', () => {
    const participant = new Participant(testCourse, 0, '5:00'); // 5:00/km pace

    // Initial position should be at the start
    expect(participant.getPosition()).toEqual(testCourse[0]);

    // Move the participant for 60 seconds (1 minute)
    participant.move(60); // 60 seconds

    // Position should now be updated
    const updatedPosition = participant.getPosition();
    expect(updatedPosition).not.toEqual(testCourse[0]);
  });

  it('should account for external factors when moving', () => {
    const participant = new Participant(testCourse, 0, '5:00'); // 5:00/km pace

    // Move the participant for 60 seconds with a terrain factor of 0.5 (slower)
    participant.move(60, { terrainFactor: 0.5 });

    // Position should be closer to the start compared to normal movement
    const updatedPosition = participant.getPosition();
    expect(updatedPosition).not.toEqual(testCourse[0]);
  });
});
