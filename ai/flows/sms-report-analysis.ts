
'use server';

/**
 * @fileOverview An SMS report analysis AI agent.
 *
 * - analyzeSmsReport - A function that handles the analysis of SMS reports.
 * - AnalyzeSmsReportInput - The input type for the analyzeSmsReport function.
 * - AnalyzeSmsReportOutput - The return type for the analyzeSmsReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeSmsReportInputSchema = z.object({
  smsBody: z.string().describe('The body of the SMS report.'),
});
export type AnalyzeSmsReportInput = z.infer<typeof AnalyzeSmsReportInputSchema>;

const AnalyzeSmsReportOutputSchema = z.object({
  village: z.string().describe('The village reported in the SMS.'),
  symptoms: z.array(z.string()).describe('The symptoms reported in the SMS.'),
  waterQuality: z.object({
    ph: z.number().nullable().describe('The pH level of the water.'),
    turbidity: z.number().nullable().describe('The turbidity of the water.'),
  }).describe('The water quality parameters reported in the SMS.'),
  cases: z.number().optional().describe('The number of cases reported.'),
  reporter: z.string().optional().describe('The name of the reporter or IoT sensor ID.')
});
export type AnalyzeSmsReportOutput = z.infer<typeof AnalyzeSmsReportOutputSchema>;

export async function analyzeSmsReport(input: AnalyzeSmsReportInput): Promise<AnalyzeSmsReportOutput> {
  return analyzeSmsReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSmsReportPrompt',
  input: {schema: AnalyzeSmsReportInputSchema},
  output: {schema: AnalyzeSmsReportOutputSchema},
  prompt: `You are an expert system for extracting data from unstructured SMS messages related to community health.

Your task is to parse the provided SMS body and extract key information. The format can be messy, but it will contain keywords.

**Keywords to look for:**
- **village:** The name of the village or area.
- **s:** or **symptoms:** A comma-separated list of symptoms.
- **ph:** The pH level of the water (optional).
- **turb:** or **turbidity:** The turbidity of the water (optional).
- **cases:** The number of affected people (optional).
- **reporter:** The name of the person reporting.
- **sensor_id:** An identifier for an automated IoT sensor.

**Your instructions:**
1.  Identify the village. It is usually preceded by "village=" or is the first named location.
2.  Extract all listed symptoms. They are usually preceded by "s=" or "symptoms=". If no symptoms, return an empty array.
3.  Extract the pH value if present. It will be a number. If not present, set ph to null.
4.  Extract the turbidity value if present. It will be a number. If not present, set turbidity to null.
5.  Extract the number of cases if present.
6.  Determine the reporter:
    - If a **sensor_id** is present, set the 'reporter' field to 'IoT Sensor'.
    - If a **reporter** field is present, extract the name.
    - If neither 'reporter' nor 'sensor_id' is found, infer a default like 'ASHA Worker' or 'Volunteer'.

**Example SMS Messages:**
- "REPORT village=Jalsuraksha s=diarrhea,fever ph=7 turb=5 cases=10 reporter=Jane"
- "village:Pawanpur, symptoms:vomiting,fever"
- "Agnigiri village report: 5 cases of rashes. Water seems clear, turb is 2."
- "sensor_id=AQ-101, village=Vidyutgram, ph=8.1, turb=15.2"
- "v:Vidyutgram, s:headache reporter:ASHA Worker 1"

Analyze the following SMS body and extract the data according to the output schema.

**SMS Body:** {{{smsBody}}}
`,
});

const analyzeSmsReportFlow = ai.defineFlow(
  {
    name: 'analyzeSmsReportFlow',
    inputSchema: AnalyzeSmsReportInputSchema,
    outputSchema: AnalyzeSmsReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
