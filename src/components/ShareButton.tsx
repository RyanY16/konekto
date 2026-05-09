import { useState } from "react";
import { Share2, Copy, Check, QrCode, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const isMobile = () =>
  typeof navigator !== "undefined" && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const url = typeof window !== "undefined" ? window.location.href : "";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;

  async function handleShare() {
    if (isMobile() && navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled or share failed — silently ignore
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <>
      <button
        onClick={handleShare}
        className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2.5 py-1 inline-flex items-center gap-1.5"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Share2 className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Share"}
      </button>

      <button
        onClick={() => setQrOpen(true)}
        className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2.5 py-1 inline-flex items-center gap-1.5"
      >
        <QrCode className="h-3.5 w-3.5" />
        QR
      </button>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-xs" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>"{title}"</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-xl border border-border p-3 bg-white">
              <img src={qrUrl} alt="QR code" width={160} height={160} className="block" />
            </div>
            <p className="text-xs text-muted-foreground">Scan to open on mobile</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
