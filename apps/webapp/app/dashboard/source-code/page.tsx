import { defaultFilters, parseDashboardFilters } from "@/components/filters/DashboardFilters";
import { sourceCodeAPI } from '@/server/api';
import { buildSourceCodeApiParams } from '@/server/utils/apiParams';
import { ensureArray } from '@/server/utils/chartData';
import EntityChurnCard from '@/components/charts/source-code/EntityChurnCard';
import EntityEffortCard from '@/components/charts/source-code/EntityEffortCard';
import CodeChurnOverTimeCard from '@/components/charts/source-code/CodeChurnOverTimeCard';
import EntityOwnershipCard from '@/components/charts/source-code/EntityOwnershipCard';
import CodeCouplingCard from '@/components/charts/source-code/CodeCouplingCard';
import {
  CodeChurnData,
  CouplingData,
  EntityChurnData,
  EntityEffortData,
  EntityOwnershipData,
} from '@/components/charts/source-code/types';

type ResultWrapper<T> = {
  result: T;
};

function unwrapResult<T>(data: T | ResultWrapper<T>): T {
  if (typeof data === 'object' && data !== null && 'result' in data) {
    return data.result;
  }
  return data;
}

export default async function SourceCodePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseDashboardFilters(await searchParams ?? {}, defaultFilters);
  let entityChurn: EntityChurnData[] = [];
  let coupling: CouplingData[] = [];
  let entityEffort: EntityEffortData[] = [];
  let codeChurn: CodeChurnData[] = [];
  let entityOwnership: EntityOwnershipData[] = [];

  try {
    const apiParams = buildSourceCodeApiParams(filters);
    const [churn, couplingData, effort, churnOverTime, ownership] = await Promise.all([
      sourceCodeAPI.entityChurn(apiParams),
      sourceCodeAPI.coupling(apiParams),
      sourceCodeAPI.entityEffort(apiParams),
      sourceCodeAPI.codeChurn(apiParams),
      sourceCodeAPI.entityOwnership(apiParams),
    ]);
    // Handle both direct array responses and wrapped responses
    entityChurn = ensureArray<EntityChurnData>(unwrapResult(churn as EntityChurnData[] | ResultWrapper<EntityChurnData[]>));
    coupling = ensureArray<CouplingData>(unwrapResult(couplingData as CouplingData[] | ResultWrapper<CouplingData[]>));
    entityEffort = ensureArray<EntityEffortData>(unwrapResult(effort as EntityEffortData[] | ResultWrapper<EntityEffortData[]>));
    codeChurn = ensureArray<CodeChurnData>(unwrapResult(churnOverTime as CodeChurnData[] | ResultWrapper<CodeChurnData[]>));
    entityOwnership = ensureArray<EntityOwnershipData>(unwrapResult(ownership as EntityOwnershipData[] | ResultWrapper<EntityOwnershipData[]>));
  } catch (error) {
    console.error('Error fetching source code data:', error);
    // Set empty arrays on error
    entityChurn = [];
    coupling = [];
    entityEffort = [];
    codeChurn = [];
    entityOwnership = [];
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EntityChurnCard data={entityChurn} topEntries={filters.topEntries} />
        <EntityEffortCard data={entityEffort} topEntries={filters.topEntries} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CodeChurnOverTimeCard data={codeChurn} />
        <EntityOwnershipCard data={entityOwnership} />
      </div>

      <CodeCouplingCard data={coupling} />
    </div>
  );
}
