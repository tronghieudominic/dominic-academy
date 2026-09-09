import { useEffect } from "react";
import markup from "../legacy/markup.html?raw";

declare global {
  interface Window {
    startDominic?: () => void;
    bootstrapApp?: () => void;
    __DOMINIC_STARTED?: boolean;
  }
}

const SCRIPTS = [
  "https://cdn.jsdelivr.net/npm/hls.js@latest",
  "https://cdn.plyr.io/3.8.4/plyr.js",
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js",
  "/dominic-app.js",
];

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-dominic-src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "1") resolve();
      else existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }
    const el = document.createElement("script");
    el.src = src;
    el.async = false;
    el.dataset.dominicSrc = src;
    el.onload = () => {
      el.dataset.loaded = "1";
      resolve();
    };
    el.onerror = () => reject(new Error(`Không tải được ${src}`));
    document.body.appendChild(el);
  });
}

export function DominicApp() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        for (const src of SCRIPTS) {
          await loadScript(src);
          if (cancelled) return;
        }
        window.startDominic?.();
      } catch (err) {
        if (cancelled) return;
        const area = document.getElementById("content");
        if (area) {
          const message = err instanceof Error ? err.message : String(err);
          area.innerHTML = `<div class="err">Không khởi động được ứng dụng: ${message}</div>`;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return <div className="dominic-host" dangerouslySetInnerHTML={{ __html: markup }} />;
}
