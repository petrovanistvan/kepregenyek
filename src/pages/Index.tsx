import { BookOpen } from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import QuizWizard from "@/components/QuizWizard";
import ThemeToggle from "@/components/ThemeToggle";
import { usePyodide } from "@/hooks/usePyodide";

const Index = () => {
  const { loading, error } = usePyodide();

  if (loading || error) {
    return <LoadingScreen loading={loading} error={error} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card py-4">
        <div className="container flex items-center justify-center gap-3">
          <BookOpen className="h-7 w-7 text-accent" />
          <h1 className="text-2xl font-bold tracking-tight">
            DC / Marvel Ajánló
          </h1>
        </div>
      </header>

      <main className="container py-10 px-4">
        <QuizWizard />
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        Python (Pyodide) · Böngészőben futó ajánlórendszer ✨
      </footer>
    </div>
  );
};

export default Index;
