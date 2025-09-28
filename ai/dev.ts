
import { config } from 'dotenv';
config();

import '@/ai/flows/sms-report-analysis.ts';
import '@/ai/flows/risk-prediction-flow.ts';
import '@/ai/flows/alert-generation-flow.ts';
import '@/ai/flows/simulate-outbreak-flow.ts';
