import { Component, type ReactNode } from 'react';
import { ErrorNotice } from './Display';
import { Button } from './Button';

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <ErrorNotice
        title="This page hit a problem"
        description="Your data is safe. Try again, or reload the app if it keeps happening."
        action={<div className="flex gap-2"><Button size="sm" onClick={() => this.setState({ failed: false })}>Try again</Button><Button size="sm" onClick={() => window.location.reload()}>Reload</Button></div>}
      />
    );
  }
}
