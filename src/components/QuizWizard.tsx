import { useState, useCallback } from "react";
import { ArrowLeft, RotateCcw, Loader2 } from "lucide-react";
import questions from "@/data/questions.json";
import QuestionCard from "./QuestionCard";
import ProgressBar from "./ProgressBar";
import ResultsScreen from "./ResultsScreen";
import { useRecommender } from "@/hooks/useRecommender";

const QuizWizard = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const { recommending, result, error, getRecommendations, reset } = useRecommender();

  const handleAnswer = useCallback(
    (answer: boolean) => {
      const q = questions[currentIndex];
      const newAnswers = { ...answers, [q.id]: answer };
      setAnswers(newAnswers);

      if (currentIndex < questions.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        getRecommendations(newAnswers);
      }
    },
    [currentIndex, answers, getRecommendations]
  );

  const handleBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setAnswers({});
    reset();
  }, [reset]);

  // Recommending state
  if (recommending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center animate-fade-in">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-accent" />
          <h2 className="text-xl font-bold">Ajánlatok keresése…</h2>
          <p className="text-muted-foreground">Az ajánlómotor dolgozik</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="comic-panel p-8">
          <p className="mb-4 text-lg font-bold text-destructive">Hiba történt</p>
          <p className="mb-6 text-sm text-muted-foreground">{error}</p>
          <button
            onClick={handleRestart}
            className="rounded-md bg-primary px-6 py-2 font-semibold text-primary-foreground"
          >
            Újra
          </button>
        </div>
      </div>
    );
  }

  // Results
  if (result) {
    return (
      <ResultsScreen
        result={result}
        answers={answers}
        questions={questions}
        onRestart={handleRestart}
      />
    );
  }

  // Quiz
  return (
    <div>
      <ProgressBar current={currentIndex} total={questions.length} />

      <div className="mt-8">
        <QuestionCard
          key={questions[currentIndex].id}
          question={questions[currentIndex]}
          onAnswer={handleAnswer}
        />
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          onClick={handleBack}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
        >
          <ArrowLeft className="h-4 w-4" /> Vissza
        </button>
        <button
          onClick={handleRestart}
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" /> Újrakezdés
        </button>
      </div>
    </div>
  );
};

export default QuizWizard;
