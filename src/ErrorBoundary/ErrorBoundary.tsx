import { Component, ErrorInfo, ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  key: number;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    key: 0,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      key: prevState.key + 1,
    }));
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={styles.errorContainer} data-testid="error-boundary-fallback">
          <h2 className={styles.errorTitle}>Something went wrong</h2>
          <p className={styles.errorMessage}>{this.state.error?.message}</p>
          <button className={styles.resetButton} onClick={this.handleReset}>
            Try again
          </button>
        </div>
      );
    }

    return (
      <div data-testid="error-boundary-content" key={this.state.key}>
        {this.props.children}
      </div>
    );
  }
}

export default ErrorBoundary;
