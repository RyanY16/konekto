import { useEffect, useState } from "react";
import { fetchOgImage } from "@/lib/og-image";

export function useOgImage(websiteUrl: string | undefined): string | null {
  const [img, setImg] = useState<string | null>(null);

  useEffect(() => {
    if (!websiteUrl) return;
    let cancelled = false;
    fetchOgImage(websiteUrl).then((url) => {
      if (!cancelled) setImg(url);
    });
    return () => { cancelled = true; };
  }, [websiteUrl]);

  return img;
}
