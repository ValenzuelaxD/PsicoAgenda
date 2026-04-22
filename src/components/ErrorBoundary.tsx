import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
  onReset?: () => void;
  resetKey?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Mantener traza en consola para diagnóstico de producción.
    console.error('ErrorBoundary capturó un error:', error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.props.resetKey !== prevProps.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="theme-frame rounded-xl border border-slate-700 p-6 sm:p-8 text-center space-y-3">
          <h2 className="text-slate-100 text-lg sm:text-xl font-semibold">
            {this.props.fallbackTitle || 'Ocurrió un error en esta sección'}
          </h2>
          <p className="text-slate-300 text-sm sm:text-base">
            {this.props.fallbackDescription || 'Puedes intentar recargar esta vista sin cerrar sesión.'}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center justify-center rounded-md bg-teal-600 px-4 py-2 text-white hover:bg-teal-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }
}
