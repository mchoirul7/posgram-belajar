"use client";

import { useState, type MouseEvent } from "react";
import { Share2 } from "lucide-react";
import Link from "next/link";
import { buildParentShareMessage } from "@/lib/students/share-message";

type ParentShareButtonProps = {
  className?: string;
  /** Shown when idle. The roadmap tab reuses this button as "Buat Roadmap". */
  label?: string;
  href: string;
  studentName: string;
  assessmentName?: string;
};

/**
 * Hands the parent report link to a parent over WhatsApp.
 *
 * The anchor keeps the plain report URL so ctrl-click, middle-click and a
 * JS-less browser still work; a normal click instead opens WhatsApp with the
 * message already written, since a bare link on its own tells a parent nothing
 * about why they are being sent it.
 */
export function ParentShareButton({
  className = "share-parent-button",
  label = "Bagikan ke Orang Tua",
  href,
  studentName,
  assessmentName
}: ParentShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }

    event.preventDefault();

    const shareUrl = new URL(href, window.location.origin).toString();
    const message = buildParentShareMessage({
      studentName,
      assessmentName,
      shareUrl
    });
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

    if (window.open(whatsappUrl, "_blank", "noopener")) {
      return;
    }

    // Popup blocked: put the whole message on the clipboard instead of
    // silently doing nothing.
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = whatsappUrl;
    }
  }

  return (
    <Link className={className} href={href} onClick={handleClick}>
      <Share2 aria-hidden="true" size={18} />
      {copied ? "Pesan Disalin" : label}
    </Link>
  );
}
