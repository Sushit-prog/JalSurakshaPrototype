"use client";

import { useState, useContext } from "react";
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { DashboardNav } from "@/components/dashboard-nav";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";
import { RecentReportsTable, type Report } from "@/components/recent-reports-table";
import { ReportsContext } from "@/context/ReportsContext";
import { AppHeader } from "@/components/app-header";
import { useI18n } from "@/context/I18nContext";

const villages = ["Jalsuraksha", "Pawanpur", "Agnigiri", "Vidyutgram", "Barpeta"];
const allSymptoms = ["fever", "diarrhea", "vomiting", "headache", "rashes"];
const reporters = ["ASHA Worker", "Clinic Staff", "Volunteer", "IoT Sensor"];


const formSchema = z.object({
  reporterName: z.string().min(1, "Reporter name is required."),
  village: z.string().min(1, "Village is required."),
  symptoms: z.array(z.string()).min(1, "At least one symptom is required."),
  numberOfCases: z.coerce.number().min(1, "Number of cases must be at least 1."),
  ph: z.coerce.number().min(0).max(14).optional().nullable(),
  turbidity: z.coerce.number().min(0).optional().nullable(),
  description: z.string().optional(),
});

type ReportFormValues = z.infer<typeof formSchema>;


export default function SubmitReportPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { reports, addReport } = useContext(ReportsContext);
  const { toast } = useToast();
  const { t } = useI18n();

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reporterName: "",
      village: "",
      symptoms: [],
      numberOfCases: 1,
      ph: null,
      turbidity: null,
      description: ""
    },
  });

  const onSubmit: SubmitHandler<ReportFormValues> = async (data) => {
    setIsLoading(true);
    
    const newReport: Omit<Report, 'id' | 'date'> = {
        village: data.village,
        symptoms: data.symptoms,
        ph: data.ph ?? null,
        turbidity: data.turbidity ?? null,
        cases: data.numberOfCases,
        reporter: data.reporterName,
    }

    try {
      await addReport(newReport);

      toast({
        title: "Report Submission Queued",
        description: "Your report will be submitted. It will sync automatically when you are online.",
      });
      form.reset();

    } catch (error) {
       toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "There was a problem with your report submission.",
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
          <AppHeader title={t('submitReport')} />
          <div className="flex-1 space-y-4 p-4 md:p-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('newHealthReport')}</CardTitle>
                    <CardDescription>
                      {t('newHealthReportDescription')}
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
                          name="reporterName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('reporterName')}</FormLabel>
                               <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a reporter type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {reporters.map((reporter) => (
                                    <SelectItem key={reporter} value={reporter}>
                                      {reporter}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="village"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('villageArea')}</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={t('selectVillage')} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {villages.map((village) => (
                                    <SelectItem key={village} value={village}>
                                      {village}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                          control={form.control}
                          name="symptoms"
                          render={() => (
                            <FormItem>
                              <FormLabel>{t('symptoms')}</FormLabel>
                                {allSymptoms.map((symptom) => (
                                  <FormField
                                    key={symptom}
                                    control={form.control}
                                    name="symptoms"
                                    render={({ field }) => {
                                      return (
                                        <FormItem
                                          key={symptom}
                                          className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(symptom)}
                                              onCheckedChange={(checked) => {
                                                return checked
                                                  ? field.onChange([...field.value, symptom])
                                                  : field.onChange(
                                                      field.value?.filter(
                                                        (value) => value !== symptom
                                                      )
                                                    )
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="font-normal capitalize">
                                            {t(symptom)}
                                          </FormLabel>
                                        </FormItem>
                                      )
                                    }}
                                  />
                                ))}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="numberOfCases"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('numberOfCases')}</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                           <FormField
                            control={form.control}
                            name="ph"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('waterPH')}</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.1" {...field} value={field.value ?? ""} placeholder="e.g., 7.2" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                           <FormField
                            control={form.control}
                            name="turbidity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('turbidity')}</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.1" {...field} value={field.value ?? ""} placeholder="e.g., 4.5" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('descriptionNotes')}</FormLabel>
                              <FormControl>
                                <Textarea rows={3} {...field} placeholder="Any additional notes..." />
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
                            <Send className="mr-2 h-5 w-5" />
                          )}
                          {t('submitReport')}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('recentSubmissions')}</CardTitle>
                     <CardDescription>
                      {t('recentSubmissionsDescription')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RecentReportsTable reports={reports} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
