import React from 'react'

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, errorMessage: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || 'Unexpected application error' }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[AppErrorBoundary]', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-900 text-slate-100 flex items-center justify-center p-6">
          <div className="glass-strong rounded-2xl p-6 max-w-xl w-full">
            <h1 className="text-lg font-semibold text-red-400 mb-2">Application Error</h1>
            <p className="text-sm text-slate-300 mb-4">
              The app crashed while rendering. Try reloading once.
            </p>
            <p className="text-xs text-slate-500 break-words mb-4">
              {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-400 text-white text-sm font-medium transition-all duration-200"
            >
              Reload App
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
