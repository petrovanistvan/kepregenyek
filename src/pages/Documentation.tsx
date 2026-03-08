const Documentation = () => {
  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Print button - hidden in print */}
      <div className="print:hidden sticky top-0 z-50 border-b border-border bg-card px-6 py-3 flex items-center justify-between">
        <a href="/" className="text-sm text-primary hover:underline">← Vissza az alkalmazáshoz</a>
        <button
          onClick={handlePrint}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105 active:scale-95"
        >
          📄 Mentés PDF-be (Ctrl+P)
        </button>
      </div>

      <article className="mx-auto max-w-4xl px-6 py-10 print:py-4 print:px-2 print:max-w-none">
        <h1 className="mb-2 text-4xl font-bold text-foreground">DC / Marvel Képregény Ajánló – Technikai Dokumentáció</h1>
        <p className="mb-8 text-sm text-muted-foreground">Generálva: {new Date().toLocaleDateString("hu-HU")} · v1.0</p>

        <hr className="my-6 border-border" />

        {/* 1. Áttekintés */}
        <section className="mb-10">
          <h2 className="mb-3 text-2xl font-bold text-foreground">1. Projekt áttekintés</h2>
          <p className="mb-2 leading-relaxed text-foreground/90">
            A <strong>DC / Marvel Képregény Ajánló</strong> egy interaktív webalkalmazás, amely személyre szabott képregény-ajánlásokat ad a felhasználók preferenciái alapján.
            A felhasználó egy 6 kérdésből álló kvízt tölt ki, majd az alkalmazás AI-alapú vagy Python-alapú ajánlórendszert használ az eredmények generálásához.
          </p>
          <h3 className="mt-4 mb-2 text-lg font-semibold text-foreground">Főbb funkciók</h3>
          <ul className="list-disc pl-6 space-y-1 text-foreground/90">
            <li>6 kérdéses interaktív kvíz (igen/nem válaszok)</li>
            <li>AI-alapú személyre szabott ajánlások (Gemini modellel)</li>
            <li>Fallback: böngészőben futó Python ajánlómotor (Pyodide)</li>
            <li>AI-generált képregény illusztrációk</li>
            <li>AI-generált spoilermentes ismertetők</li>
            <li>Szövegfelolvasás (Web Speech API)</li>
            <li>„Még több ilyet" – hasonló képregények keresése</li>
            <li>Sötét/világos téma váltás</li>
          </ul>
        </section>

        {/* 2. Tech stack */}
        <section className="mb-10">
          <h2 className="mb-3 text-2xl font-bold text-foreground">2. Technológiai stack</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-4 text-left font-semibold text-foreground">Réteg</th>
                  <th className="py-2 pr-4 text-left font-semibold text-foreground">Technológia</th>
                  <th className="py-2 text-left font-semibold text-foreground">Verzió / Megjegyzés</th>
                </tr>
              </thead>
              <tbody className="text-foreground/90">
                <tr className="border-b border-border/50"><td className="py-2 pr-4 font-medium">Frontend keretrendszer</td><td className="py-2 pr-4">React + TypeScript</td><td className="py-2">^18.3.1</td></tr>
                <tr className="border-b border-border/50"><td className="py-2 pr-4 font-medium">Build eszköz</td><td className="py-2 pr-4">Vite</td><td className="py-2">Gyors HMR, ES modulok</td></tr>
                <tr className="border-b border-border/50"><td className="py-2 pr-4 font-medium">Stílus</td><td className="py-2 pr-4">Tailwind CSS + shadcn/ui</td><td className="py-2">Szemantikus tokenek, dark mode</td></tr>
                <tr className="border-b border-border/50"><td className="py-2 pr-4 font-medium">Routing</td><td className="py-2 pr-4">React Router DOM</td><td className="py-2">^6.30.1</td></tr>
                <tr className="border-b border-border/50"><td className="py-2 pr-4 font-medium">Backend</td><td className="py-2 pr-4">Lovable Cloud (Edge Functions)</td><td className="py-2">Deno runtime, auto-deploy</td></tr>
                <tr className="border-b border-border/50"><td className="py-2 pr-4 font-medium">AI modell</td><td className="py-2 pr-4">Google Gemini (Lovable AI Gateway)</td><td className="py-2">gemini-3-flash-preview, gemini-2.5-flash-image</td></tr>
                <tr className="border-b border-border/50"><td className="py-2 pr-4 font-medium">Python runtime</td><td className="py-2 pr-4">Pyodide</td><td className="py-2">v0.24.1, böngészőben futó CPython</td></tr>
                <tr><td className="py-2 pr-4 font-medium">Állapotkezelés</td><td className="py-2 pr-4">React hooks + TanStack Query</td><td className="py-2">^5.83.0</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. Architektúra */}
        <section className="mb-10">
          <h2 className="mb-3 text-2xl font-bold text-foreground">3. Architektúra</h2>
          <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs leading-relaxed text-foreground font-mono">
{`┌──────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                      │
│                                                              │
│  ┌─────────┐   ┌────────────┐   ┌──────────────┐           │
│  │  Index   │──▶│ QuizWizard │──▶│ ResultsScreen│           │
│  │  (page)  │   │ (6 kérdés) │   │ (ajánlások)  │           │
│  └─────────┘   └──────┬─────┘   └──────┬───────┘           │
│                        │                 │                    │
│              ┌─────────▼─────────┐      │                    │
│              │  useRecommender   │      │                    │
│              │  (hook)           │      │                    │
│              └────┬────────┬─────┘      │                    │
│                   │        │            │                    │
│         ┌─────────▼──┐  ┌──▼────────┐   │                    │
│         │ AI (Edge   │  │ Pyodide   │   │                    │
│         │ Function)  │  │ (fallback)│   │                    │
│         └────────────┘  └───────────┘   │                    │
│                                         │                    │
│                    ┌────────────────────┘                    │
│                    ▼                                         │
│  ┌──────────────────────────────────────────────────┐       │
│  │              Edge Functions (Backend)              │       │
│  │                                                    │       │
│  │  • generate-recommendations  (AI ajánlások)       │       │
│  │  • generate-comic-image      (AI képgenerálás)    │       │
│  │  • generate-comic-summary    (AI ismertető)       │       │
│  │  • generate-more-like-this   (hasonló ajánlások)  │       │
│  └──────────────────────────────────────────────────┘       │
└──────────────────────────────────────────────────────────────┘`}
          </pre>
        </section>

        {/* 4. Fájlstruktúra */}
        <section className="mb-10">
          <h2 className="mb-3 text-2xl font-bold text-foreground">4. Fájlstruktúra</h2>
          <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs leading-relaxed text-foreground font-mono">
{`src/
├── pages/
│   ├── Index.tsx              # Főoldal: header, kvíz, footer
│   ├── Documentation.tsx      # Technikai dokumentáció
│   └── NotFound.tsx           # 404 oldal
├── components/
│   ├── QuizWizard.tsx         # Kvíz állapotgép és logika
│   ├── QuestionCard.tsx       # Egyedi kérdéskártya UI
│   ├── ProgressBar.tsx        # Kvíz előrehaladás jelző
│   ├── ResultsScreen.tsx      # Ajánlások megjelenítése + modal
│   ├── LoadingScreen.tsx      # Pyodide betöltés képernyő
│   ├── ThemeToggle.tsx        # Dark/light mode váltó
│   └── ui/                    # shadcn/ui komponensek
├── hooks/
│   ├── usePyodide.ts          # Pyodide betöltés és futtatás
│   ├── useRecommender.ts      # Ajánlási logika (AI + fallback)
│   └── use-toast.ts           # Toast értesítések
├── data/
│   └── questions.json         # 6 kvízkérdés konfigurációja
├── integrations/supabase/
│   ├── client.ts              # Supabase kliens (auto-generált)
│   └── types.ts               # DB típusok (auto-generált)
└── index.css                  # Globális stílusok, design tokenek

public/engine/
├── recommender.py             # Python ajánló algoritmus
└── comic_database.json        # Képregény adatbázis

supabase/functions/
├── generate-recommendations/  # AI ajánlás edge function
├── generate-comic-image/      # Képgenerálás edge function
├── generate-comic-summary/    # Ismertető generálás
└── generate-more-like-this/   # Hasonló ajánlások`}
          </pre>
        </section>

        {/* 5. Adatfolyam */}
        <section className="mb-10">
          <h2 className="mb-3 text-2xl font-bold text-foreground">5. Adatfolyam és felhasználói út</h2>
          <ol className="list-decimal pl-6 space-y-2 text-foreground/90">
            <li><strong>Alkalmazás betöltése:</strong> A Pyodide runtime betöltődik a CDN-ről (~5MB). Amíg tölt, a <code className="rounded bg-muted px-1 text-xs">LoadingScreen</code> jelenik meg.</li>
            <li><strong>Kvíz:</strong> A felhasználó 6 igen/nem kérdésre válaszol. A kérdések a <code className="rounded bg-muted px-1 text-xs">questions.json</code> fájlból jönnek. A válaszok <code className="rounded bg-muted px-1 text-xs">Record&lt;string, boolean&gt;</code> formában tárolódnak.</li>
            <li><strong>Ajánlás generálása:</strong>
              <ul className="mt-1 list-disc pl-6 space-y-1">
                <li><strong>Elsődleges:</strong> <code className="rounded bg-muted px-1 text-xs">generate-recommendations</code> Edge Function → Gemini AI</li>
                <li><strong>Fallback:</strong> Pyodide → <code className="rounded bg-muted px-1 text-xs">recommender.py</code> + <code className="rounded bg-muted px-1 text-xs">comic_database.json</code></li>
              </ul>
            </li>
            <li><strong>Eredmények:</strong> 5 képregény kártya jelenik meg. Kattintásra modal nyílik: AI-generált kép, ismertető, TTS felolvasás.</li>
            <li><strong>„Még több ilyet":</strong> Egy ajánlás mellett a gomb meghívja a <code className="rounded bg-muted px-1 text-xs">generate-more-like-this</code> Edge Function-t, ami 3 hasonló képregényt ad vissza.</li>
          </ol>
        </section>

        {/* 6. Kvízkérdések */}
        <section className="mb-10">
          <h2 className="mb-3 text-2xl font-bold text-foreground">6. Kvízkérdések</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-4 text-left font-semibold text-foreground">ID</th>
                  <th className="py-2 pr-4 text-left font-semibold text-foreground">Ikon</th>
                  <th className="py-2 text-left font-semibold text-foreground">Kérdés</th>
                </tr>
              </thead>
              <tbody className="text-foreground/90">
                <tr className="border-b border-border/50"><td className="py-2 pr-4 font-mono text-xs">dc</td><td className="py-2 pr-4">🦇</td><td className="py-2">Érdekelnek a DC képregények?</td></tr>
                <tr className="border-b border-border/50"><td className="py-2 pr-4 font-mono text-xs">marvel</td><td className="py-2 pr-4">🕷️</td><td className="py-2">Érdekelnek a Marvel képregények?</td></tr>
                <tr className="border-b border-border/50"><td className="py-2 pr-4 font-mono text-xs">short</td><td className="py-2 pr-4">📖</td><td className="py-2">Rövidebb köteteket preferálsz (max ~200 oldal)?</td></tr>
                <tr className="border-b border-border/50"><td className="py-2 pr-4 font-mono text-xs">budget</td><td className="py-2 pr-4">💰</td><td className="py-2">Fontos az ár-érték arány?</td></tr>
                <tr className="border-b border-border/50"><td className="py-2 pr-4 font-mono text-xs">modern</td><td className="py-2 pr-4">🆕</td><td className="py-2">Inkább modern (2000 utáni) képregényeket keresel?</td></tr>
                <tr><td className="py-2 pr-4 font-mono text-xs">top_rated</td><td className="py-2 pr-4">⭐</td><td className="py-2">Csak a legjobban értékelt címek (4.7+ rating)?</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 7. Edge Functions */}
        <section className="mb-10">
          <h2 className="mb-3 text-2xl font-bold text-foreground">7. Backend Edge Functions</h2>

          <div className="space-y-6">
            <div className="rounded-lg border border-border p-4">
              <h3 className="mb-2 text-lg font-semibold text-foreground">7.1 generate-recommendations</h3>
              <p className="mb-2 text-sm text-foreground/90">Az AI-alapú ajánlómotor. A kvíz válaszokat fogadja, és 5 személyre szabott képregényt ad vissza.</p>
              <ul className="list-disc pl-6 text-sm text-foreground/80 space-y-1">
                <li><strong>Input:</strong> <code className="rounded bg-muted px-1 text-xs">{`{ answers: Record<string, boolean>, questions: Question[] }`}</code></li>
                <li><strong>Output:</strong> <code className="rounded bg-muted px-1 text-xs">{`{ title, recommendations[], reasoning }`}</code></li>
                <li><strong>Modell:</strong> google/gemini-3-flash-preview</li>
                <li><strong>Hiba kezelés:</strong> 429 (rate limit), 402 (fizetés szükséges), 500 (általános)</li>
              </ul>
            </div>

            <div className="rounded-lg border border-border p-4">
              <h3 className="mb-2 text-lg font-semibold text-foreground">7.2 generate-comic-image</h3>
              <p className="mb-2 text-sm text-foreground/90">Képregény témájú illusztrációt generál AI segítségével. Szerzői jogi okokból eredeti karaktereket hoz létre.</p>
              <ul className="list-disc pl-6 text-sm text-foreground/80 space-y-1">
                <li><strong>Input:</strong> <code className="rounded bg-muted px-1 text-xs">{`{ title, summary }`}</code></li>
                <li><strong>Output:</strong> <code className="rounded bg-muted px-1 text-xs">{`{ imageUrl: string | null }`}</code></li>
                <li><strong>Modellek:</strong> gemini-2.5-flash-image → gemini-3-pro-image-preview (fallback)</li>
                <li><strong>Különlegesség:</strong> Graceful degradation – ha nem sikerül, <code className="rounded bg-muted px-1 text-xs">imageUrl: null</code></li>
              </ul>
            </div>

            <div className="rounded-lg border border-border p-4">
              <h3 className="mb-2 text-lg font-semibold text-foreground">7.3 generate-comic-summary</h3>
              <p className="mb-2 text-sm text-foreground/90">Spoilermentes, 3-5 mondatos ismertetőt generál magyarul egy adott képregényről.</p>
              <ul className="list-disc pl-6 text-sm text-foreground/80 space-y-1">
                <li><strong>Input:</strong> <code className="rounded bg-muted px-1 text-xs">{`{ title, description, why }`}</code></li>
                <li><strong>Output:</strong> <code className="rounded bg-muted px-1 text-xs">{`{ summary: string }`}</code></li>
                <li><strong>Modell:</strong> google/gemini-3-flash-preview</li>
              </ul>
            </div>

            <div className="rounded-lg border border-border p-4">
              <h3 className="mb-2 text-lg font-semibold text-foreground">7.4 generate-more-like-this</h3>
              <p className="mb-2 text-sm text-foreground/90">Egy adott képregényhez 3 hasonló stílusú/tematikájú képregényt keres AI segítségével.</p>
              <ul className="list-disc pl-6 text-sm text-foreground/80 space-y-1">
                <li><strong>Input:</strong> <code className="rounded bg-muted px-1 text-xs">{`{ title, description }`}</code></li>
                <li><strong>Output:</strong> <code className="rounded bg-muted px-1 text-xs">{`{ recommendations[] }`}</code></li>
                <li><strong>Modell:</strong> google/gemini-3-flash-preview</li>
              </ul>
            </div>

            <div className="rounded-lg border border-border p-4">
              <h3 className="mb-2 text-lg font-semibold text-foreground">7.5 elevenlabs-tts</h3>
              <p className="mb-2 text-sm text-foreground/90">Szöveg-hang konverzió az ElevenLabs API-n keresztül (többnyelvű v2 modell).</p>
              <ul className="list-disc pl-6 text-sm text-foreground/80 space-y-1">
                <li><strong>Input:</strong> <code className="rounded bg-muted px-1 text-xs">{`{ text, voiceId? }`}</code></li>
                <li><strong>Output:</strong> audio/mpeg bináris</li>
                <li><strong>Szükséges secret:</strong> ELEVENLABS_API_KEY</li>
                <li><strong>Megjegyzés:</strong> Jelenleg a frontend a Web Speech API-t használja, ez a function tartalék</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 8. Python fallback */}
        <section className="mb-10">
          <h2 className="mb-3 text-2xl font-bold text-foreground">8. Pyodide fallback rendszer</h2>
          <p className="mb-3 text-foreground/90">
            Ha az AI Edge Function nem elérhető (hálózati hiba, rate limit), az alkalmazás automatikusan átvált a böngészőben futó Python ajánlóra.
          </p>
          <h3 className="mt-4 mb-2 text-lg font-semibold text-foreground">Pyodide betöltési folyamat</h3>
          <ol className="list-decimal pl-6 space-y-1 text-sm text-foreground/90">
            <li>CDN script betöltése: <code className="rounded bg-muted px-1 text-xs">cdn.jsdelivr.net/pyodide/v0.24.1/full/</code></li>
            <li><code className="rounded bg-muted px-1 text-xs">loadPyodide()</code> inicializálja a WebAssembly Python runtime-ot</li>
            <li>A <code className="rounded bg-muted px-1 text-xs">recommender.py</code> script betöltődik a <code className="rounded bg-muted px-1 text-xs">/engine/</code> mappából</li>
            <li>A <code className="rounded bg-muted px-1 text-xs">comic_database.json</code> adatfájl betöltődik</li>
          </ol>
          <h3 className="mt-4 mb-2 text-lg font-semibold text-foreground">Python ajánló algoritmus</h3>
          <ol className="list-decimal pl-6 space-y-1 text-sm text-foreground/90">
            <li><strong>Szűrés kiadó szerint:</strong> DC, Marvel, vagy mindkettő</li>
            <li><strong>Preferencia szűrők:</strong> rövid (≤200 oldal), olcsó ({"<"}50 Ft/oldal), modern (2000+), top rated (4.7+)</li>
            <li><strong>Rangsorolás:</strong> Értékelés (csökkenő) → Ár/oldal (növekvő) → Év (csökkenő)</li>
            <li><strong>Gazdagítás:</strong> Ár/oldal és ROI proxy számítás</li>
            <li><strong>Top 8</strong> eredmény visszaadása</li>
          </ol>
        </section>

        {/* 9. Komponensek */}
        <section className="mb-10">
          <h2 className="mb-3 text-2xl font-bold text-foreground">9. Főbb React komponensek</h2>

          <div className="space-y-4">
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-semibold text-foreground">Index (page)</h3>
              <p className="text-sm text-foreground/80">Főoldal. Betölti a Pyodide runtime-ot, mutatja a headert, QuizWizard-ot és footert. Dark/light mode váltó a headerben.</p>
            </div>

            <div className="rounded-lg border border-border p-4">
              <h3 className="font-semibold text-foreground">QuizWizard</h3>
              <p className="text-sm text-foreground/80">
                Állapotgép a kvízhez. Kezeli a <code className="rounded bg-muted px-1 text-xs">currentIndex</code>, <code className="rounded bg-muted px-1 text-xs">answers</code> állapotokat.
                Ha az utolsó kérdésre is válaszol a user, meghívja a <code className="rounded bg-muted px-1 text-xs">getRecommendations()</code>-t.
                Három állapot: kvíz → töltés → eredmények/hiba.
              </p>
            </div>

            <div className="rounded-lg border border-border p-4">
              <h3 className="font-semibold text-foreground">ResultsScreen</h3>
              <p className="text-sm text-foreground/80">
                Az ajánlások megjelenítése. Funkciók: kártya kattintás → részletes modal (AI kép, ismertető, TTS), „Még több ilyet" gomb,
                „Miért ezeket ajánljuk?" szekció az eredeti válaszokkal, újrakezdés gomb.
                Az AI asseteket (kép, összegzés) lazy módon, kattintáskor generálja.
              </p>
            </div>

            <div className="rounded-lg border border-border p-4">
              <h3 className="font-semibold text-foreground">useRecommender (hook)</h3>
              <p className="text-sm text-foreground/80">
                Központi ajánlási logika. Először az AI Edge Function-t próbálja, sikertelenség esetén Pyodide fallbackre vált.
                Visszaadja: <code className="rounded bg-muted px-1 text-xs">result</code>, <code className="rounded bg-muted px-1 text-xs">recommending</code>, <code className="rounded bg-muted px-1 text-xs">error</code>, <code className="rounded bg-muted px-1 text-xs">reset()</code>.
              </p>
            </div>
          </div>
        </section>

        {/* 10. Design rendszer */}
        <section className="mb-10">
          <h2 className="mb-3 text-2xl font-bold text-foreground">10. Design rendszer</h2>
          <ul className="list-disc pl-6 space-y-1 text-sm text-foreground/90">
            <li><strong>Betűtípusok:</strong> Playfair Display (címek), Source Sans 3 (szövegtörzs)</li>
            <li><strong>Szín tokenek:</strong> HSL-alapú szemantikus CSS változók (<code className="rounded bg-muted px-1 text-xs">--background</code>, <code className="rounded bg-muted px-1 text-xs">--foreground</code>, <code className="rounded bg-muted px-1 text-xs">--primary</code>, <code className="rounded bg-muted px-1 text-xs">--accent</code>, stb.)</li>
            <li><strong>Téma:</strong> Light és dark mode, <code className="rounded bg-muted px-1 text-xs">.dark</code> class a root elemen</li>
            <li><strong>Egyedi stílusok:</strong> <code className="rounded bg-muted px-1 text-xs">.comic-panel</code> és <code className="rounded bg-muted px-1 text-xs">.comic-panel-sm</code> – képregény stílusú kártyák szegéllyel és árnyékkal</li>
            <li><strong>Animációk:</strong> CSS-alapú <code className="rounded bg-muted px-1 text-xs">animate-slide-in</code>, <code className="rounded bg-muted px-1 text-xs">animate-fade-in</code></li>
          </ul>
        </section>

        {/* 11. Titkos kulcsok */}
        <section className="mb-10">
          <h2 className="mb-3 text-2xl font-bold text-foreground">11. Környezeti változók és titkos kulcsok</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-4 text-left font-semibold text-foreground">Változó</th>
                  <th className="py-2 pr-4 text-left font-semibold text-foreground">Típus</th>
                  <th className="py-2 text-left font-semibold text-foreground">Leírás</th>
                </tr>
              </thead>
              <tbody className="text-foreground/90">
                <tr className="border-b border-border/50"><td className="py-2 pr-4 font-mono text-xs">VITE_SUPABASE_URL</td><td className="py-2 pr-4">Publikus</td><td className="py-2">Backend API URL</td></tr>
                <tr className="border-b border-border/50"><td className="py-2 pr-4 font-mono text-xs">VITE_SUPABASE_PUBLISHABLE_KEY</td><td className="py-2 pr-4">Publikus</td><td className="py-2">Anon/publishable API kulcs</td></tr>
                <tr className="border-b border-border/50"><td className="py-2 pr-4 font-mono text-xs">LOVABLE_API_KEY</td><td className="py-2 pr-4">Secret (backend)</td><td className="py-2">AI Gateway hozzáférés (Edge Functions-ben)</td></tr>
                <tr><td className="py-2 pr-4 font-mono text-xs">ELEVENLABS_API_KEY</td><td className="py-2 pr-4">Secret (backend)</td><td className="py-2">ElevenLabs TTS API (opcionális)</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 12. Hibakezelés */}
        <section className="mb-10">
          <h2 className="mb-3 text-2xl font-bold text-foreground">12. Hibakezelés és resilience</h2>
          <ul className="list-disc pl-6 space-y-1 text-sm text-foreground/90">
            <li><strong>AI → Pyodide fallback:</strong> Ha az AI Edge Function hibát dob, automatikusan a böngészőbeli Python motorra vált</li>
            <li><strong>Képgenerálás multi-model fallback:</strong> Két különböző Gemini modellt próbál, majd graceful null-t ad vissza</li>
            <li><strong>Rate limiting:</strong> 429-es válasz esetén felhasználó-barát hibaüzenet</li>
            <li><strong>Edge Function retry:</strong> A képgenerálás max 2 próbálkozást tesz a frontend oldalon</li>
            <li><strong>TTS fallback:</strong> Web Speech API-t használ (böngésző natív), nem függ külső szolgáltatástól</li>
          </ul>
        </section>

        {/* 13. Fejlesztési útmutató */}
        <section className="mb-10">
          <h2 className="mb-3 text-2xl font-bold text-foreground">13. Fejlesztési útmutató</h2>
          <h3 className="mt-4 mb-2 text-lg font-semibold text-foreground">Új kérdés hozzáadása</h3>
          <ol className="list-decimal pl-6 space-y-1 text-sm text-foreground/90">
            <li>Adj hozzá egy új objektumot a <code className="rounded bg-muted px-1 text-xs">src/data/questions.json</code> fájlhoz</li>
            <li>Frissítsd a <code className="rounded bg-muted px-1 text-xs">generate-recommendations</code> Edge Function promptját, hogy kezelje az új preferenciát</li>
            <li>Opcionálisan frissítsd a <code className="rounded bg-muted px-1 text-xs">recommender.py</code> Pyodide fallback-et is</li>
          </ol>

          <h3 className="mt-4 mb-2 text-lg font-semibold text-foreground">Képregény adatbázis bővítése</h3>
          <p className="text-sm text-foreground/90">Szerkeszd a <code className="rounded bg-muted px-1 text-xs">public/engine/comic_database.json</code> fájlt. Minden bejegyzésnek tartalmaznia kell: title, publisher, year, pages, price_huf, rating, characters[], summary.</p>

          <h3 className="mt-4 mb-2 text-lg font-semibold text-foreground">Új Edge Function hozzáadása</h3>
          <ol className="list-decimal pl-6 space-y-1 text-sm text-foreground/90">
            <li>Hozz létre egy új mappát: <code className="rounded bg-muted px-1 text-xs">supabase/functions/&lt;function-name&gt;/index.ts</code></li>
            <li>Használd a standard CORS headereket és error handling mintákat</li>
            <li>Az Edge Function automatikusan deploy-olódik</li>
          </ol>
        </section>

        {/* Prompt Napló */}
        <section className="mb-10">
          <h2 className="mb-3 text-2xl font-bold text-foreground">📓 Prompt Napló – Fejlesztési mérföldkövek</h2>
          <p className="mb-4 leading-relaxed text-foreground/90">
            Az alábbi napló az alkalmazás fejlesztésének legfontosabb lépéseit dokumentálja időrendi sorrendben,
            a felhasználó (prompt szerző) és az AI (Lovable) közötti együttműködés alapján.
          </p>

          <div className="space-y-6">
            {/* Mérföldkő 1 */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block rounded-full bg-primary/20 px-3 py-0.5 text-xs font-bold text-primary">1. fázis</span>
                <span className="text-xs text-muted-foreground">Alapok</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">🧱 Alap kvíz rendszer felépítése</h3>
              <p className="text-sm text-foreground/80 mb-2">
                <strong>Prompt lényege:</strong> „Készíts egy képregény ajánló kvízt, ahol a felhasználó 6 igen/nem kérdésre válaszol."
              </p>
              <ul className="list-disc pl-5 text-sm text-foreground/70 space-y-1">
                <li>6 kérdéses kvíz komponens létrehozása (<code className="rounded bg-muted px-1 text-xs">QuizWizard</code>, <code className="rounded bg-muted px-1 text-xs">QuestionCard</code>)</li>
                <li>Kérdések JSON fájlból betöltve (<code className="rounded bg-muted px-1 text-xs">questions.json</code>)</li>
                <li>Progress bar, animált kártya-váltás</li>
                <li>Alapvető UI: sötét téma, képregény-stílusú design</li>
              </ul>
            </div>

            {/* Mérföldkő 2 */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block rounded-full bg-primary/20 px-3 py-0.5 text-xs font-bold text-primary">2. fázis</span>
                <span className="text-xs text-muted-foreground">Backend logika</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">🐍 Pyodide Python ajánlómotor</h3>
              <p className="text-sm text-foreground/80 mb-2">
                <strong>Prompt lényege:</strong> „A kvíz válaszai alapján egy Python-alapú ajánlórendszer válasszon képregényeket egy adatbázisból."
              </p>
              <ul className="list-disc pl-5 text-sm text-foreground/70 space-y-1">
                <li>Pyodide integráció – Python futtatás közvetlenül a böngészőben</li>
                <li><code className="rounded bg-muted px-1 text-xs">recommender.py</code> megírása: súlyozás, szűrés, pontozás a válaszok alapján</li>
                <li><code className="rounded bg-muted px-1 text-xs">comic_database.json</code> létrehozása 50+ képregénnyel (DC + Marvel)</li>
                <li>Betöltési képernyő amíg a Python motor inicializálódik</li>
              </ul>
            </div>

            {/* Mérföldkő 3 */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block rounded-full bg-primary/20 px-3 py-0.5 text-xs font-bold text-primary">3. fázis</span>
                <span className="text-xs text-muted-foreground">AI integráció</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">🤖 AI-alapú ajánlások (Gemini)</h3>
              <p className="text-sm text-foreground/80 mb-2">
                <strong>Prompt lényege:</strong> „Használj AI-t az ajánlások generálásához, a Python motor legyen fallback."
              </p>
              <ul className="list-disc pl-5 text-sm text-foreground/70 space-y-1">
                <li><code className="rounded bg-muted px-1 text-xs">generate-recommendations</code> Edge Function létrehozása</li>
                <li>Gemini modell használata strukturált JSON válaszokkal</li>
                <li>Pyodide automatikus fallback, ha az AI nem elérhető</li>
                <li>Hibakezelés és retry logika</li>
              </ul>
            </div>

            {/* Mérföldkő 4 */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block rounded-full bg-primary/20 px-3 py-0.5 text-xs font-bold text-primary">4. fázis</span>
                <span className="text-xs text-muted-foreground">Vizuális tartalom</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">🎨 AI képgenerálás</h3>
              <p className="text-sm text-foreground/80 mb-2">
                <strong>Prompt lényege:</strong> „Generálj egyedi illusztrációkat minden ajánlott képregényhez."
              </p>
              <ul className="list-disc pl-5 text-sm text-foreground/70 space-y-1">
                <li><code className="rounded bg-muted px-1 text-xs">generate-comic-image</code> Edge Function</li>
                <li>Copyright-safe prompt generálás (nem másolja az eredeti borítókat)</li>
                <li>Multi-model fallback stratégia</li>
                <li>Base64 kép megjelenítés a kártyákon</li>
              </ul>
            </div>

            {/* Mérföldkő 5 */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block rounded-full bg-primary/20 px-3 py-0.5 text-xs font-bold text-primary">5. fázis</span>
                <span className="text-xs text-muted-foreground">Tartalom & hang</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">📝 AI ismertetők és szövegfelolvasás</h3>
              <p className="text-sm text-foreground/80 mb-2">
                <strong>Prompt lényege:</strong> „Írj spoilermentes ismertetőt és add hozzá a felolvasás lehetőségét."
              </p>
              <ul className="list-disc pl-5 text-sm text-foreground/70 space-y-1">
                <li><code className="rounded bg-muted px-1 text-xs">generate-comic-summary</code> Edge Function</li>
                <li>Spoilermentes, magyar nyelvű ismertetők generálása</li>
                <li>Web Speech API integráció szövegfelolvasáshoz</li>
                <li>Betöltési állapotok és skeleton UI</li>
              </ul>
            </div>

            {/* Mérföldkő 6 */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block rounded-full bg-primary/20 px-3 py-0.5 text-xs font-bold text-primary">6. fázis</span>
                <span className="text-xs text-muted-foreground">Felfedezés</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">🔍 „Még több ilyet" funkció</h3>
              <p className="text-sm text-foreground/80 mb-2">
                <strong>Prompt lényege:</strong> „Ha egy képregény tetszik, ajánlj hasonlóakat is."
              </p>
              <ul className="list-disc pl-5 text-sm text-foreground/70 space-y-1">
                <li><code className="rounded bg-muted px-1 text-xs">generate-more-like-this</code> Edge Function</li>
                <li>Hasonló képregények kártyái kattinthatóak – modal megnyílik képpel és ismertetővel</li>
                <li>Láncszerű böngészés: hasonlóból tovább lehet navigálni</li>
              </ul>
            </div>

            {/* Mérföldkő 7 */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block rounded-full bg-primary/20 px-3 py-0.5 text-xs font-bold text-primary">7. fázis</span>
                <span className="text-xs text-muted-foreground">UI/UX finomítás</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">🌙 Dark mode és design javítások</h3>
              <p className="text-sm text-foreground/80 mb-2">
                <strong>Prompt lényege:</strong> „A sötét módban nem jól látszanak a szövegek, javítsd a kontrasztot."
              </p>
              <ul className="list-disc pl-5 text-sm text-foreground/70 space-y-1">
                <li>Szöveg kontraszt javítása dark mode-ban</li>
                <li>Semantic design tokenek következetes használata</li>
                <li>Kártyák, gombok, modal stílusok finomhangolása</li>
              </ul>
            </div>

            {/* Mérföldkő 8 */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block rounded-full bg-primary/20 px-3 py-0.5 text-xs font-bold text-primary">8. fázis</span>
                <span className="text-xs text-muted-foreground">Dokumentáció</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">📄 Technikai dokumentáció és prompt napló</h3>
              <p className="text-sm text-foreground/80 mb-2">
                <strong>Prompt lényege:</strong> „Generálj teljeskörű technikai dokumentációt PDF-be menthető formában, és adj hozzá prompt naplót."
              </p>
              <ul className="list-disc pl-5 text-sm text-foreground/70 space-y-1">
                <li><code className="rounded bg-muted px-1 text-xs">/docs</code> oldal létrehozása nyomtatható CSS-sel</li>
                <li>Architektúra, adatfolyam, komponensek, Edge Function-ök dokumentálása</li>
                <li>Fejlesztési mérföldkövek prompt napló formájában</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Footer */}
        <hr className="my-6 border-border" />
        <p className="text-center text-xs text-muted-foreground">
          DC / Marvel Képregény Ajánló · Technikai Dokumentáció · {new Date().getFullYear()}
        </p>
      </article>
    </div>
  );
};

export default Documentation;
