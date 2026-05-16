import InsightsSection from "@/components/dashboard/InsightsSection";
import { defaultFilters, parseDashboardFilters } from "@/components/filters/DashboardFilters";

export default async function InsightsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseDashboardFilters(await searchParams ?? {}, defaultFilters);

  return <InsightsSection filters={filters} />;
}
