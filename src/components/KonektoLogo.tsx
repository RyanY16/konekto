"use client";

import { useEffect, useState } from "react";

type Scheme = "default" | "blue";

function readScheme(): Scheme {
  if (typeof window === "undefined") return "default";
  return document.documentElement.classList.contains("scheme-blue") ? "blue" : "default";
}

export function useColorScheme(): Scheme {
  const [scheme, setScheme] = useState<Scheme>(readScheme);

  useEffect(() => {
    const obs = new MutationObserver(() => setScheme(readScheme()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  return scheme;
}

type Props = {
  variant?: "icon" | "full";
  className?: string;
};

export function KonektoLogo({ variant = "icon", className }: Props) {
  const scheme = useColorScheme();

  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (link) {
      link.href = scheme === "blue" ? "/logo-icon-blue.png" : "/logo-icon-orange.png";
    }
  }, [scheme]);

  const src =
    variant === "full"
      ? scheme === "blue"
        ? "/logo-full-blue.png"
        : "/logo-full-orange.png"
      : scheme === "blue"
        ? "/logo-icon-blue.png"
        : "/logo-icon-orange.png";

  return <img src={src} alt="Konekto" className={className} />;
}
