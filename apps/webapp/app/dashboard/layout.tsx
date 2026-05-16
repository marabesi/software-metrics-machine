import { FiltersProvider } from '@/components/filters/FiltersContext';
import { defaultFilters } from '@/components/filters/DashboardFilters';
import DrawerLayout from './drawer-layout';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <FiltersProvider initialFilters={defaultFilters}>
      <DrawerLayout>
        {children}
      </DrawerLayout>
    </FiltersProvider>
  );
}
