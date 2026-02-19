import { useState, useEffect, useCallback, useRef } from "react";

declare global {
  interface Window {
    loadPyodide: (config?: { indexURL?: string }) => Promise<any>;
  }
}

interface PyodideState {
  pyodide: any | null;
  loading: boolean;
  error: string | null;
  runPython: (code: string) => Promise<any>;
}

const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/";

export function usePyodide(): PyodideState {
  const [pyodide, setPyodide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const loadScript = () =>
      new Promise<void>((resolve, reject) => {
        if (window.loadPyodide) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = `${PYODIDE_CDN}pyodide.js`;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Pyodide script"));
        document.head.appendChild(script);
      });

    const init = async () => {
      try {
        await loadScript();
        const py = await window.loadPyodide({ indexURL: PYODIDE_CDN });
        setPyodide(py);
      } catch (err: any) {
        setError(err.message || "Failed to initialize Python runtime");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const runPython = useCallback(
    async (code: string) => {
      if (!pyodide) throw new Error("Pyodide not loaded");
      return pyodide.runPython(code);
    },
    [pyodide]
  );

  return { pyodide, loading, error, runPython };
}
