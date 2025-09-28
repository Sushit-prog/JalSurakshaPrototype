
'use client';

import Image from "next/image";
import {
  AlertTriangle,
  Droplets,
  FileText,
  Siren,
  TestTube2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useState, useContext, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from '@/components/ui/textarea';
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { DashboardNav } from "@/components/dashboard-nav";
import { AlertsTable } from "@/components/alerts-table";
import { ReportsChart } from "@/components/reports-chart";
import { AppHeader } from "@/components/app-header";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { simulateOutbreak } from "@/ai/flows/simulate-outbreak-flow";
import { ReportsContext } from "@/context/ReportsContext";
import { Report } from "@/components/recent-reports-table";
import { generateRiskScore, GenerateRiskScoreOutput, GenerateRiskScoreInput } from "@/ai/flows/risk-prediction-flow";
import { RiskScoreIndicator } from "@/app/prediction/page";


const quickRiskSchema = z.object({
  situationDescription: z.string().min(20, 'Please describe the situation in at least 20 characters.'),
});
type QuickRiskFormValues = z.infer<typeof quickRiskSchema>;


export default function DashboardPage() {
  const { t, language } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { addReport } = useContext(ReportsContext);
  const [isSimulating, setIsSimulating] = useState(false);
  
  const [riskPrediction, setRiskPrediction] = useState<GenerateRiskScoreOutput | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const quickRiskForm = useForm<QuickRiskFormValues>({
    resolver: zodResolver(quickRiskSchema),
    defaultValues: {
      situationDescription: 'Reports of fever and diarrhea are increasing in the Jalsuraksha village area after recent flooding. The main well water appears cloudy.',
    }
  });

  const getLanguageName = (langCode: string) => {
    switch (langCode) {
      case 'as': return 'Assamese';
      case 'bn': return 'Bengali';
      case 'brx': return 'Bodo';
      default: return 'English';
    }
  }

  const onQuickRiskSubmit: SubmitHandler<QuickRiskFormValues> = async (data) => {
    setIsPredicting(true);
    setRiskPrediction(null);
    try {
       const riskInput: GenerateRiskScoreInput = {
          region: 'Not specified',
          healthReports: data.situationDescription,
          waterQuality: 'Included in description',
          seasonalTrends: 'Not specified',
          language: getLanguageName(language),
       }
      const result = await generateRiskScore(riskInput);
      setRiskPrediction(result);
    } catch (error) {
      console.error('Quick risk prediction failed:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'Could not generate a risk score. Please try again.',
      });
    } finally {
      setIsPredicting(false);
    }
  };


  const handleSimulateOutbreak = async () => {
    setIsSimulating(true);
    toast({
      title: "Simulating Outbreak...",
      description: "Generating high-risk report data. This may take a moment.",
    });
    try {
      const result = await simulateOutbreak();
      
      const reportPromises = result.reports.map(report => {
        const newReport: Omit<Report, 'id' | 'date'> = {
          ...report
        };
        return addReport(newReport);
      });
      
      await Promise.all(reportPromises);

      toast({
        title: "Outbreak Simulation Complete",
        description: `${result.reports.length} high-risk reports have been added. You can now generate new alerts.`,
      });
    } catch (error) {
      console.error("Outbreak simulation failed:", error);
      toast({
        variant: "destructive",
        title: "Simulation Failed",
        description: "Could not simulate outbreak. Please try again.",
      });
    } finally {
      setIsSimulating(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <DashboardNav />
      </Sidebar>
      <SidebarInset>
        <main className="min-h-screen flex flex-col">
          <AppHeader title={t('dashboard')}>
             <Button variant="destructive" onClick={handleSimulateOutbreak} disabled={isSimulating}>
                {isSimulating ? (
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <AlertTriangle className="mr-2 h-4 w-4" />
                )}
                {t('simulateOutbreak')}
              </Button>
          </AppHeader>

          <div className="flex-1 space-y-4 p-4 md:p-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('totalReports')}
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,234</div>
                  <p className="text-xs text-muted-foreground">
                    +20.1% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('activeAlerts')}
                  </CardTitle>
                  <Siren className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    +5
                  </div>
                  <p className="text-xs text-muted-foreground">
                    In the last 24 hours
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('avgWaterPh')}
                  </CardTitle>
                  <TestTube2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">7.2</div>
                  <p className="text-xs text-muted-foreground">
                    Within normal range
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('avgTurbidity')}
                  </CardTitle>
                  <Droplets className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4.8 NTU</div>
                  <p className="text-xs text-muted-foreground">
                    Slightly elevated
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
              <Card className="col-span-1 lg:col-span-4">
                <CardHeader>
                  <CardTitle className="font-headline">
                    {t('reportsOverview')}
                  </CardTitle>
                  <CardDescription>
                    Daily symptom reports over the last week.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <ReportsChart />
                </CardContent>
              </Card>

              <Card className="col-span-1 lg:col-span-3">
                <CardHeader>
                  <CardTitle className="font-headline">{t('recentAlerts')}</CardTitle>
                  <CardDescription>
                    Potential outbreaks requiring investigation.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AlertsTable />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Quick Risk Assessment</CardTitle>
                <CardDescription>
                  Describe a situation in plain text to get an instant AI-powered risk analysis.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div>
                    <Form {...quickRiskForm}>
                      <form onSubmit={quickRiskForm.handleSubmit(onQuickRiskSubmit)} className="space-y-4">
                        <FormField
                          control={quickRiskForm.control}
                          name="situationDescription"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Situation Description</FormLabel>
                              <FormControl>
                                <Textarea {...field} rows={6} placeholder="e.g., Several families in Pawanpur are reporting severe vomiting..." />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" disabled={isPredicting}>
                          {isPredicting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                          Assess Risk
                        </Button>
                      </form>
                    </Form>
                  </div>
                  <div className="flex h-full min-h-[200px] items-center justify-center rounded-lg border-2 border-dashed bg-secondary/50 p-6">
                    {isPredicting && <Loader2 className="h-10 w-10 animate-spin text-primary" />}
                    
                    {!isPredicting && riskPrediction && (
                      <div className="space-y-4 text-center">
                        <RiskScoreIndicator score={riskPrediction.riskScore} />
                         <p className="text-sm text-muted-foreground">
                          {riskPrediction.summary}
                        </p>
                      </div>
                    )}

                    {!isPredicting && !riskPrediction && (
                      <div className="text-center text-muted-foreground">
                         <Sparkles className="mx-auto h-8 w-8 mb-2"/>
                         <p>Analysis results will appear here.</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
