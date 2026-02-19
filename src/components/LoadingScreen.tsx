import { BookOpen, Loader2, AlertTriangle } from "lucide-react";

interface LoadingScreenProps {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
}

const LoadingScreen = ({ loading, error }: LoadingScreenProps) => {
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="comic-panel max-w-md p-8 text-center animate-slide-in">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h2 className="mb-2 text-2xl font-bold">Oops!</h2>
          <p className="text-muted-foreground">
            We couldn't load the Python runtime. This app needs WebAssembly support.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-md bg-primary px-6 py-2 font-semibold text-primary-foreground transition-transform hover:scale-105"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center animate-fade-in">
          <div className="relative mx-auto mb-6 h-20 w-20">
            <BookOpen className="h-20 w-20 text-primary" />
            <Loader2 className="absolute -bottom-1 -right-1 h-8 w-8 animate-spin text-accent" />
          </div>
          <h2 className="mb-2 text-2xl font-bold">Loading Comic Engine…</h2>
          <p className="text-muted-foreground">Setting up Python in your browser</p>
        </div>
      </div>
    );
  }

  return null;
};

export default LoadingScreen;
