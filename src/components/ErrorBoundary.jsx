import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="p-4 sm:p-6 lg:p-8 bg-red-50 text-red-700">
          <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
          <p className="mb-2">A critical error occurred while trying to render this part of the application. This is likely due to a syntax error in the file you are trying to open.</p>
          <details className="whitespace-pre-wrap bg-white p-4 rounded-lg border border-red-200">
            <summary className="cursor-pointer font-semibold">Error Details (The "Smoking Gun")</summary>
            <code className="block mt-2 text-red-800 font-mono text-sm">
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </code>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;