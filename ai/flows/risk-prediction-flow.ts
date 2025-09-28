'use server';

/**
 * @fileOverview A risk prediction AI agent for disease outbreaks.
 *
 * - generateRiskScore - A function that handles the generation of a risk score.
 * - GenerateRiskScoreInput - The input type for the generateRiskScore function.
 * - GenerateRiskScoreOutput - The return type for the generateRiskScore function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateRiskScoreInputSchema = z.object({
  region: z.string().describe('The geographical region for the prediction.'),
  healthReports: z.string().describe('Summary of community health reports.'),
  waterQuality: z.string().describe('Summary of water quality data.'),
  seasonalTrends: z.string().describe('Information on seasonal trends.'),
  language: z.string().describe('The language for the output response (e.g., "English", "Assamese", "Bengali").'),
});
export type GenerateRiskScoreInput = z.infer<
  typeof GenerateRiskScoreInputSchema
>;

const GenerateRiskScoreOutputSchema = z.object({
  riskScore: z
    .number()
    .min(0)
    .max(100)
    .describe('A numerical risk score from 0 to 100.'),
  summary: z
    .string()
    .describe('A brief summary explaining the risk score.'),
  recommendations: z
    .array(z.string())
    .describe('A list of actionable recommendations.'),
});
export type GenerateRiskScoreOutput = z.infer<
  typeof GenerateRiskScoreOutputSchema
>;

export async function generateRiskScore(
  input: GenerateRiskScoreInput
): Promise<GenerateRiskScoreOutput> {
  return generateRiskScoreFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRiskScorePrompt',
  input: { schema: GenerateRiskScoreInputSchema },
  output: { schema: GenerateRiskScoreOutputSchema },
  prompt: `You are a public health expert specializing in epidemiology and risk assessment for water-borne diseases.

Your task is to analyze the provided data to generate a dynamic outbreak risk score and provide actionable recommendations based on a public health rubric. The entire response (summary and recommendations) MUST be in the requested language: {{{language}}}.

**Analysis of Provided Data:**
- Region: {{{region}}}
- Community Health Reports: {{{healthReports}}}
- Water Quality Data: {{{waterQuality}}}
- Seasonal Trends: {{{seasonalTrends}}}

**Internal Thinking Process & Scoring Rubric:**
First, think step-by-step. Analyze each piece of input data against the following rubric. Your final score should be a weighted average based on this analysis.
1.  **Symptom Severity & Case Numbers (40% weight):**
    - Are the symptoms high-risk (e.g., severe watery diarrhea, cholera-like symptoms)? Or are they mild (e.g., scattered fever reports)?
    - Is there a high number of cases, or just a few? Is there a rapid increase?
2.  **Water Quality (30% weight):**
    - Are there critical indicators like E. coli? Is turbidity very high? Is the pH level unsafe?
    - Or is the water quality only slightly off or within normal parameters?
3.  **Environmental Factors (20% weight):**
    - Are conditions high-risk (e.g., monsoon season, recent floods)?
    - Or are environmental conditions stable and low-risk?
4.  **Geographic Concentration (10% weight):**
    - Are reports clustered in a single area, suggesting a point-source outbreak?
    - Or are they scattered, suggesting isolated incidents?

**Your Output (JSON in {{{language}}}):**
Based on your step-by-step rubric analysis, provide the following JSON output. The examples below are just guides; your response must be tailored to the specific input data provided. Do not just copy the examples.

1.  **riskScore:** A dynamically calculated score from 0 (very low risk) to 100 (very high risk). The score must directly and proportionally reflect the severity of the input data. Do not default to a high score for mild inputs.
2.  **summary:** A concise summary explaining the key factors that influenced your calculated score, referencing the rubric (e.g., "High risk due to E. coli presence and a cluster of severe diarrhea cases during monsoon season."). THIS MUST BE IN {{{language}}}.
3.  **recommendations:** A list of clear, actionable recommendations tailored to the *specific risk factors* and *score* you identified. THIS MUST BE IN {{{language}}}.
    - For a high-risk score, recommendations must be urgent and specific (e.g., "Issue an immediate boil-water advisory for the {{{region}}} area due to E. coli detection," "Deploy rapid response teams to affected villages to manage the high number of severe cases.").
    - For a moderate-risk score, suggest heightened surveillance and targeted interventions (e.g., "Increase water testing frequency at the main well," "Begin targeted hygiene promotion in the specific community with rising cases.").
    - For a low-risk score, suggest preventive and educational measures (e.g., "Continue routine surveillance," "Reinforce community education on safe water storage.").

Example for a high-risk scenario (if language is English):
{
  "riskScore": 85,
  "summary": "The risk is extremely high due to multiple reports of severe watery diarrhea and vomiting, consistent with a potential cholera outbreak. This is amplified by the detection of E. coli in the primary water source and the ongoing monsoon season, which can accelerate contamination spread.",
  "recommendations": [
    "Issue an immediate boil-water advisory for the entire {{{region}}} area.",
    "Deploy rapid response medical teams to the affected villages to manage cases and prevent deaths.",
    "Increase surveillance and begin emergency testing of all community water sources.",
    "Distribute Oral Rehydration Solution (ORS) packets and hygiene kits to all households."
  ]
}

Example for a low-risk scenario (if language is English):
{
  "riskScore": 20,
  "summary": "Low risk detected. There are a few scattered reports of mild fever, but no significant clustering or water quality issues have been reported. Seasonal conditions are currently stable.",
  "recommendations": [
    "Continue routine water quality monitoring and public health surveillance.",
    "Reinforce community education on handwashing and safe water storage.",
    "Ensure local health workers are prepared to identify and report any increase in symptoms."
  ]
}
`,
});

const generateRiskScoreFlow = ai.defineFlow(
  {
    name: 'generateRiskScoreFlow',
    inputSchema: GenerateRiskScoreInputSchema,
    outputSchema: GenerateRiskScoreOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
