"use client";

import { useState, type MouseEvent } from "react";
import { Share2 } from "lucide-react";
import Link from "next/link";

type ParentShareButtonProps = {
  href: string;
  studentName: string;
};

export function ParentShareButton({
  href,
  studentName
}: ParentShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }

    const shareUrl = new URL(href, window.location.origin).toString();

    try {
      if (navigator.share) {
        event.preventDefault();
        await navigator.share({
          text: `Laporan belajar ${studentName}`,
          title: `Laporan ${studentName}`,
          url: shareUrl
        });
        return;
      }

      if (navigator.clipboard) {
        event.preventDefault();
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      setCopied(false);
    }
  }

  return (
    <Link className="share-parent-button" href={href} onClick={handleClick}>
      <Share2 aria-hidden="true" size={18} />
      {copied ? "Link Disalin" : "Bagikan ke Orang Tua"}
    </Link>
  );
}
