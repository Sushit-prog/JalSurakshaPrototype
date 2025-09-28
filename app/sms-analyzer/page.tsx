
'use client'
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { DashboardNav } from '@/components/dashboard-nav';
import { AppHeader } from '@/components/app-header';
import { useI18n } from '@/context/I18nContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SmsAnalyzer as SmsAnalyzerComponent } from '@/components/sms-analyzer';

export default function SmsAnalyzerPage() {
    const { t } = useI18n();

    return (
    <SidebarProvider>
      <Sidebar>
        <DashboardNav />
      </Sidebar>
      <SidebarInset>
        <main className="min-h-screen flex flex-col">
          <AppHeader title={t('smsAnalyzer')} />
          <div className="flex-1 space-y-4 p-4 md:p-8">
            <Card>
                <CardHeader>
                  <CardTitle className="font-headline">
                    {t('smsReportAnalyzer')}
                  </CardTitle>
                  <CardDescription>
                    Parse and analyze incoming SMS reports using AI. This tool demonstrates how the system can ingest data from low-tech sources.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SmsAnalyzerComponent />
                </CardContent>
              </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
    )
}

    