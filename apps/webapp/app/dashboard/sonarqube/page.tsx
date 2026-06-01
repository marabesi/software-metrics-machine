import { defaultFilters, parseDashboardFilters } from '@/components/filters/DashboardFilters';
import { sonarqubeAPI } from '@/server/api';
import { ensureArray } from '@/server/utils/chartData';
import SonarqubeTopMetricCard from '@/components/charts/sonarqube/SonarqubeTopMetricCard';
import SonarqubeComponentTreeTableCard from '@/components/charts/sonarqube/SonarqubeComponentTreeTableCard';
import SonarqubeMeasurementsCard from '@/components/charts/sonarqube/SonarqubeMeasurementsCard';
import SonarqubeStatCard from '@/components/charts/sonarqube/SonarqubeStatCard';
import { SonarqubeComponentChartData } from '@/components/charts/sonarqube/types';
import { buildSonarqubeApiParams } from '@/server/utils/apiParams';

type ResultWrapper<T> = {
  result: T;
};

function unwrapResult<T>(data: T | ResultWrapper<T>): T {
  if (typeof data === 'object' && data !== null && 'result' in data) {
    return data.result;
  }
  return data;
}

function metricValue(
  measures: Array<{ key?: string; metric?: string; name?: string; value?: string | number }> = [],
  metric: string,
): number {
  const measure = measures.find(
    (item) => item.key === metric || item.metric === metric || item.name === metric,
  );

  if (!measure) {
    return 0;
  }

  const numeric = Number(measure.value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

export default async function SonarqubePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseDashboardFilters((await searchParams) ?? {}, defaultFilters);
  let components: SonarqubeComponentChartData[] = [];
  let mainComponentMeasures: Array<{ key?: string; metric?: string; name?: string; value?: string | number }> = [];

  try {
    const apiParams = buildSonarqubeApiParams(filters);
    const tree = await sonarqubeAPI.componentTree(apiParams);
    const treeData = ensureArray<any>(unwrapResult(tree as any));

    // Assuming the first component in the tree is the main project component
    // for which we want to display top-level metrics
    if (treeData.length > 0) {
      mainComponentMeasures = treeData[0].measures || [];
    }

    components = treeData.map((component) => ({
      key: component.key || '',
      name: component.name || component.key || 'Unknown',
      complexity: metricValue(component.measures, 'complexity'),
      cognitiveComplexity: metricValue(component.measures, 'cognitive_complexity'),
      ncloc: metricValue(component.measures, 'ncloc'),
      coverage: metricValue(component.measures, 'coverage'),
      maintainabilityRating: metricValue(component.measures, 'sqale_rating'),
    }));
  } catch (error) {
    console.error('Error fetching sonarqube component tree:', error);
    components = [];
  }

  const reliabilityRating = metricValue(mainComponentMeasures, 'reliability_rating');
  const securityRating = metricValue(mainComponentMeasures, 'security_rating');
  const maintainabilityRating = metricValue(mainComponentMeasures, 'sqale_rating');
  const duplicationDensity = metricValue(mainComponentMeasures, 'duplicated_lines_density');

  const topEntries = filters.topEntries || 20;
  const topComplexity = [...components]
    .sort((a, b) => b.complexity - a.complexity)
    .slice(0, topEntries)
    .map((item) => ({ name: item.name, value: item.complexity, componentKey: item.key }));

  const topNcloc = [...components]
    .sort((a, b) => b.ncloc - a.ncloc)
    .slice(0, topEntries)
    .map((item) => ({ name: item.name, value: item.ncloc, componentKey: item.key }));

  const tableData = [...components]
    .sort((a, b) => b.complexity - a.complexity)
    .slice(0, topEntries);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <SonarqubeStatCard title="Reliability Rating" value={reliabilityRating} color="#22c55e" />
        <SonarqubeStatCard title="Security Rating" value={securityRating} color="#f97316" />
        <SonarqubeStatCard title="Maintainability Rating" value={maintainabilityRating} color="#0ea5e9" />
        <SonarqubeStatCard title="Duplication Density" value={duplicationDensity} color="#f43f5e" />
      </div>
      <SonarqubeMeasurementsCard filters={filters} />
      <div className="grid grid-cols-1 gap-6">
        <SonarqubeTopMetricCard
          title={`Top ${topEntries} by Complexity`}
          description="Highlights components with the highest cyclomatic complexity. Use this to prioritize simplification and refactoring."
          data={topComplexity}
          dataKeyLabel="Complexity"
          color="#ef4444"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <SonarqubeTopMetricCard
          title={`Top ${topEntries} by NLOC`}
          description="Shows the largest components by non-commented lines of code (NLOC). Larger components can carry higher maintenance risk."
          data={topNcloc}
          dataKeyLabel="NLOC"
          color="#3b82f6"
        />
      </div>

      <SonarqubeComponentTreeTableCard data={tableData} />
    </div>
  );
}
