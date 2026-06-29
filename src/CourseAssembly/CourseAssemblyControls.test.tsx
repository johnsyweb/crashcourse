import { render, screen, fireEvent } from '@testing-library/react';
import CourseAssemblyControls from './CourseAssemblyControls';
import { assembleCourse, DEFAULT_PARKRUN_LENGTH_METERS } from '../Course/assembleCourse';
import '@testing-library/jest-dom';

const segment = [
  [-37.8, 144.9],
  [-37.801, 144.901],
  [-37.802, 144.902],
] as [number, number][];

describe('CourseAssemblyControls', () => {
  const baseParams = {
    targetLengthMeters: 5000,
    mirror: false,
  };
  const assemblyResult = assembleCourse(segment, baseParams);

  it('renders target length input and mirror checkbox', () => {
    const onChange = jest.fn();

    render(
      <CourseAssemblyControls
        params={baseParams}
        assemblyResult={assemblyResult}
        onChange={onChange}
      />
    );

    expect(screen.getByLabelText(/Target course length/i)).toHaveValue(5000);
    expect(screen.getByLabelText(/Mirror between repetitions/i)).not.toBeChecked();
    expect(screen.getByText(/Assembled length/i)).toBeInTheDocument();
  });

  it('calls onChange when target length changes', () => {
    const onChange = jest.fn();

    render(
      <CourseAssemblyControls
        params={baseParams}
        assemblyResult={assemblyResult}
        onChange={onChange}
      />
    );

    fireEvent.change(screen.getByLabelText(/Target course length/i), {
      target: { value: '4500' },
    });

    expect(onChange).toHaveBeenCalledWith({
      targetLengthMeters: 4500,
      mirror: false,
    });
  });

  it('sets parkrun target length from preset button', () => {
    const onChange = jest.fn();

    render(
      <CourseAssemblyControls
        params={{ targetLengthMeters: 1000, mirror: true }}
        assemblyResult={assemblyResult}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Use 5000 m/i }));

    expect(onChange).toHaveBeenCalledWith({
      targetLengthMeters: DEFAULT_PARKRUN_LENGTH_METERS,
      mirror: true,
    });
  });

  it('calls onChange when mirror is toggled', () => {
    const onChange = jest.fn();

    render(
      <CourseAssemblyControls
        params={baseParams}
        assemblyResult={assemblyResult}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByLabelText(/Mirror between repetitions/i));

    expect(onChange).toHaveBeenCalledWith({
      targetLengthMeters: 5000,
      mirror: true,
    });
  });
});
