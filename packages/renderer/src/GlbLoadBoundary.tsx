import { Component, type ErrorInfo, type ReactNode } from "react";
import { markAircraftModelLoadFailed } from "./aircraftModelCatalog";

interface Props {
  fallback: ReactNode;
  children: ReactNode;
  modelKey?: string;
}

interface State {
  failed: boolean;
}

export class GlbLoadBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (this.props.modelKey) {
      markAircraftModelLoadFailed(this.props.modelKey);
    }
    console.warn(
      "[SkyOS] aircraft GLB load failed",
      this.props.modelKey ?? "(layer)",
      error,
      info.componentStack,
    );
  }

  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}