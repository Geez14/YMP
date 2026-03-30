"use client";

import type { ReactNode } from "react";
import { Component } from "react";

type PlayerErrorBoundaryProps = {
  children: ReactNode;
};

type PlayerErrorBoundaryState = {
  hasError: boolean;
};

export class PlayerErrorBoundary extends Component<PlayerErrorBoundaryProps, PlayerErrorBoundaryState> {
  state: PlayerErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): PlayerErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Player feature error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-dashed p-4 text-sm text-[#c43d3d]">
          Playback failed. Refresh the page or choose another track.
        </div>
      );
    }

    return this.props.children;
  }
}