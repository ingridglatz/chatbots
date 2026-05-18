import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary capturou erro:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 max-w-md w-full p-8 text-center space-y-4">
          <div className="w-12 h-12 mx-auto bg-red-50 rounded-full flex items-center justify-center">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Algo deu errado</h1>
          <p className="text-sm text-gray-600">
            Ocorreu um erro inesperado. Recarregue a página para continuar.
          </p>
          {this.state.error?.message && (
            <pre className="text-xs text-left text-red-600 bg-red-50 border border-red-100 rounded p-3 overflow-auto max-h-32">
              {this.state.error.message}
            </pre>
          )}
          <button onClick={this.handleReload} className="btn-primary w-full">
            <RefreshCw size={16} /> Recarregar
          </button>
        </div>
      </div>
    );
  }
}
