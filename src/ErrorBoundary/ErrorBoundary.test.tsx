import { render, screen, fireEvent, act } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';
import '@testing-library/jest-dom';

// A component that throws an error
const ThrowError = () => {
  throw new Error('Test error');
};

// A component that doesn't throw
const SafeComponent = () => <div>Safe content</div>;

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for expected errors
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <SafeComponent />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('error-boundary-content')).toBeInTheDocument();
    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });

  it('renders error UI when there is an error', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('renders fallback UI when provided', () => {
    const fallback = <div>Custom error UI</div>;
    render(
      <ErrorBoundary fallback={fallback}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
  });

  it('resets error state and remounts children when Try again is clicked', () => {
    let shouldThrow = true;
    const ToggleError = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>Safe content</div>;
    };

    render(
      <ErrorBoundary>
        <ToggleError />
      </ErrorBoundary>
    );

    // Initially shows error UI
    expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Change the component behavior and click Try again
    shouldThrow = false;
    act(() => {
      fireEvent.click(screen.getByText('Try again'));
    });

    // Should show safe content
    expect(screen.queryByTestId('error-boundary-fallback')).not.toBeInTheDocument();
    expect(screen.getByTestId('error-boundary-content')).toBeInTheDocument();
    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });

  it('maintains error state when error persists after reset', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    // Initially shows error UI
    expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();

    // Click Try again
    act(() => {
      fireEvent.click(screen.getByText('Try again'));
    });

    // Should show error UI again since ThrowError will throw again
    expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
