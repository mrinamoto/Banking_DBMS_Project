import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() { return { hasError: true }; }

  componentDidCatch(error) { console.error("Protected page rendering failed:", error); }

  render() {
    if (!this.state.hasError) return this.props.children;
    return <main className="card m-6" role="alert"><h1 className="text-xl font-bold">This page could not be displayed</h1><p className="mt-2 text-sm text-slate-600">Refresh the page or return to the dashboard. Your saved banking data was not changed.</p><button className="btn-primary mt-4" onClick={() => window.location.reload()}>Refresh page</button></main>;
  }
}
