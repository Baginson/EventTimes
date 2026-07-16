import { Component, type ErrorInfo, type ReactNode } from 'react'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled render error caught by ErrorBoundary:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="error-boundary-shell" role="alert">
          <section className="error-boundary-card" aria-labelledby="error-boundary-title">
            <p className="error-boundary-kicker">EventTimes</p>
            <h1 id="error-boundary-title" className="error-boundary-title">
              Coś poszło nie tak
            </h1>
            <p className="error-boundary-message">
              Wystąpił nieoczekiwany błąd widoku. Odśwież stronę, żeby spróbować
              ponownie.
            </p>
            <button className="error-boundary-button" type="button" onClick={this.handleReload}>
              Odśwież stronę
            </button>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
