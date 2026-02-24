import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, BookOpen, Star, X, Volume2, Square, Loader2, ImageIcon, RefreshCw } from "lucide-react";
import type { RecommendationResult } from "@/hooks/useRecommender";
import { supabase } from "@/integrations/supabase/client";

interface ResultsScreenProps {
  result: RecommendationResult;
  answers: Record<string, boolean>;
  questions: { id: string; text: string; icon: string }[];
  onRestart: () => void;
}

const ResultsScreen = ({ result, answers, questions, onRestart }: ResultsScreenProps) => {
  const [showReasoning, setShowReasoning] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<Record<number, string>>({});
  const [imageLoading, setImageLoading] = useState<Record<number, boolean>>({});
  const [generatedSummaries, setGeneratedSummaries] = useState<Record<number, string>>({});
  const [summaryLoading, setSummaryLoading] = useState<Record<number, boolean>>({});

  const selectedRec = selectedIndex !== null ? result.recommendations[selectedIndex] : null;

  // Generate image AND summary in parallel when a card is opened
  useEffect(() => {
    if (selectedIndex === null) return;
    const rec = result.recommendations[selectedIndex];
    const idx = selectedIndex;

    // Generate image
    if (!generatedImages[idx] && !imageLoading[idx]) {
      setImageLoading((prev) => ({ ...prev, [idx]: true }));
      supabase.functions
        .invoke("generate-comic-image", {
          body: { title: rec.title, summary: rec.summary || rec.description },
        })
        .then(({ data }) => {
          if (data?.imageUrl) {
            setGeneratedImages((prev) => ({ ...prev, [idx]: data.imageUrl }));
          }
        })
        .catch(() => {})
        .finally(() => {
          setImageLoading((prev) => ({ ...prev, [idx]: false }));
        });
    }

    // Generate summary
    if (!generatedSummaries[idx] && !summaryLoading[idx]) {
      setSummaryLoading((prev) => ({ ...prev, [idx]: true }));
      supabase.functions
        .invoke("generate-comic-summary", {
          body: { title: rec.title, description: rec.description, why: rec.why },
        })
        .then(({ data }) => {
          if (data?.summary) {
            setGeneratedSummaries((prev) => ({ ...prev, [idx]: data.summary }));
          }
        })
        .catch(() => {})
        .finally(() => {
          setSummaryLoading((prev) => ({ ...prev, [idx]: false }));
        });
    }
  }, [selectedIndex]);

  const currentSummary =
    selectedIndex !== null
      ? generatedSummaries[selectedIndex] || selectedRec?.summary || ""
      : "";

  const handleTts = (text: string) => {
    if (ttsPlaying) {
      window.speechSynthesis.cancel();
      setTtsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hu-HU";
    utterance.rate = 1;
    utterance.onend = () => setTtsPlaying(false);
    utterance.onerror = () => setTtsPlaying(false);
    setTtsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleCloseModal = () => {
    window.speechSynthesis.cancel();
    setTtsPlaying(false);
    setSelectedIndex(null);
  };

  const handleRegenerate = () => {
    if (selectedIndex === null) return;
    const idx = selectedIndex;
    const rec = result.recommendations[idx];

    // Clear cached results
    setGeneratedImages((prev) => { const n = { ...prev }; delete n[idx]; return n; });
    setGeneratedSummaries((prev) => { const n = { ...prev }; delete n[idx]; return n; });
    window.speechSynthesis.cancel();
    setTtsPlaying(false);

    // Trigger regeneration
    setImageLoading((prev) => ({ ...prev, [idx]: true }));
    setSummaryLoading((prev) => ({ ...prev, [idx]: true }));

    supabase.functions
      .invoke("generate-comic-image", {
        body: { title: rec.title, summary: rec.summary || rec.description },
      })
      .then(({ data }) => {
        if (data?.imageUrl) setGeneratedImages((prev) => ({ ...prev, [idx]: data.imageUrl }));
      })
      .catch(() => {})
      .finally(() => setImageLoading((prev) => ({ ...prev, [idx]: false })));

    supabase.functions
      .invoke("generate-comic-summary", {
        body: { title: rec.title, description: rec.description, why: rec.why },
      })
      .then(({ data }) => {
        if (data?.summary) setGeneratedSummaries((prev) => ({ ...prev, [idx]: data.summary }));
      })
      .catch(() => {})
      .finally(() => setSummaryLoading((prev) => ({ ...prev, [idx]: false })));
  };

  return (
    <div className="mx-auto max-w-2xl animate-slide-in">
      <div className="mb-8 text-center">
        <Star className="mx-auto mb-3 h-12 w-12 text-accent" />
        <h1 className="mb-2 text-3xl font-bold md:text-4xl">{result.title}</h1>
        <p className="text-muted-foreground">
          {result.recommendations.length} kötetet válogattunk neked
        </p>
      </div>

      <div className="space-y-4">
        {result.recommendations.map((rec, i) => (
          <button
            key={i}
            onClick={() => setSelectedIndex(i)}
            className="comic-panel-sm w-full p-5 text-left animate-slide-in transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            style={{ animationDelay: `${i * 80}ms` }}
          >
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
          </button>
        ))}
      </div>

      {/* Detail overlay */}
      {selectedRec && selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in"
          onClick={handleCloseModal}
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-end mb-2">
              <button
                onClick={handleCloseModal}
                className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Generated image */}
            <div className="mb-4 h-[min(38vh,320px)] w-full overflow-hidden rounded-xl bg-muted flex items-center justify-center">
              {imageLoading[selectedIndex] ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="text-xs">Kép generálása…</span>
                </div>
              ) : generatedImages[selectedIndex] ? (
                <img
                  src={generatedImages[selectedIndex]}
                  alt={`${selectedRec.title} illusztráció`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImageIcon className="h-8 w-8" />
                  <span className="text-xs">Kép nem elérhető</span>
                </div>
              )}
            </div>

            <BookOpen className="mb-3 h-8 w-8 text-accent" />
            <h2 className="mb-1 text-2xl font-bold">{selectedRec.title}</h2>
            <p className="mb-4 text-sm text-muted-foreground">{selectedRec.description}</p>
            <div className="rounded-lg bg-secondary p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Spoilermentes ismertető
                </h3>
                <button
                  onClick={() => handleTts(currentSummary)}
                  disabled={summaryLoading[selectedIndex]}
                  className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {ttsPlaying ? (
                    <Square className="h-3.5 w-3.5" />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5" />
                  )}
                  {ttsPlaying ? "Leállítás" : "Felolvasás"}
                </button>
              </div>
              {summaryLoading[selectedIndex] ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Ismertető generálása…</span>
                </div>
              ) : (
                <p className="text-sm leading-relaxed">{currentSummary}</p>
              )}
            </div>
            {selectedRec.details && (
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {selectedRec.details.characters && (
                  <span className="rounded-full bg-muted px-3 py-1">
                    🦸 {selectedRec.details.characters}
                  </span>
                )}
                {selectedRec.details.price_per_page && (
                  <span className="rounded-full bg-muted px-3 py-1">
                    💰 {selectedRec.details.price_per_page}
                  </span>
                )}
              </div>
            )}
            <div className="mt-4 flex justify-center">
              <button
                onClick={handleRegenerate}
                disabled={imageLoading[selectedIndex] || summaryLoading[selectedIndex]}
                className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${imageLoading[selectedIndex] || summaryLoading[selectedIndex] ? "animate-spin" : ""}`} />
                Újragenerálás
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Why these? */}
      <div className="mt-8">
        <button
          onClick={() => setShowReasoning(!showReasoning)}
          className="flex w-full items-center justify-between rounded-lg bg-secondary px-5 py-3 font-semibold transition-colors hover:bg-muted"
        >
          <span>Miért ezeket ajánljuk?</span>
          {showReasoning ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>

        {showReasoning && (
          <div className="mt-3 rounded-lg border border-border bg-card p-5 animate-fade-in">
            <p className="mb-4 text-sm text-muted-foreground">{result.reasoning}</p>
            <h4 className="mb-2 font-bold text-sm">Válaszaid:</h4>
            <ul className="space-y-1 text-sm">
              {questions.map((q) => (
                <li key={q.id} className="flex items-center gap-2">
                  <span>{q.icon}</span>
                  <span className="text-muted-foreground">{q.text}</span>
                  <span className="ml-auto font-bold">
                    {answers[q.id] ? "✅ Igen" : "❌ Nem"}
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
          🔄 Újrakezdés
        </button>
      </div>
    </div>
  );
};

export default ResultsScreen;
