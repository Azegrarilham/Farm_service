import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // You can also log the error to an error reporting service
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render(): ReactNode {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return this.props.fallback || (
                <div className="p-4 bg-red-50 text-red-700 rounded-md m-4">
                    <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
                    <p className="mb-4">An error occurred in this component.</p>
                    {this.state.error && (
                        <details className="border border-red-300 p-2 rounded-md">
                            <summary className="font-medium">Error details</summary>
                            <p className="mt-2 font-mono text-sm whitespace-pre-wrap">
                                {this.state.error.toString()}
                            </p>
                        </details>
                    )}
                    <button
                        className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                        onClick={() => this.setState({ hasError: false, error: null })}
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
