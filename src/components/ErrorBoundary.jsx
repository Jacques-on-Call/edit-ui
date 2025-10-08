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
    // Log the error to the console for developers
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // Render the enhanced, user-friendly fallback UI
      return (
        <div className="p-4 sm:p-6 lg:p-8 bg-red-50 text-gray-800 font-sans">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-red-700 mb-2 flex items-center">
              <span className="text-4xl mr-3">🚨</span> Builder Error
            </h1>
            <p className="text-lg text-red-600 mb-6">A critical error occurred while rendering the application.</p>

            <div className="bg-white p-6 rounded-lg border border-red-200 shadow-sm mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Message</h2>
              <pre className="bg-gray-50 p-4 rounded-md text-red-800 whitespace-pre-wrap font-mono text-sm">
                <code>{this.state.error && this.state.error.toString()}</code>
              </pre>
            </div>

            <div className="bg-white p-6 rounded-lg border border-yellow-300 shadow-sm mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Suggested Fixes</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>If this is a **Layout Editor** error (e.g., "Invariant failed"), it often means a component is trying to access editor data before it's available. This is usually an architectural issue.</li>
                <li>If this is a **File Editor** error, it's likely a syntax error (like a missing comma or unclosed quote) in the file's frontmatter.</li>
                <li>Check the browser's developer console for more technical details.</li>
              </ul>
            </div>

            <details className="bg-white p-4 rounded-lg border border-gray-200">
              <summary className="cursor-pointer font-semibold text-gray-600 hover:text-gray-900">
                Show Component Stack Trace (for debugging)
              </summary>
              <pre className="mt-4 text-gray-500 font-mono text-xs whitespace-pre-wrap">
                <code>
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </code>
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;