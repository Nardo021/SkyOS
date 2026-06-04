import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class RootErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[SkyOS]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full min-h-screen flex-col items-center justify-center gap-3 bg-background p-8 text-foreground">
          <h1 className="text-lg font-semibold text-destructive">
            界面加载失败
          </h1>
          <p className="max-w-lg text-center text-sm text-muted-foreground">
            {this.state.error.message}
          </p>
          <button
            type="button"
            className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
            onClick={() => this.setState({ error: null })}
          >
            重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
