'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

import { Button } from '@nestlancer/ui';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8">
            <p className="text-center text-muted-foreground">Something went wrong.</p>
            <Button type="button" onClick={() => this.setState({ hasError: false })}>
              Try again
            </Button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
