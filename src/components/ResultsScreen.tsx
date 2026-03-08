import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, BookOpen, Star, X, Volume2, Square, Loader2, ImageIcon, RefreshCw, Sparkles } from "lucide-react";
import type { RecommendationResult, Recommendation } from "@/hooks/useRecommender";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ResultsScreenProps {
  result: RecommendationResult;
  answers: Record<string, boolean>;
  questions: { id: string; text: string; icon: string }[];
  onRestart: () => void;
}

const ResultsScreen = ({ result, answers, questions, onRestart }: ResultsScreenProps) => {
  const [showReasoning, setShowReasoning] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const moreLikeThisRef = useRef<HTMLDivElement>(null);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<Record<string | number, string>>({});
  const [imageLoading, setImageLoading] = useState<Record<string | number, boolean>>({});
  const [generatedSummaries, setGeneratedSummaries] = useState<Record<string | number, string>>({});
  const [summaryLoading, setSummaryLoading] = useState<Record<string | number, boolean>>({});
  const [moreLikeThis, setMoreLikeThis] = useState<Recommendation[] | null>(null);
  const [moreLikeThisLoading, setMoreLikeThisLoading] = useState<number | null>(null);
  const [moreLikeThisSource, setMoreLikeThisSource] = useState<string | null>(null);
  const [selectedMoreRec, setSelectedMoreRec] = useState<Recommendation | null>(null);

  const { toast } = useToast();
  const selectedRec = selectedMoreRec ?? (selectedIndex !== null ? result.recommendations[selectedIndex] : null);

  const generateAssets = async (
    idx: string | number,
    rec: RecommendationResult["recommendations"][number],
    options?: { force?: boolean; silent?: boolean }
  ) => {
    const force = options?.force ?? false;
    const silent = options?.silent ?? false;

    // Run image and summary generation in parallel
    const imagePromise = (force || !generatedImages[idx]) && !imageLoading[idx]
      ? (async () => {
          setImageLoading((prev) => ({ ...prev, [idx]: true }));
          const { data, error } = await supabase.functions.invoke("generate-comic-image", {
            body: { title: rec.title, summary: rec.summary || rec.description },
          });

          if (!error && data?.imageUrl) {
            setGeneratedImages((prev) => ({ ...prev, [idx]: data.imageUrl as string }));
          } else if (!silent) {
            toast({
              title: "Nem sikerült képet generálni",
              description: "Próbáld újra az Újragenerálás gombbal.",
              variant: "destructive",
            });
          }
          setImageLoading((prev) => ({ ...prev, [idx]: false }));
        })()
      : Promise.resolve();

    const summaryPromise = (force || !generatedSummaries[idx]) && !summaryLoading[idx]
      ? (async () => {
          setSummaryLoading((prev) => ({ ...prev, [idx]: true }));
          const { data, error } = await supabase.functions.invoke("generate-comic-summary", {
            body: { title: rec.title, description: rec.description, why: rec.why },
          });
          if (!error && data?.summary) {
            setGeneratedSummaries((prev) => ({ ...prev, [idx]: data.summary }));
          }
          setSummaryLoading((prev) => ({ ...prev, [idx]: false }));
        })()
      : Promise.resolve();

    await Promise.all([imagePromise, summaryPromise]);
  };

  // Compute a stable key for the currently selected recommendation
  const modalKey = selectedMoreRec
    ? `more-${selectedMoreRec.title}`
    : selectedIndex !== null
      ? selectedIndex
      : null;

  useEffect(() => {
    if (modalKey === null || !selectedRec) return;
    void generateAssets(modalKey, selectedRec, { silent: true });
  }, [modalKey]);

  const currentSummary = modalKey !== null ? generatedSummaries[modalKey] || "" : "";

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
    setSelectedMoreRec(null);
  };

  const handleRegenerate = () => {
    if (modalKey === null || !selectedRec) return;
    const key = modalKey;

    setGeneratedImages((prev) => {
      const n = { ...prev };
      delete n[key];
      return n;
    });
    setGeneratedSummaries((prev) => {
      const n = { ...prev };
      delete n[key];
      return n;
    });

    window.speechSynthesis.cancel();
    setTtsPlaying(false);

    void generateAssets(key, selectedRec, { force: true });
  };

  const handleMoreLikeThis = async (rec: Recommendation, cardIndex: number) => {
    setMoreLikeThisLoading(cardIndex);
    setMoreLikeThis(null);
    setMoreLikeThisSource(rec.title);

    // Scroll to the section after a tick so the DOM renders
    setTimeout(() => {
      moreLikeThisRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);

    try {
      const { data, error } = await supabase.functions.invoke("generate-more-like-this", {
        body: { title: rec.title, description: rec.description },
      });

      if (error) throw new Error(error.message || "Hálózati hiba");
      if (data?.error) throw new Error(data.error);

      setMoreLikeThis(data?.recommendations || []);
    } catch (err: any) {
      console.error("More like this error:", err);
      toast({
        title: "Hiba történt",
        description: err.message || "Nem sikerült hasonló ajánlásokat kérni.",
        variant: "destructive",
      });
    } finally {
      setMoreLikeThisLoading(null);
    }
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
          <div
            key={i}
            className="comic-panel-sm w-full p-5 text-left animate-slide-in"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <button
              onClick={() => setSelectedIndex(i)}
              className="w-full text-left transition-transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <BookOpen className="mt-1 h-5 w-5 shrink-0 text-accent" />
                <div>
                  <h3 className="text-lg font-bold text-foreground">{rec.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{rec.description}</p>
                  <p className="mt-2 text-sm font-medium italic text-foreground/80">
                    "{rec.why}"
                  </p>
                </div>
              </div>
            </button>
            <div className="mt-3 flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMoreLikeThis(rec, i);
                }}
                disabled={moreLikeThisLoading !== null}
                className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <Sparkles className={`h-3.5 w-3.5 ${moreLikeThisLoading === i ? "animate-spin" : ""}`} />
                Még több ilyet
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail overlay */}
      {selectedRec && modalKey !== null && (
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
            <div className="mb-4 aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted flex items-center justify-center">
              {imageLoading[modalKey] ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="text-xs">Kép generálása…</span>
                </div>
              ) : generatedImages[modalKey] ? (
                <img
                  src={generatedImages[modalKey]}
                  alt={`${selectedRec.title} illusztráció`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImageIcon className="h-8 w-8" />
                  <span className="text-xs">Kép nem elérhető</span>
                </div>
              )}
            </div>

            <BookOpen className="mb-3 h-8 w-8 text-accent" />
            <h2 className="mb-1 text-2xl font-bold text-foreground">{selectedRec.title}</h2>
            <p className="mb-4 text-sm text-muted-foreground">{selectedRec.description}</p>
            <div className="rounded-lg bg-secondary p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Spoilermentes ismertető
                </h3>
                <button
                  onClick={() => handleTts(currentSummary)}
                  disabled={summaryLoading[modalKey]}
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
              {summaryLoading[modalKey] || (!currentSummary && !summaryLoading[modalKey] && modalKey !== null) ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Ismertető generálása…</span>
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-secondary-foreground">{currentSummary}</p>
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
                disabled={imageLoading[modalKey] || summaryLoading[modalKey]}
                className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${imageLoading[modalKey] || summaryLoading[modalKey] ? "animate-spin" : ""}`} />
                Újragenerálás
              </button>
            </div>
          </div>
        </div>
      )}

      {/* More like this results */}
      {(moreLikeThis || moreLikeThisLoading !== null) && (
        <div ref={moreLikeThisRef} className="mt-8 animate-fade-in">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
            <Sparkles className="h-5 w-5 text-accent" />
            Hasonló ajánlások – {moreLikeThisSource}
          </h3>
          {moreLikeThisLoading !== null ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Hasonló képregények keresése…</span>
            </div>
          ) : (
            <div className="space-y-3">
              {moreLikeThis?.map((rec, i) => (
                <div
                  key={i}
                  className="comic-panel-sm w-full p-4 animate-slide-in"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <button
                    onClick={() => setSelectedMoreRec(rec)}
                    className="w-full text-left transition-transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <BookOpen className="mt-1 h-5 w-5 shrink-0 text-accent" />
                      <div>
                        <h4 className="font-bold text-foreground">{rec.title}</h4>
                        <p className="mt-1 text-sm text-foreground">{rec.description}</p>
                        <p className="mt-1 text-sm italic text-foreground/80">"{rec.why}"</p>
                      </div>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => { setMoreLikeThis(null); setMoreLikeThisSource(null); }}
            className="mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕ Bezárás
          </button>
        </div>
      )}

      {/* Why these? */}
      <div className="mt-8">
        <button
          onClick={() => setShowReasoning(!showReasoning)}
          className="flex w-full items-center justify-between rounded-lg bg-secondary px-5 py-3 font-semibold text-foreground transition-colors hover:bg-muted"
        >
          <span>Miért ezeket ajánljuk?</span>
          {showReasoning ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>

        {showReasoning && (
          <div className="mt-3 rounded-lg border border-border bg-card p-5 animate-fade-in">
            <p className="mb-4 text-sm text-muted-foreground">{result.reasoning}</p>
            <h4 className="mb-2 font-bold text-sm text-foreground">Válaszaid:</h4>
            <ul className="space-y-1 text-sm">
              {questions.map((q) => (
                <li key={q.id} className="flex items-center gap-2">
                  <span>{q.icon}</span>
                  <span className="text-muted-foreground">{q.text}</span>
                  <span className="ml-auto font-bold text-foreground">
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
          className="comic-panel-sm px-8 py-3 font-bold text-foreground transition-transform hover:scale-105 active:scale-95"
        >
          🔄 Újrakezdés
        </button>
      </div>
    </div>
  );
};

export default ResultsScreen;
