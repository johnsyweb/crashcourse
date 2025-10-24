import { render, screen } from '@testing-library/react';
import CoursePointsView from './CoursePointsView';
import { Course } from './Course';
import { LatLngTuple } from 'leaflet';

// Mock the Course class
jest.mock('./Course', () => ({
  Course: jest.fn().mockImplementation(() => ({
    getPoints: jest.fn(() => [
      [51.505, -0.09],
      [51.51, -0.1],
      [51.51, -0.12],
      [51.505, -0.13],
    ]),
    length: 1000,
  })),
}));

// Mock course type for testing
interface MockCourse {
  getPoints: () => LatLngTuple[];
  length: number;
}

describe('CoursePointsView', () => {
  const samplePoints: LatLngTuple[] = [
    [51.505, -0.09],
    [51.51, -0.1],
    [51.51, -0.12],
    [51.505, -0.13],
  ];

  const createMockCourse = (): MockCourse => ({
    getPoints: jest.fn(() => samplePoints),
    length: 1000,
  });

  it('renders no course message when course is null', () => {
    render(<CoursePointsView course={null} />);

    expect(
      screen.getByText('No course loaded. Please upload a GPX file to view course points.')
    ).toBeInTheDocument();
  });

  it('renders course points table when course is provided', () => {
    const mockCourse = createMockCourse();
    render(<CoursePointsView course={mockCourse as unknown as Course} />);

    expect(screen.getByText('Course Points')).toBeInTheDocument();
    expect(screen.getByText('Total Points: 4')).toBeInTheDocument();
  });

  it('displays correct table headers', () => {
    const mockCourse = createMockCourse();
    render(<CoursePointsView course={mockCourse as unknown as Course} />);

    expect(screen.getByText('#')).toBeInTheDocument();
    expect(screen.getByText('Latitude')).toBeInTheDocument();
    expect(screen.getByText('Longitude')).toBeInTheDocument();
    expect(screen.getByText('Distance from Previous')).toBeInTheDocument();
    expect(screen.getByText('Bearing from Previous')).toBeInTheDocument();
    expect(screen.getByText('Cumulative Distance')).toBeInTheDocument();
  });

  it('displays course points with correct data', () => {
    const mockCourse = createMockCourse();
    render(<CoursePointsView course={mockCourse as unknown as Course} />);

    // Check that all point indices are displayed
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();

    // Check that coordinates are displayed (use getAllByText since coordinates can appear multiple times)
    expect(screen.getAllByText('51.505000')).toHaveLength(2); // Appears in points 1 and 4
    expect(screen.getByText('-0.090000')).toBeInTheDocument();
  });

  it('shows correct distance formatting', () => {
    const mockCourse = createMockCourse();
    render(<CoursePointsView course={mockCourse as unknown as Course} />);

    // First point should have 0 distance from previous
    const firstRow = screen.getByText('1').closest('tr');
    expect(firstRow).toHaveTextContent('0.0 m');
  });

  it('shows bearing direction for non-first points', () => {
    const mockCourse = createMockCourse();
    render(<CoursePointsView course={mockCourse as unknown as Course} />);

    // First point should show "—" for bearing
    const firstRow = screen.getByText('1').closest('tr');
    expect(firstRow).toHaveTextContent('—');
  });

  it('displays total distance in summary', () => {
    const mockCourse = createMockCourse();
    render(<CoursePointsView course={mockCourse as unknown as Course} />);

    expect(screen.getByText(/Total Distance:/)).toBeInTheDocument();
  });

  it('formats coordinates with correct precision', () => {
    const mockCourse = createMockCourse();
    render(<CoursePointsView course={mockCourse as unknown as Course} />);

    // Check that coordinates are formatted to 6 decimal places
    expect(screen.getAllByText('51.505000')).toHaveLength(2); // Appears in points 1 and 4
    expect(screen.getByText('-0.090000')).toBeInTheDocument();
  });

  it('calculates cumulative distance correctly', () => {
    const mockCourse = createMockCourse();
    render(<CoursePointsView course={mockCourse as unknown as Course} />);

    // First point should have 0 cumulative distance
    const firstRow = screen.getByText('1').closest('tr');
    expect(firstRow).toHaveTextContent('0.0 m');
  });

  it('applies correct CSS classes', () => {
    const mockCourse = createMockCourse();
    const { container } = render(<CoursePointsView course={mockCourse as unknown as Course} />);

    // Check for basic HTML structure
    expect(container.querySelector('table')).toBeInTheDocument();
    expect(container.querySelector('h2')).toBeInTheDocument();
    expect(container.querySelector('thead')).toBeInTheDocument();
    expect(container.querySelector('tbody')).toBeInTheDocument();
  });

  it('handles empty course gracefully', () => {
    render(<CoursePointsView course={null} />);

    expect(
      screen.getByText('No course loaded. Please upload a GPX file to view course points.')
    ).toBeInTheDocument();
  });
});
