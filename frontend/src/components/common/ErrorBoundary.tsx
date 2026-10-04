/**
 * Application-Level React Error Boundary (Phase 9 Brick 33).
 *
 * Prevents white-screen crashes on rendering failures.
 * Displays a calm, reassuring message to parents and students without exposing
 * React component stacks, source paths, or technical traces.
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Technical stack trace is logged to browser console for developer diagnostics only
    console.error('[ApplicationErrorBoundary] Render failure caught:', error, errorInfo);
  }

  private handleRefresh = (): void => {
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl bg-card border border-border/60 p-6 sm:p-8 text-center shadow-glass space-y-5">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-text-primary">
                Something went wrong
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed">
                We encountered an unexpected issue while displaying this page.
                Please try refreshing to continue.
              </p>
              <p className="text-xs text-text-muted">
                ఏదో సమస్య ఏర్పడింది. దయచేసి పేజీని రీఫ్రెష్ చేయండి.
              </p>
            </div>

            <div className="pt-2 flex justify-center">
              <Button
                variant="primary"
                size="md"
                onClick={this.handleRefresh}
                className="gap-2 px-6"
              >
                <RotateCw className="h-4 w-4" />
                <span>Refresh Page / రీఫ్రెష్ చేయండి</span>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
