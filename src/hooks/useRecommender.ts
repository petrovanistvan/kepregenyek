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

  // Enrich recommendations with details from comic_database.json
  const enrichWithDetails = async (recs: RecommendationResult): Promise<RecommendationResult> => {
    try {
      const res = await fetch("/engine/comic_database.json");
      if (!res.ok) return recs;
      const comics: any[] = await res.json();

      const comicMap = new Map<string, any>();
      for (const c of comics) {
        comicMap.set(c.title?.toLowerCase(), c);
      }

      const enriched = recs.recommendations.map((rec) => {
        if (rec.details?.price_per_page) return rec; // already has details
        const match = comicMap.get(rec.title?.toLowerCase());
        if (!match) return rec;

        const pages = match.pages || 0;
        const price = match.price_huf || 0;
        const rating = match.rating || 0;
        const ppp = pages > 0 && price > 0 ? Math.round((price / pages) * 100) / 100 : null;
        const roi = price > 0 ? Math.round(((rating * pages) / price) * 10000) / 10000 : 0;
        const chars = (match.characters || []).join(", ");

        return {
          ...rec,
          details: {
            price_per_page: ppp ? `${ppp} Ft/oldal` : undefined,
            roi,
            characters: chars || undefined,
          },
        };
      });

      return { ...recs, recommendations: enriched };
    } catch {
      return recs;
    }
  };

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
        // Try AI first with timeout so fallback can kick in fast
        const aiResult = await Promise.race<RecommendationResult>([
          getRecommendationsFromAI(answers),
          new Promise<RecommendationResult>((_, reject) =>
            setTimeout(() => reject(new Error("AI recommendation timeout")), 25000)
          ),
        ]);

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
