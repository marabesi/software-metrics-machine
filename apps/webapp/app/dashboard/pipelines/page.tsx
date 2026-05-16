import PipelineSection from "@/components/dashboard/PipelineSection";
import { defaultFilters, parseDashboardFilters } from "@/components/filters/DashboardFilters";

export default async function PipelinesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseDashboardFilters(await searchParams ?? {}, defaultFilters);

  return <PipelineSection filters={filters} />;
}
