'use server';

/**
 * @fileOverview An alert generation AI agent for disease outbreaks.
 *
 * - generateAlerts - A function that handles the generation of alerts from reports.
 * - GenerateAlertsInput - The input type for the generateAlerts function.
 * - GenerateAlertsOutput - The return type for the generateAlerts function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ReportSchema = z.object({
  id: z.string(),
  date: z.string(),
  village: z.string(),
  symptoms: z.array(z.string()),
  ph: z.number().nullable(),
  turbidity: z.number().nullable(),
  cases: z.number(),
  reporter: z.string(),
});

const AlertSchema = z.object({
  id: z.string(),
  village: z.string(),
  severity: z.enum(['Low', 'Medium', 'High']),
  status: z.enum(['Open', 'Investigating', 'Closed']),
  reports: z.number(),
  time: z.string(),
});

const GenerateAlertsInputSchema = z.object({
  reports: z.array(ReportSchema),
});
export type GenerateAlertsInput = z.infer<typeof GenerateAlertsInputSchema>;

const GenerateAlertsOutputSchema = z.object({
  alerts: z.array(AlertSchema),
});
export type GenerateAlertsOutput = z.infer<typeof GenerateAlertsOutputSchema>;

export async function generateAlerts(
  input: GenerateAlertsInput
): Promise<GenerateAlertsOutput> {
  return alertGenerationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'alertGenerationPrompt',
  input: { schema: GenerateAlertsInputSchema },
  output: { schema: GenerateAlertsOutputSchema },
  prompt: `You are a public health expert analyzing community health reports to identify potential outbreaks.

Your task is to analyze the provided health reports and generate alerts if you detect a high risk of an outbreak.

Analyze the reports based on the following criteria:
- Concentration of cases in a specific village.
- High number of cases.
- Severity of symptoms (e.g., fever, diarrhea are more concerning).
- Poor water quality (low/high pH, high turbidity).
- Multiple reports from the same area.

For each potential outbreak, create an alert with the following information:
- id: A unique identifier for the alert (e.g., ALERT-001).
- village: The village where the potential outbreak is located.
- severity: "High", "Medium", or "Low".
- status: "Open" for new alerts.
- reports: The number of reports related to this alert.
- time: A human-readable time since the alert was generated (e.g., "5m ago").

Here are the reports:
{{{json reports}}}

Generate a list of alerts based on your analysis. Only generate alerts for high-risk situations. If there are no high-risk situations, return an empty list of alerts.
`,
});

const alertGenerationFlow = ai.defineFlow(
  {
    name: 'alertGenerationFlow',
    inputSchema: GenerateAlertsInputSchema,
    outputSchema: GenerateAlertsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return (
      output ?? {
        alerts: [],
      }
    );
  }
);