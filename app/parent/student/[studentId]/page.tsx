import { notFound, redirect } from "next/navigation";
import { getParticipantDetail } from "@/lib/assessments/data";
import { getParentReportHref } from "@/lib/parent/share-token";

type LegacyParentPageProps = {
  params: Promise<{
    studentId: string;
  }>;
  searchParams?: Promise<{
    assessmentId?: string;
  }>;
};

/**
 * Back-compat for links shared before the report moved to a share token. The
 * old URL carried the student name, exam, and weak concepts as query strings;
 * all of that now comes from Supabase, so everything but the student (and an
 * optional assessment) is dropped on the way through.
 */
export default async function LegacyParentStudentPage({
  params,
  searchParams
}: LegacyParentPageProps) {
  const { studentId } = await params;
  const query = await searchParams;
  const participant = await getParticipantDetail(studentId, query?.assessmentId);

  if (!participant || !participant.shareToken || participant.shareRevokedAt) {
    notFound();
  }

  redirect(getParentReportHref(participant.shareToken));
}
