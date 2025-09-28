
'use client';

import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { CampaignCard } from '@/components/campaign-card';
import { CampaignDetailsDialog } from '@/components/campaign-details-dialog';
import { initialCampaigns, Campaign } from '@/lib/campaigns-data';
import { CreateCampaignDialog } from '@/components/create-campaign-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import { useI18n } from '@/context/I18nContext';
import { DashboardNav } from '@/components/dashboard-nav';

const languages = ['All', 'English', 'Assamese', 'Bengali', 'Bodo', 'Manipuri', 'Khasi'];

export default function AwarenessPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [languageFilter, setLanguageFilter] = useState('All');
  const { t } = useI18n();

  const handleAddCampaign = (newCampaignData: Omit<Campaign, 'id' | 'imageId'>) => {
    const newCampaign: Campaign = {
      ...newCampaignData,
      id: `campaign-${campaigns.length + 1}`,
      imageId: 'safe-drinking-water', // Placeholder image
    };
    setCampaigns(prev => [newCampaign, ...prev]);
  };

  const filteredCampaigns = campaigns.filter(campaign => 
    languageFilter === 'All' || campaign.language.toLowerCase() === languageFilter.toLowerCase()
  );

  return (
    <SidebarProvider>
      <Sidebar>
        <DashboardNav />
      </Sidebar>
      <SidebarInset>
        <main className="min-h-screen flex flex-col">
          <AppHeader title={t('awareness')} />
          <div className="flex-1 space-y-4 p-4 md:p-8">
            <Card>
              <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="font-headline">
                    {t('communityCampaigns')}
                  </CardTitle>
                  <CardDescription>
                    {t('communityCampaignsDescription')}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        {languageFilter}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {languages.map(lang => (
                        <DropdownMenuItem key={lang} onSelect={() => setLanguageFilter(lang)}>
                          {lang}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button onClick={() => setCreateDialogOpen(true)}>{t('createNewCampaign')}</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredCampaigns.map((campaign) => (
                    <CampaignCard
                      key={campaign.id}
                      campaign={campaign}
                      onViewDetails={() => setSelectedCampaign(campaign)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <CampaignDetailsDialog
          campaign={selectedCampaign}
          onOpenChange={(isOpen) => !isOpen && setSelectedCampaign(null)}
        />
        <CreateCampaignDialog
          isOpen={isCreateDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onCampaignCreate={handleAddCampaign}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
