import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import Button from './Button';
import { logger } from '../../utils/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('error-boundary', 'Unhandled application error.', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <section style={{ padding: '2rem', color: '#4b5563' }}>
          <h2>Something went wrong</h2>
          <p>
            An unexpected error occurred while rendering the application.
            {this.state.errorMessage ? ` ${this.state.errorMessage}` : ''}
          </p>
          <Button
            variant="secondary"
            size="md"
            onClick={this.handleReload}
            style={{ marginTop: '1rem' }}
          >
            Reload App
          </Button>
        </section>
      );
    }

    return this.props.children;
  }
}
