import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'An unexpected error occurred.',
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let displayMessage = 'Something went wrong while loading your wardrobe.';
      try {
        const parsed = JSON.parse(this.state.message);
        if (parsed?.error) {
          displayMessage = `Unable to sync wardrobe data (${parsed.error}).`;
        }
      } catch {
        if (this.state.message) {
          displayMessage = this.state.message;
        }
      }

      return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#f6f7f9]">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 text-center">
            <h1 className="font-display text-xl font-semibold text-gray-900">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-gray-600 break-words">{displayMessage}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
