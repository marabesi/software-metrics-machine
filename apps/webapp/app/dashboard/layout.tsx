import AppProviders from '@/components/providers/AppProviders';
import DashboardFrame from './dashboard-frame';
import { Suspense } from 'react';
import { loadAppProviderData } from '@/server/app-provider-data';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const providerData = await loadAppProviderData();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AppProviders {...providerData} requireConfiguration>
        <DashboardFrame>
          {children}
        </DashboardFrame>
      </AppProviders>
    </Suspense>
  );
}
