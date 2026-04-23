import { Component } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#1e293b] rounded-2xl p-8 border border-red-500/30">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <AlertCircle className="w-8 h-8" />
              <h2 className="text-xl font-bold">Application Error</h2>
            </div>
            <p className="text-slate-400 mb-4">
              Something went wrong. Please refresh the page.
            </p>
            {this.state.error && (
              <details className="mb-4">
                <summary className="text-xs text-slate-500 cursor-pointer">Error details</summary>
                <pre className="mt-2 text-xs text-red-400 bg-red-500/10 p-3 rounded overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-accent-500 hover:bg-accent-400 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
