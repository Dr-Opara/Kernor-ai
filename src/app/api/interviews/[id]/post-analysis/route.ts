import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generatePostInterviewAnalysis } from "@/lib/ai/post-interview";
import { generateRoundHandoff } from "@/lib/ai/round-handoff";

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;

  if (!userId) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  const service = createServiceClient();

  const { data: interview } = await service
    .from("interviews")
    .select("*,applications(*)")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!interview?.applications) {
    return NextResponse.json({ error: "Interview not found." }, { status: 404 });
  }

  const { data: liveSession } = await service
    .from("live_interview_sessions")
    .select("id,status")
    .eq("interview_id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!liveSession || liveSession.status !== "ended") {
    return NextResponse.json(
      { error: "End the Live interview before generating post-interview analysis." },
      { status: 409 }
    );
  }

  const [
    { data: transcriptItems },
    { data: guidanceItems },
    { data: priorRounds },
    { data: existingMemory },
    { data: latestAnalysis },
  ] = await Promise.all([
    service
      .from("live_transcript_items")
      .select("transcript,is_question,question_text,occurred_at")
      .eq("session_id", liveSession.id)
      .eq("user_id", userId)
      .order("occurred_at", { ascending: true }),
    service
      .from("live_guidance")
      .select("question_text,response_text,verified_evidence,caution,created_at")
      .eq("session_id", liveSession.id)
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    service
      .from("interview_round_memory")
      .select("round_number,questions_asked,topics_discussed,experiences_used,interviewer_signals,commitments,candidate_notes,handoff_summary")
      .eq("application_id", interview.application_id)
      .eq("user_id", userId)
      .neq("interview_id", id)
      .order("round_number", { ascending: true }),
    service
      .from("interview_round_memory")
      .select("*")
      .eq("interview_id", id)
      .eq("user_id", userId)
      .maybeSingle(),
    service
      .from("post_interview_analyses")
      .select("version_number")
      .eq("interview_id", id)
      .eq("user_id", userId)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!transcriptItems?.length) {
    return NextResponse.json(
      { error: "No Live transcript is available for this interview." },
      { status: 400 }
    );
  }

  try {
    const analysis = await generatePostInterviewAnalysis({
      companyName: interview.applications.company_name,
      roleTitle: interview.applications.role_title,
      stage: interview.stage,
      jobSnapshot: interview.applications.job_snapshot,
      resumeSnapshot: interview.applications.resume_snapshot,
      transcriptItems,
      guidanceItems: guidanceItems || [],
      priorRoundMemory: priorRounds || [],
      interviewerDetails: interview.interviewer_details,
    });

    const versionNumber = (latestAnalysis?.version_number ?? 0) + 1;

    const { data: savedAnalysis, error: analysisError } = await service
      .from("post_interview_analyses")
      .insert({
        interview_id: id,
        application_id: interview.application_id,
        user_id: userId,
        version_number: versionNumber,
        analysis,
        transcript_item_count: transcriptItems.length,
      })
      .select("id")
      .single();

    if (analysisError || !savedAnalysis) {
      throw new Error("Kernor could not save the analysis.");
    }

    const interviewerEmail =
      typeof interview.interviewer_details?.email === "string"
        ? interview.interviewer_details.email
        : null;
    const interviewerName =
      typeof interview.interviewer_details?.name === "string"
        ? interview.interviewer_details.name
        : null;

    const { data: followUp, error: followUpError } = await service
      .from("follow_up_drafts")
      .insert({
        interview_id: id,
        application_id: interview.application_id,
        user_id: userId,
        analysis_id: savedAnalysis.id,
        recipient_email: interviewerEmail,
        recipient_name: interviewerName,
        subject: analysis.followUpDraft.subject,
        body: analysis.followUpDraft.body,
        status: "draft",
      })
      .select("id")
      .single();

    if (followUpError || !followUp) {
      throw new Error("Kernor could not save the follow-up draft.");
    }

    const roundNumber =
      interview.round_number ||
      existingMemory?.round_number ||
      ((priorRounds?.length ?? 0) + 1);

    const mergedQuestions = unique([
      ...(existingMemory?.questions_asked || []),
      ...analysis.questionsAsked,
    ]);
    const mergedTopics = unique([
      ...(existingMemory?.topics_discussed || []),
      ...analysis.topicsDiscussed,
    ]);
    const mergedExperiences = unique([
      ...(existingMemory?.experiences_used || []),
      ...analysis.experiencesReferenced,
    ]);
    const mergedCommitments = unique([
      ...(existingMemory?.commitments || []),
      ...analysis.commitments,
    ]);
    const existingSignals = existingMemory?.interviewer_signals || [];

    const handoff = await generateRoundHandoff({
      companyName: interview.applications.company_name,
      roleTitle: interview.applications.role_title,
      jobSnapshot: interview.applications.job_snapshot,
      questionsAsked: mergedQuestions,
      topicsDiscussed: mergedTopics,
      experiencesUsed: mergedExperiences,
      interviewerSignals: existingSignals,
      commitments: mergedCommitments,
      candidateNotes: existingMemory?.candidate_notes || null,
    });

    const memoryValues = {
      interview_id: id,
      application_id: interview.application_id,
      user_id: userId,
      round_number: roundNumber,
      questions_asked: mergedQuestions,
      topics_discussed: mergedTopics,
      experiences_used: mergedExperiences,
      interviewer_signals: existingSignals,
      commitments: mergedCommitments,
      candidate_notes: existingMemory?.candidate_notes || null,
      handoff_summary: handoff,
      source: existingMemory?.source === "user" ? "user" : "live",
      updated_at: new Date().toISOString(),
    };

    if (existingMemory) {
      await service
        .from("interview_round_memory")
        .update(memoryValues)
        .eq("id", existingMemory.id);
    } else {
      await service.from("interview_round_memory").insert(memoryValues);
    }

    await service
      .from("interviews")
      .update({
        round_number: roundNumber,
        post_analysis: analysis,
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userId);

    return NextResponse.json({
      ok: true,
      analysisId: savedAnalysis.id,
      followUpId: followUp.id,
      versionNumber,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Kernor could not analyze this interview.",
      },
      { status: 500 }
    );
  }
}
