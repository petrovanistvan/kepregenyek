import { useState, useCallback } from "react";
import { usePyodide } from "./usePyodide";

export interface Recommendation {
  title: string;
  description: string;
  why: string;
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
        // Fetch the Python script
        const res = await fetch("/engine/recommender.py");
        if (!res.ok) throw new Error("Failed to load recommender script");
        const script = await res.text();

        // Load the script into Pyodide
        await runPython(script);

        // Call the recommend function
        const answersJson = JSON.stringify(answers);
        const resultJson = await runPython(`recommend('${answersJson.replace(/'/g, "\\'")}')`);
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
