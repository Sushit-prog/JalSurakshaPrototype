'use server';

/**
 * @fileOverview An AI agent for simulating a disease outbreak.
 *
 * - simulateOutbreak - A function that generates a set of high-risk health reports.
 * - SimulateOutbreakOutput - The return type for the simulateOutbreak function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SimulatedReportSchema = z.object({
  village: z.string(),
  symptoms: z.array(z.string()),
  ph: z.number().nullable(),
  turbidity: z.number().nullable(),
  cases: z.number(),
  reporter: z.string(),
});

const SimulateOutbreakOutputSchema = z.object({
  reports: z.array(SimulatedReportSchema),
});
export type SimulateOutbreakOutput = z.infer<
  typeof SimulateOutbreakOutputSchema
>;

export async function simulateOutbreak(): Promise<SimulateOutbreakOutput> {
  return simulateOutbreakFlow();
}

const prompt = ai.definePrompt({
  name: 'simulateOutbreakPrompt',
  output: { schema: SimulateOutbreakOutputSchema },
  prompt: `You are a public health simulation expert. Your task is to generate a realistic dataset of 8-12 health reports that strongly indicate a potential water-borne disease outbreak in a rural area.

**Instructions:**
1.  **Create a Cluster:** Make sure 60-70% of the reports come from the *same village* to simulate a localized hotspot. Use village names like 'Jalsuraksha', 'Pawanpur', 'Agnigiri', etc.
2.  **High-Risk Symptoms:** The majority of reports should include symptoms like 'diarrhea', 'vomiting', and 'fever'.
3.  **Water Quality Issues:** Some reports from the main cluster should indicate poor water quality. Assign a pH between 5.5 and 6.5 or a turbidity level between 10 and 25 NTU. For other reports, you can leave these null or in a normal range (pH 7-7.5, turbidity < 5).
4.  **Varying Cases:** The number of cases per report can range from 2 to 15.
5.  **Reporters:** Use reporter names like "ASHA Worker 1", "Clinic Staff", "Volunteer", etc.

Generate a list of 8 to 12 simulated reports that, when analyzed together, would clearly point to a public health emergency.
`,
});

const simulateOutbreakFlow = ai.defineFlow(
  {
    name: 'simulateOutbreakFlow',
    outputSchema: SimulateOutbreakOutputSchema,
  },
  async () => {
    const { output } = await prompt();
    return output ?? { reports: [] };
  }
);
