"use client";

import { useEffect } from "react";
import { getSupabaseClient } from "../../lib/supabase";

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

    const loadScripts = () => {
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
    };

    const supabase = getSupabaseClient();
    if (!supabase) {
      loadScripts();
      return;
    }

    window.JKL_SUPABASE = supabase;
    supabase.auth.onAuthStateChange((_event, session) => {
      window.JKL_AUTH_TOKEN = session?.access_token || null;
      window.JKL_AUTH_USER = session?.user || null;
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) throw error;
      window.JKL_AUTH_TOKEN = data.session?.access_token || null;
      window.JKL_AUTH_USER = data.session?.user || null;
    }).catch((error) => {
      console.error("[jomworklah] Could not restore the Supabase session:", error);
    }).finally(loadScripts);
  }, []);

  return null;
}
