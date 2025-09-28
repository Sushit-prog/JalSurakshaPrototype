'use client';

import { useState, useContext, useMemo } from 'react';
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { AlertsTable, type Alert } from '@/components/alerts-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Loader2, Sparkles, Search, ListFilter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  generateAlerts,
  type GenerateAlertsOutput,
} from '@/ai/flows/alert-generation-flow';
import { ReportsContext } from '@/context/ReportsContext';
import { AppHeader } from '@/components/app-header';
import { useI18n } from '@/context/I18nContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DashboardNav } from '@/components/dashboard-nav';

const severityOrder: Record<Alert['severity'], number> = {
  High: 0,
  Medium: 1,
  Low: 2,
};

const initialAlerts: Alert[] = [
  {
    id: 'ALERT-001',
    village: 'Jalsuraksha',
    severity: 'High',
    status: 'Open',
    reports: 12,
    time: '5m ago',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ALERT-002',
    village: 'Pawanpur',
    severity: 'Medium',
    status: 'Investigating',
    reports: 7,
    time: '45m ago',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ALERT-003',
    village: 'Agnigiri',
    severity: 'High',
    status: 'Open',
    reports: 15,
    time: '1.2h ago',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ALERT-004',
    village: 'Jalsuraksha',
    severity: 'Low',
    status: 'Closed',
    reports: 5,
    time: '3h ago',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ALERT-005',
    village: 'Vidyutgram',
    severity: 'Medium',
    status: 'Investigating',
    reports: 8,
    time: '5h ago',
    createdAt: new Date().toISOString(),
  },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [isLoading, setIsLoading] = useState(false);
  const { reports } = useContext(ReportsContext);
  const { toast } = useToast();
  const { t } = useI18n();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [severityFilters, setSeverityFilters] = useState<string[]>([]);

  const handleGenerateAlerts = async () => {
    setIsLoading(true);
    try {
      const result: GenerateAlertsOutput = await generateAlerts({
        reports,
      });
      
      const newAlertsWithDate = result.alerts.map(a => ({...a, createdAt: new Date().toISOString()}))

      if (newAlertsWithDate.length > 0) {
        setAlerts((prevAlerts) => {
          const existingIds = new Set(prevAlerts.map((a) => a.id));
          const uniqueNewAlerts = newAlertsWithDate.filter(
            (newAlert) => !existingIds.has(newAlert.id)
          );

          if (uniqueNewAlerts.length === 0) return prevAlerts;

          const allAlerts = [...prevAlerts, ...uniqueNewAlerts];
          allAlerts.sort(
            (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
          );

          return allAlerts;
        });

        toast({
          title: 'Alerts Updated',
          description: `${newAlertsWithDate.length} new alerts have been created based on recent reports.`,
        });
      } else {
        toast({
          title: 'No New Alerts',
          description:
            'The AI analysis did not find any new high-risk situations requiring an alert.',
        });
      }
    } catch (error) {
      console.error('Alert generation failed:', error);
      toast({
        variant: 'destructive',
        title: 'Alert Generation Failed',
        description: 'Could not generate alerts. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAlerts = useMemo(() => {
    return alerts
      .filter((alert) =>
        alert.village.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(
        (alert) =>
          statusFilters.length === 0 || statusFilters.includes(alert.status)
      )
      .filter(
        (alert) =>
          severityFilters.length === 0 ||
          severityFilters.includes(alert.severity)
      );
  }, [alerts, searchTerm, statusFilters, severityFilters]);

  const toggleFilter = (
    list: string[],
    item: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const newList = list.includes(item)
      ? list.filter((i) => i !== item)
      : [...list, item];
    setter(newList);
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <DashboardNav />
      </Sidebar>
      <SidebarInset>
        <main className="min-h-screen flex flex-col">
          <AppHeader title={t('alerts')} />
          <div className="flex-1 space-y-4 p-4 md:p-8">
            <Card>
              <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="font-headline">{t('allAlerts')}</CardTitle>
                  <CardDescription>
                    {t('alertsDescription')}
                  </CardDescription>
                </div>
                <Button onClick={handleGenerateAlerts} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {t('generateNewAlerts')}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder={t('searchByVillage')}
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <ListFilter className="mr-2 h-4 w-4" />
                        {t('status')}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {['Open', 'Investigating', 'Closed'].map((status) => (
                        <DropdownMenuCheckboxItem
                          key={status}
                          checked={statusFilters.includes(status)}
                          onCheckedChange={() =>
                            toggleFilter(statusFilters, status, setStatusFilters)
                          }
                        >
                          {t(status.toLowerCase())}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <ListFilter className="mr-2 h-4 w-4" />
                        {t('severity')}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {['High', 'Medium', 'Low'].map((severity) => (
                        <DropdownMenuCheckboxItem
                          key={severity}
                          checked={severityFilters.includes(severity)}
                          onCheckedChange={() =>
                            toggleFilter(
                              severityFilters,
                              severity,
                              setSeverityFilters
                            )
                          }
                        >
                           {t(severity.toLowerCase())}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <AlertsTable alerts={filteredAlerts} />
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
