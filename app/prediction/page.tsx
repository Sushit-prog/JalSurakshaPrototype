
'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Bot, Loader2, Save, Sparkles } from 'lucide-react';
import {
  generateRiskScore,
  type GenerateRiskScoreInput,
  type GenerateRiskScoreOutput,
} from '@/ai/flows/risk-prediction-flow';
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { AppHeader } from '@/components/app-header';
import { useI18n } from '@/context/I18nContext';
import { DashboardNav } from '@/components/dashboard-nav';

const formSchema = z.object({
  region: z.string().min(1, 'Region is required.'),
  healthReports: z.string().min(10, 'Health reports are required.'),
  waterQuality: z.string().min(10, 'Water quality data is required.'),
  seasonalTrends: z.string().min(10, 'Seasonal trends are required.'),
});

type FormValues = Omit<GenerateRiskScoreInput, 'language'>;

const defaultValuesByLang = {
  en: {
    region: 'Kamrup Rural',
    healthReports:
      'Multiple cases of diarrhea and vomiting reported in children under 5. Increase in patients with fever.',
    waterQuality:
      'Recent tests show high turbidity in the main well after heavy rainfall. E. coli presence detected.',
    seasonalTrends:
      'Monsoon season, high humidity, and temperatures around 30°C.',
  },
  as: {
    region: 'কামৰূপ গ্ৰাম্য',
    healthReports:
      '৫ বছৰৰ তলৰ শিশুক একাধিক ডায়েৰিয়া আৰু বমিৰ ঘটনা। জ্বৰত আক্ৰান্ত ৰোগীৰ সংখ্যা বৃদ্ধি।',
    waterQuality:
      'শেহতীয়া পৰীক্ষাত প্ৰৱল বৰষুণৰ পিছত মুখ্য কুঁৱাত উচ্চ টাৰ্বিডিটি দেখা গৈছে। ই. কলাইৰ উপস্থিতি ধৰা পৰিছে।',
    seasonalTrends: 'মৌসুমী বতাহ, উচ্চ আৰ্দ্ৰতা, আৰু ৩০°C-ৰ ওচৰে-পাজৰে উষ্ণতা।',
  },
  bn: {
    region: 'কামরূপ গ্রামীণ',
    healthReports:
      '৫ বছরের কম বয়সী শিশুদের মধ্যে ডায়রিয়া এবং বমির একাধিক ঘটনা রিপোর্ট করা হয়েছে। জ্বরের রোগীর সংখ্যা বৃদ্ধি।',
    waterQuality:
      'সম্প্রতি পরীক্ষায় ভারী বৃষ্টির পর প্রধান কূপে উচ্চ টার্বিডিটি দেখা গেছে। ই. কোলাই উপস্থিতি সনাক্ত করা হয়েছে।',
    seasonalTrends:
      'বর্ষা ঋতু, উচ্চ আর্দ্রতা এবং প্রায় ৩০°C তাপমাত্রা।',
  },
  brx: {
    region: 'कमरुप रुरल',
    healthReports:
      '५ बोसोरनि सिङाव थानाय गथफोरनाव डायरिया आरो बान्ति जानायनि गोबां केस रिपोर्ट जादों। जारनि बेमारि बारायदों।',
    waterQuality:
      'जोबोर खांनाय बारहुंखा उनि गेदेर कुवानि टार्बिडिटि बारायनाय नुदों। E. coli थानाय मोनदों।',
    seasonalTrends:
      'बारिश सम, गोबां आर्द्रता आरो ३०°C नि सोरगिदिं तापमात्रा।',
  },
};


export function RiskScoreIndicator({ score }: { score: number }) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const animation = requestAnimationFrame(() => setDisplayScore(score));
      return () => cancelAnimationFrame(animation);
    }
  }, [score]);

  let colorClass = 'text-green-500';
  if (score > 75) {
    colorClass = 'text-red-500';
  } else if (score > 50) {
    colorClass = 'text-yellow-500';
  }

  return (
    <div className="relative flex h-40 w-40 items-center justify-center rounded-full">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 36 36">
        <path
          className="text-secondary"
          d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className={`transition-all duration-500 ease-in-out ${colorClass}`}
          d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray={`${displayScore}, 100`}
        />
      </svg>
      <div className="flex flex-col items-center">
        <span className={`text-4xl font-bold ${colorClass}`}>{score}</span>
        <span className="text-sm font-medium text-muted-foreground">
          Risk Score
        </span>
      </div>
    </div>
  );
}

export default function PredictionPage() {
  const [prediction, setPrediction] = useState<GenerateRiskScoreOutput | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t, language } = useI18n();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValuesByLang[language],
  });

  useEffect(() => {
    form.reset(defaultValuesByLang[language]);
  }, [language, form]);

  const getLanguageName = (langCode: string) => {
    switch (langCode) {
      case 'as': return 'Assamese';
      case 'bn': return 'Bengali';
      case 'brx': return 'Bodo';
      default: return 'English';
    }
  }

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setPrediction(null);
    try {
      const result = await generateRiskScore({
        ...data,
        language: getLanguageName(language),
      });
      setPrediction(result);
    } catch (error) {
      console.error('Prediction failed:', error);
      toast({
        variant: 'destructive',
        title: 'Prediction Failed',
        description: 'Could not generate risk score. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <DashboardNav />
      </Sidebar>
      <SidebarInset>
        <main className="min-h-screen flex flex-col">
          <AppHeader title={t('prediction')} />
          <div className="flex-1 space-y-4 p-4 md:p-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-2xl">
                    Input Data
                  </CardTitle>
                  <CardDescription>
                    Provide the necessary data to generate a risk score.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-6"
                    >
                      <FormField
                        control={form.control}
                        name="region"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Region</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="healthReports"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Community Health Reports</FormLabel>
                            <FormControl>
                              <Textarea rows={4} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="waterQuality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Water Quality Data</FormLabel>
                            <FormControl>
                              <Textarea rows={3} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="seasonalTrends"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Seasonal Trends</FormLabel>
                            <FormControl>
                              <Textarea rows={3} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                          <Sparkles className="mr-2 h-5 w-5" />
                        )}
                        Generate Risk Score
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-2xl">
                    AI-Powered Analysis
                  </CardTitle>
                  <CardDescription>
                    The generated outbreak risk score and recommendations.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!prediction && !isLoading && (
                    <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed bg-secondary/50 p-8 text-center">
                      <Bot className="h-16 w-16 text-muted-foreground" />
                      <p className="mt-4 text-muted-foreground">
                        Your prediction results will appear here.
                      </p>
                    </div>
                  )}
                  {isLoading && (
                    <div className="flex h-full min-h-[400px] flex-col items-center justify-center space-y-4">
                      <Loader2 className="h-16 w-16 animate-spin text-primary" />
                      <p className="text-muted-foreground">
                        AI is analyzing the data...
                      </p>
                    </div>
                  )}
                  {prediction && (
                    <div className="space-y-6">
                      <div className="flex flex-col items-center space-y-4 rounded-lg bg-secondary/50 p-6">
                        <RiskScoreIndicator score={prediction.riskScore} />
                        <p className="text-center text-muted-foreground">
                          {prediction.summary}
                        </p>
                      </div>
                      <div>
                        <h3 className="mb-2 text-lg font-semibold">
                          Recommendations
                        </h3>
                        <ul className="space-y-2">
                          {prediction.recommendations.map((rec, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-3"
                            >
                              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                              <span className="text-sm text-muted-foreground">
                                {rec}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

    