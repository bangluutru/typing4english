import { Component, type ErrorInfo, type ReactNode } from 'react';

/* Class component, so no hooks: messages are shown in all three languages. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Typing4English crashed:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="card max-w-md p-8 text-center">
          <div className="mb-3 text-5xl" aria-hidden="true">🙇</div>
          <h1 className="mb-2 text-xl font-black">ごめんなさい、エラーが おきました</h1>
          <p className="mb-1 text-ink-2">Xin lỗi, đã có lỗi xảy ra.</p>
          <p className="mb-6 text-ink-2">Sorry, something went wrong.</p>
          <button className="btn btn-primary" onClick={() => { window.location.hash = '#/'; window.location.reload(); }}>
            もう一度 / Thử lại / Reload
          </button>
          <pre className="mt-6 max-h-32 overflow-auto rounded-lg bg-dim p-3 text-left text-xs text-muted">{String(this.state.error.message)}</pre>
        </div>
      </div>
    );
  }
}
