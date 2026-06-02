import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-[#1A0000] border border-[#FF3A2D]/30 rounded-xl space-y-4 text-left select-text max-w-2xl mx-auto my-8">
          <h2 className="text-xl font-bold text-[#FF3A2D] font-bebas uppercase tracking-wide">
            Component Rendering Error
          </h2>
          <div className="text-sm font-semibold text-[#FF8C00] font-sans">
            {this.state.error?.toString()}
          </div>
          <pre className="text-[10px] text-[#D1D1D1] font-mono bg-black/40 p-4 rounded overflow-auto max-h-[300px] whitespace-pre-wrap">
            {this.state.errorInfo?.componentStack || this.state.error?.stack}
          </pre>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary;
