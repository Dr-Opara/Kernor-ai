import { z } from "zod";

export const resumeProfileSchema = z.object({
  summary: z.string(),
  yearsExperience: z.number().min(0),
  currentOrRecentTitle: z.string().nullable(),
  industries: z.array(z.string()),
  skills: z.array(z.string()),
  certifications: z.array(z.string()),
  education: z.array(z.object({
    degree: z.string(),
    field: z.string().nullable(),
    institution: z.string().nullable(),
  })),
  roles: z.array(z.object({
    title: z.string(),
    company: z.string().nullable(),
    start: z.string().nullable(),
    end: z.string().nullable(),
    responsibilities: z.array(z.string()),
    achievements: z.array(z.string()),
    skills: z.array(z.string()),
  })),
  verifiedFacts: z.array(z.string()),
});

export const matchAssessmentSchema = z.object({
  companyName: z.string(),
  roleTitle: z.string(),
  location: z.string().nullable(),
  workArrangement: z.string().nullable(),
  employmentType: z.string().nullable(),
  salaryText: z.string().nullable(),

  hardRequirements: z.array(z.object({
    requirement: z.string(),
    status: z.enum(["met", "partial", "missing", "unknown"]),
    evidence: z.string(),
    isCritical: z.boolean(),
  })),

  dimensions: z.object({
    requiredQualifications: z.object({
      score: z.number().min(0).max(100),
      evidence: z.array(z.string()),
      gaps: z.array(z.string()),
    }),
    professionalExperience: z.object({
      score: z.number().min(0).max(100),
      evidence: z.array(z.string()),
      gaps: z.array(z.string()),
    }),
    skillsAndTools: z.object({
      score: z.number().min(0).max(100),
      evidence: z.array(z.string()),
      gaps: z.array(z.string()),
    }),
    roleAndSeniority: z.object({
      score: z.number().min(0).max(100),
      evidence: z.array(z.string()),
      gaps: z.array(z.string()),
    }),
    industryDomain: z.object({
      score: z.number().min(0).max(100),
      evidence: z.array(z.string()),
      gaps: z.array(z.string()),
    }),
    educationAndCertifications: z.object({
      score: z.number().min(0).max(100),
      evidence: z.array(z.string()),
      gaps: z.array(z.string()),
    }),
    locationAndWorkArrangement: z.object({
      score: z.number().min(0).max(100),
      evidence: z.array(z.string()),
      gaps: z.array(z.string()),
    }),
    candidatePreferences: z.object({
      score: z.number().min(0).max(100),
      evidence: z.array(z.string()),
      gaps: z.array(z.string()),
    }),
  }),

  strongestMatches: z.array(z.string()).max(5),
  biggestGaps: z.array(z.string()).max(5),
  conciseSummary: z.string(),
});

export type ResumeProfile = z.infer<typeof resumeProfileSchema>;
export type MatchAssessment = z.infer<typeof matchAssessmentSchema>;
