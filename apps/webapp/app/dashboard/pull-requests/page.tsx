import PullRequestsSection from "@/components/dashboard/PullRequestsSection";
import { defaultFilters, parseDashboardFilters } from "@/components/filters/DashboardFilters";

export default async function PullRequestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  
  const filters = parseDashboardFilters(await searchParams ?? {}, defaultFilters);

  return <PullRequestsSection filters={filters} />;
}
