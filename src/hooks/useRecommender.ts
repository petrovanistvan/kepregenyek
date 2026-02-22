import { useState, useCallback } from "react";
import { usePyodide } from "./usePyodide";

export interface Recommendation {
  title: string;
  description: string;
  why: string;
  summary: string;
  details?: {
    price_per_page?: string;
    roi?: number;
    characters?: string;
  };
}

export interface RecommendationResult {
  title: string;
  recommendations: Recommendation[];
  reasoning: string;
}

interface UseRecommenderReturn {
  pyodideLoading: boolean;
  pyodideError: string | null;
  recommending: boolean;
  result: RecommendationResult | null;
  error: string | null;
  getRecommendations: (answers: Record<string, boolean>) => Promise<void>;
  reset: () => void;
}

export function useRecommender(): UseRecommenderReturn {
  const { pyodide, loading: pyodideLoading, error: pyodideError, runPython } = usePyodide();
  const [recommending, setRecommending] = useState(false);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getRecommendations = useCallback(
    async (answers: Record<string, boolean>) => {
      if (!pyodide) {
        setError("Python runtime not ready");
        return;
      }

      setRecommending(true);
      setError(null);

      try {
        // Fetch the Python script and comic database in parallel
        const [scriptRes, dataRes] = await Promise.all([
          fetch("/engine/recommender.py"),
          fetch("/engine/comic_database.json"),
        ]);
        if (!scriptRes.ok) throw new Error("Failed to load recommender script");
        if (!dataRes.ok) throw new Error("Failed to load comic database");
        const script = await scriptRes.text();
        const comicsJson = await dataRes.text();

        // Load the script into Pyodide
        await runPython(script);

        // Call the recommend function with answers and comic data
        const answersJson = JSON.stringify(answers);
        const safeAnswers = answersJson.replace(/'/g, "\\'");
        const safeComics = comicsJson.replace(/'/g, "\\'").replace(/\n/g, "");
        const resultJson = await runPython(`recommend('${safeAnswers}', '${safeComics}')`);
        const parsed: RecommendationResult = JSON.parse(resultJson);
        setResult(parsed);
      } catch (err: any) {
        setError(err.message || "Failed to get recommendations");
      } finally {
        setRecommending(false);
      }
    },
    [pyodide, runPython]
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { pyodideLoading, pyodideError, recommending, result, error, getRecommendations, reset };
}
