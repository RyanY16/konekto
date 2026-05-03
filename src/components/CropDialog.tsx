import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";

const DISPLAY = 280;
const OUTPUT = 400;

interface Props {
  file: File;
  onCrop: (cropped: File) => void;
  onCancel: () => void;
}

export function CropDialog({ file, onCrop, onCancel }: Props) {
  const [src] = useState(() => URL.createObjectURL(file));
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => () => URL.revokeObjectURL(src), [src]);

  // Mouse drag
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drag.current) return;
    setOffset({ x: drag.current.ox + e.clientX - drag.current.x, y: drag.current.oy + e.clientY - drag.current.y });
  }, []);
  const onMouseUp = () => { drag.current = null; };

  // Touch drag
  const touchRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY, ox: offset.x, oy: offset.y };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    e.preventDefault();
    const t = e.touches[0];
    setOffset({ x: touchRef.current.ox + t.clientX - touchRef.current.x, y: touchRef.current.oy + t.clientY - touchRef.current.y });
  };

  // Scroll to zoom
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => Math.min(5, Math.max(0.5, s - e.deltaY * 0.002)));
  };

  function crop() {
    const img = imgRef.current;
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext("2d")!;

    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    const baseScale = Math.max(DISPLAY / nw, DISPLAY / nh);
    const total = baseScale * scale;

    const imgX = DISPLAY / 2 - (nw * total) / 2 + offset.x;
    const imgY = DISPLAY / 2 - (nh * total) / 2 + offset.y;

    const srcX = (0 - imgX) / total;
    const srcY = (0 - imgY) / total;
    const srcW = DISPLAY / total;
    const srcH = DISPLAY / total;

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, OUTPUT, OUTPUT);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCrop(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/70 p-4 pt-12 overflow-y-auto">
      <div className="bg-background rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">
        <div>
          <h3 className="font-semibold text-lg">Crop photo</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Drag to reposition · Scroll or slider to zoom</p>
        </div>

        {/* Circular crop viewport */}
        <div
          className="relative mx-auto overflow-hidden rounded-full border-2 border-primary cursor-grab active:cursor-grabbing select-none"
          style={{ width: DISPLAY, height: DISPLAY }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={onWheel}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={() => { touchRef.current = null; }}
        >
          <img
            ref={imgRef}
            src={src}
            draggable={false}
            alt=""
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${scale})`,
              maxWidth: "none",
              userSelect: "none",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">–</span>
          <input
            type="range" min={0.5} max={5} step={0.01}
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className="text-xs text-muted-foreground">+</span>
        </div>

        <div className="flex gap-2 pt-1">
          <Button className="flex-1" onClick={crop}>Apply</Button>
          <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
