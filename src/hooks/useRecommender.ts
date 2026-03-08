import { useState, useCallback } from "react";
import { usePyodide } from "./usePyodide";
import { supabase } from "@/integrations/supabase/client";
import questions from "@/data/questions.json";

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

  const getRecommendationsFromAI = async (
    answers: Record<string, boolean>
  ): Promise<RecommendationResult> => {
    const { data, error: fnError } = await supabase.functions.invoke(
      "generate-recommendations",
      { body: { answers, questions } }
    );

    if (fnError) throw new Error(fnError.message || "AI recommendation failed");
    if (data?.error) throw new Error(data.error);
    return data as RecommendationResult;
  };

  const getRecommendationsFromPyodide = async (
    answers: Record<string, boolean>
  ): Promise<RecommendationResult> => {
    if (!pyodide) throw new Error("Python runtime not ready");

    const [scriptRes, dataRes] = await Promise.all([
      fetch("/engine/recommender.py"),
      fetch("/engine/comic_database.json"),
    ]);
    if (!scriptRes.ok) throw new Error("Failed to load recommender script");
    if (!dataRes.ok) throw new Error("Failed to load comic database");
    const script = await scriptRes.text();
    const comicsJson = await dataRes.text();

    await runPython(script);
    const answersJson = JSON.stringify(answers);
    const safeAnswers = answersJson.replace(/'/g, "\\'");
    const safeComics = comicsJson.replace(/'/g, "\\'").replace(/\n/g, "");
    const resultJson = await runPython(`recommend('${safeAnswers}', '${safeComics}')`);
    return JSON.parse(resultJson);
  };

  const getRecommendations = useCallback(
    async (answers: Record<string, boolean>) => {
      setRecommending(true);
      setError(null);

      try {
        // Try AI first
        const aiResult = await getRecommendationsFromAI(answers);
        setResult(aiResult);
      } catch (aiErr: any) {
        console.warn("AI recommendation failed, falling back to Pyodide:", aiErr.message);
        try {
          const pyResult = await getRecommendationsFromPyodide(answers);
          setResult(pyResult);
        } catch (pyErr: any) {
          setError(pyErr.message || "Failed to get recommendations");
        }
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
