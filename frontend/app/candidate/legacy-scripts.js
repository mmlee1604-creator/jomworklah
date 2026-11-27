"use client";

import { useEffect } from "react";

/* The demo is a plain ES5-era script bundle: mock data, atlas data, the atlas
   component, then the SPA shell. They must run in this order and after the
   skeleton markup exists, so they are injected one at a time. */
const SOURCES = [
  "/js/config.js",
  "/js/api.js",
  "/js/mock-data.js",
  "/js/skills-atlas-data.js",
  "/js/skills-atlas.js",
  "/js/app.js",
];

export default function LegacyScripts() {
  useEffect(() => {
    if (window.__jomworklahBooted) return;
    window.__jomworklahBooted = true;

    let index = 0;
    const loadNext = () => {
      if (index >= SOURCES.length) return;
      const script = document.createElement("script");
      script.src = SOURCES[index];
      index += 1;
      script.onload = loadNext;
      script.onerror = () => {
        console.error(`[jomworklah] Failed to load ${script.src}`);
      };
      document.body.appendChild(script);
    };

    loadNext();
  }, []);

  return null;
}
