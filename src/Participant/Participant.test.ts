import { Participant } from './Participant';
import { Course } from '../Course';

// Mock the Course class with proper method mocks
const mockGetPositionAtDistance = jest.fn();
const mockGetWidthAt = jest.fn();

jest.mock('../Course', () => ({
  Course: jest.fn().mockImplementation(() => ({
    length: 5000, // 5km mock length
    startPoint: [10, 20],
    getPositionAtDistance: mockGetPositionAtDistance.mockImplementation((distance: number) => {
      if (distance <= 0) return [10, 20];
      if (distance >= 5000) return [12, 22];
      const ratio = distance / 5000;
      return [10 + (12 - 10) * ratio, 20 + (22 - 20) * ratio];
    }),
    getWidthAt: mockGetWidthAt.mockReturnValue(2),
  })),
}));

describe('Participant', () => {
  let mockCourse: Course;

  beforeEach(() => {
    mockCourse = new Course([]);
    mockGetPositionAtDistance.mockClear();
    mockGetWidthAt.mockClear();
  });

  it('should create a participant with default values', () => {
    const participant = new Participant(mockCourse);
    expect(participant.getPosition()).toEqual([10, 20]);
    expect(participant.getProperties().pace).toBe('4:00/km');
  });

  it('should create a participant with custom pace', () => {
    const participant = new Participant(mockCourse, 0, '5:30');
    expect(participant.getProperties().pace).toBe('5:30/km');
  });

  it('should update position when elapsed time changes', () => {
    const participant = new Participant(mockCourse);
    participant.updateElapsedTime(300); // 5 minutes
    expect(mockGetPositionAtDistance).toHaveBeenCalled();
  });

  it('should correctly get total distance of course', () => {
    const participant = new Participant(mockCourse);
    const properties = participant.getProperties();
    expect(properties.totalDistance).toBe(5000);
  });

  it('should reset participant to starting position', () => {
    const participant = new Participant(mockCourse);
    participant.updateElapsedTime(300); // Move participant
    participant.reset();
    expect(participant.getPosition()).toEqual([10, 20]);
  });

  it('should set the default width of a participant', () => {
    const participant = new Participant(mockCourse);
    expect(participant.width).toBe(0.5);
  });

  it('should allow setting a custom width for a participant', () => {
    const participant = new Participant(mockCourse, 0, '4:00', 0.75);
    expect(participant.width).toBe(0.75);
  });

  it('should move the participant based on clock ticks and pace', () => {
    const participant = new Participant(mockCourse);
    participant.move(60); // Move for 1 minute
    expect(mockGetPositionAtDistance).toHaveBeenCalled();
  });

  it('should account for external factors when moving', () => {
    const participant = new Participant(mockCourse);
    participant.move(60, { terrainFactor: 0.5 }); // Move slower due to terrain
    expect(mockGetPositionAtDistance).toHaveBeenCalled();
  });
});
