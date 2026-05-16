import SourceCodeSection from "@/components/dashboard/SourceCodeSection";
import { defaultFilters, parseDashboardFilters } from "@/components/filters/DashboardFilters";

export default async function SourceCodePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseDashboardFilters(await searchParams ?? {}, defaultFilters);

  return <SourceCodeSection filters={filters} />;
}
