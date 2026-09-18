// Known shapes for jsonb columns that Supabase's generated types can only
// describe as the generic `Json` union. Shapes are sourced from the writer
// code (trigger functions in the baseline migration; integration sync code).

export type InterviewerDetails = {
  name?: string | null;
  email?: string | null;
};

export type ResumeSnapshot = {
  resume_id?: string | null;
  file_name?: string | null;
  storage_path?: string | null;
  mime_type?: string | null;
  parsed_data?: unknown;
  approved?: boolean | null;
};

export type JobSnapshot = {
  company_name?: string | null;
  role_title?: string | null;
  location?: string | null;
  work_arrangement?: string | null;
  employment_type?: string | null;
  salary_text?: string | null;
  description?: string | null;
  match_score?: number | null;
  match_breakdown?: unknown;
  source?: string | null;
  source_url?: string | null;
};
