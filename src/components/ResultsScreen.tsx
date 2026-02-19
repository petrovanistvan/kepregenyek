import { useState } from "react";
import { ChevronDown, ChevronUp, BookOpen, Star } from "lucide-react";
import type { RecommendationResult } from "@/hooks/useRecommender";

interface ResultsScreenProps {
  result: RecommendationResult;
  answers: Record<string, boolean>;
  questions: { id: string; text: string; icon: string }[];
  onRestart: () => void;
}

const ResultsScreen = ({ result, answers, questions, onRestart }: ResultsScreenProps) => {
  const [showReasoning, setShowReasoning] = useState(false);

  return (
    <div className="mx-auto max-w-2xl animate-slide-in">
      <div className="mb-8 text-center">
        <Star className="mx-auto mb-3 h-12 w-12 text-accent" />
        <h1 className="mb-2 text-3xl font-bold md:text-4xl">{result.title}</h1>
        <p className="text-muted-foreground">
          We found {result.recommendations.length} comics for you
        </p>
      </div>

      <div className="space-y-4">
        {result.recommendations.map((rec, i) => (
          <div key={i} className="comic-panel-sm p-5 animate-slide-in" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-start gap-3">
              <BookOpen className="mt-1 h-5 w-5 shrink-0 text-accent" />
              <div>
                <h3 className="text-lg font-bold">{rec.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{rec.description}</p>
                <p className="mt-2 text-sm font-medium italic text-accent-foreground">
                  "{rec.why}"
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Why these? */}
      <div className="mt-8">
        <button
          onClick={() => setShowReasoning(!showReasoning)}
          className="flex w-full items-center justify-between rounded-lg bg-secondary px-5 py-3 font-semibold transition-colors hover:bg-muted"
        >
          <span>Why these recommendations?</span>
          {showReasoning ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>

        {showReasoning && (
          <div className="mt-3 rounded-lg border border-border bg-card p-5 animate-fade-in">
            <p className="mb-4 text-sm text-muted-foreground">{result.reasoning}</p>
            <h4 className="mb-2 font-bold text-sm">Your Answers:</h4>
            <ul className="space-y-1 text-sm">
              {questions.map((q) => (
                <li key={q.id} className="flex items-center gap-2">
                  <span>{q.icon}</span>
                  <span className="text-muted-foreground">{q.text}</span>
                  <span className="ml-auto font-bold">
                    {answers[q.id] ? "✅ Yes" : "❌ No"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={onRestart}
          className="comic-panel-sm px-8 py-3 font-bold transition-transform hover:scale-105 active:scale-95"
        >
          🔄 Start Over
        </button>
      </div>
    </div>
  );
};

export default ResultsScreen;
