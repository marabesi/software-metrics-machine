import { defaultFilters, parseDashboardFilters } from "@/components/filters/DashboardFilters";
import { sourceCodeAPI } from '@/server/api';
import { configurationAPI } from '@/server/api/configuration';
import { buildSourceCodeApiParams } from '@/server/utils/apiParams';
import { ensureArray } from '@/server/utils/chartData';
import EntityChurnCard from '@/components/charts/source-code/EntityChurnCard';
import EntityEffortCard from '@/components/charts/source-code/EntityEffortCard';
import CodeChurnOverTimeCard from '@/components/charts/source-code/CodeChurnOverTimeCard';
import EntityOwnershipCard from '@/components/charts/source-code/EntityOwnershipCard';
import CodeCouplingCard from '@/components/charts/source-code/CodeCouplingCard';
import EntityEffortTreemap from '@/components/entity-effort-treemap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CodeChurnData,
  CouplingData,
  EntityChurnData,
  EntityEffortData,
  EntityOwnershipData,
} from '@/components/charts/source-code/types';
import { LatestPairedCommitsCard } from "@/components/charts/source-code/LatestPairedCommitsCard";

type ResultWrapper<T> = {
  result: T;
};

type PairingIndexResponse = {
  pairing_index_percentage: number;
  total_analyzed_commits: number;
  paired_commits: number;
  top_pairs?: Array<{ author: string; co_author: string; paired_commits: number }>;
  latest_paired_commits?: Array<{
    hash: string;
    author: string;
    co_authors: string[];
    timestamp: string;
    subject: string;
  }>;
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
  let topPairings: Array<{ author: string; co_author: string; paired_commits: number }> = [];
  let latestPairedCommits: Array<{
    hash: string;
    author: string;
    co_authors: string[];
    timestamp: string;
    subject: string;
  }> = [];

  try {
    const apiParams = buildSourceCodeApiParams(filters);
    const [churn, couplingData, effort, churnOverTime, ownership, pairing, configResponse] = await Promise.all([
      sourceCodeAPI.entityChurn(apiParams),
      sourceCodeAPI.coupling(apiParams),
      sourceCodeAPI.entityEffort(apiParams),
      sourceCodeAPI.codeChurn(apiParams),
      sourceCodeAPI.entityOwnership(apiParams),
      sourceCodeAPI.pairingIndex(apiParams),
      configurationAPI.getConfiguration(),
    ]);
    // Handle both direct array responses and wrapped responses
    entityChurn = ensureArray<EntityChurnData>(unwrapResult(churn as EntityChurnData[] | ResultWrapper<EntityChurnData[]>));
    coupling = ensureArray<CouplingData>(unwrapResult(couplingData as CouplingData[] | ResultWrapper<CouplingData[]>));
    entityEffort = ensureArray<EntityEffortData>(unwrapResult(effort as EntityEffortData[] | ResultWrapper<EntityEffortData[]>));
    codeChurn = ensureArray<CodeChurnData>(unwrapResult(churnOverTime as CodeChurnData[] | ResultWrapper<CodeChurnData[]>));
    entityOwnership = ensureArray<EntityOwnershipData>(unwrapResult(ownership as EntityOwnershipData[] | ResultWrapper<EntityOwnershipData[]>));
    const pairingData = unwrapResult(pairing as PairingIndexResponse | ResultWrapper<PairingIndexResponse>);
    topPairings = Array.isArray(pairingData?.top_pairs) ? pairingData.top_pairs.slice(0, 10) : [];
    latestPairedCommits = Array.isArray(pairingData?.latest_paired_commits)
      ? pairingData.latest_paired_commits.slice(0, 20)
      : [];
  } catch (error) {
    console.error('Error fetching source code data:', error);
    // Set empty arrays on error
    entityChurn = [];
    coupling = [];
    entityEffort = [];
    codeChurn = [];
    entityOwnership = [];
    topPairings = [];
    latestPairedCommits = [];
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <EntityChurnCard data={entityChurn} topEntries={filters.topEntries} />
      </div>
      <div className="grid grid-cols-1 gap-6">
        <EntityEffortCard data={entityEffort} topEntries={filters.topEntries} />
        <EntityEffortTreemap data={entityEffort} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <CodeChurnOverTimeCard data={codeChurn} />
      </div>
      <div className="grid grid-cols-1 gap-6">
        <EntityOwnershipCard data={entityOwnership} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Who Paired The Most With Whom</CardTitle>
            <p className="mt-2 text-sm text-gray-600">
              Ranked by number of paired commits between each author pair.
            </p>
          </CardHeader>
          <CardContent>
            {topPairings.length === 0 ? (
              <p className="text-sm text-gray-500">No paired commits found for the selected filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Pair</th>
                      <th className="text-right p-2">Paired Commits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPairings.map((pair) => (
                      <tr key={`${pair.author}-${pair.co_author}`} className="border-b hover:bg-gray-50">
                        <td className="p-2">{pair.author} + {pair.co_author}</td>
                        <td className="p-2 text-right">
                          <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">
                            {pair.paired_commits}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <LatestPairedCommitsCard data={latestPairedCommits} />
      </div>

      <CodeCouplingCard data={coupling} />
    </div>
  );
}
