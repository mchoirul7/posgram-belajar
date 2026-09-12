/**
 * Default WhatsApp message that goes with a parent report link.
 *
 * A bare URL tells a parent nothing about why they were sent it, so the message
 * names the child, names the exam, and says what is expected at home.
 */
export function buildParentShareMessage({
  studentName,
  assessmentName,
  shareUrl
}: {
  studentName: string;
  assessmentName?: string;
  shareUrl: string;
}): string {
  const exam = assessmentName?.trim() || "ujian diagnostik";

  return [
    `Halo Ayah/Bunda, Ananda ${studentName} telah mengikuti ${exam} dan perlu penguatan pembelajaran di rumah.`,
    "",
    "Silakan selesaikan roadmap pembelajaran berikut secara mandiri di rumah:",
    shareUrl
  ].join("\n");
}
