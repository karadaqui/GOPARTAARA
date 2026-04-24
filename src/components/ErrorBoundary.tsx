import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
          <div
            className="flex items-center justify-center rounded-full mb-5"
            style={{
              width: "64px",
              height: "64px",
              background: "rgba(204,17,17,0.1)",
              border: "1px solid rgba(204,17,17,0.25)",
            }}
          >
            <AlertTriangle className="h-7 w-7" style={{ color: "#cc1111" }} />
          </div>
          <h2 className="text-xl font-bold mb-2 text-foreground">
            Something went wrong. We're on it.
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md text-sm">
            An unexpected error occurred. Try again, or search eBay directly while we recover.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="rounded-xl gap-2"
            >
              <RefreshCw size={14} /> Try again
            </Button>
            <Button
              variant="outline"
              onClick={() => { window.open("https://www.ebay.co.uk/b/Car-Parts/6030", "_blank", "noopener"); }}
              className="rounded-xl gap-2"
            >
              Search eBay directly →
            </Button>
            <Button
              variant="ghost"
              onClick={() => { window.location.href = "/"; }}
              className="rounded-xl gap-2"
            >
              <Home size={14} /> Go Home
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
