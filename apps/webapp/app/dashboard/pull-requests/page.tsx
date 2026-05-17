import { defaultFilters, parseDashboardFilters } from "@/components/filters/DashboardFilters";
import { pullRequestAPI } from '@/server/api';
import { buildPullRequestApiParams } from '@/server/utils/apiParams';
import { ensureArray } from '@/server/utils/chartData';
import PRsByAuthorCard from '@/components/charts/pull-requests/PRsByAuthorCard';
import AverageReviewTimeCard from '@/components/charts/pull-requests/AverageReviewTimeCard';
import OpenPRsThroughTimeCard from '@/components/charts/pull-requests/OpenPRsThroughTimeCard';
import TopThemesCard from '@/components/charts/pull-requests/TopThemesCard';
import AverageDaysPRsRemainOpenCard from '@/components/charts/pull-requests/AverageDaysPRsRemainOpenCard';
import PRStatisticsCard from '@/components/charts/pull-requests/PRStatisticsCard';
import {
  AvgCommentsData,
  AvgOpenByData,
  AvgReviewTimeData,
  ByAuthorData,
  OpenThroughTimeData,
  OpenThroughTimeResponseItem,
  SummaryData,
} from '@/components/charts/pull-requests/types';

type ResultWrapper<T> = {
  result: T;
};

function unwrapResult<T>(data: T | ResultWrapper<T>): T {
  if (typeof data === 'object' && data !== null && 'result' in data) {
    return data.result;
  }
  return data;
}

export default async function PullRequestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  
  const filters = parseDashboardFilters(await searchParams ?? {}, defaultFilters);
  let byAuthor: ByAuthorData[] = [];
  let avgReviewTime: AvgReviewTimeData[] = [];
  let openThroughTime: OpenThroughTimeData[] = [];
  let avgOpenBy: AvgOpenByData[] = [];
  let avgComments: AvgCommentsData | null = null;
  let summary: SummaryData | null = null;
  let topThemes: string[] = [];

  try {
    const apiParams = buildPullRequestApiParams(filters);
    const [author, review, open, openBy, comments, summaryData] = await Promise.all([
      pullRequestAPI.byAuthor(apiParams),
      pullRequestAPI.averageReviewTime(apiParams),
      pullRequestAPI.openThroughTime(apiParams),
      pullRequestAPI.averageOpenBy(apiParams),
      pullRequestAPI.averageComments(apiParams),
      pullRequestAPI.summary(apiParams),
    ]);
    // Handle both direct array responses and wrapped responses
    byAuthor = ensureArray<ByAuthorData>(unwrapResult(author as ByAuthorData[] | ResultWrapper<ByAuthorData[]>));
    avgReviewTime = ensureArray<AvgReviewTimeData>(unwrapResult(review as AvgReviewTimeData[] | ResultWrapper<AvgReviewTimeData[]>));
    let openData = ensureArray<OpenThroughTimeResponseItem>(
      unwrapResult(open as OpenThroughTimeResponseItem[] | ResultWrapper<OpenThroughTimeResponseItem[]>)
    );
    // Transform data: group by date and pivot kind into opened/closed
    if (openData.length > 0) {
      const grouped = openData.reduce((acc: OpenThroughTimeData[], item: OpenThroughTimeResponseItem) => {
        const existing = acc.find((d: OpenThroughTimeData) => d.date === item.date);
        if (existing) {
          if (item.kind === 'Opened') {
            existing.opened = item.count || 0;
          } else if (item.kind === 'Closed') {
            existing.closed = item.count || 0;
          }
        } else {
          acc.push({
            date: item.date,
            opened: item.kind === 'Opened' ? (item.count || 0) : 0,
            closed: item.kind === 'Closed' ? (item.count || 0) : 0,
          });
        }
        return acc;
      }, []);
      openThroughTime = grouped;
    } else {
      openThroughTime = openData.map((item): OpenThroughTimeData => ({
        date: item.date,
        opened: item.open_prs || 0,
        closed: 0,
      }));
    }
    avgOpenBy = ensureArray<AvgOpenByData>(unwrapResult(openBy as AvgOpenByData[] | ResultWrapper<AvgOpenByData[]>));
    avgComments = unwrapResult(comments as AvgCommentsData | ResultWrapper<AvgCommentsData>);
    const summaryResult = unwrapResult(summaryData as SummaryData | ResultWrapper<SummaryData>);
    summary = summaryResult;
    topThemes = Array.isArray(summaryResult?.top_themes)
      ? summaryResult.top_themes.filter((theme): theme is string => typeof theme === 'string').slice(0, 10)
      : [];
  } catch (error) {
    console.error('Error fetching PR data:', error);
    // Set empty arrays on error
    byAuthor = [];
    avgReviewTime = [];
    openThroughTime = [];
    avgOpenBy = [];
    avgComments = null;
    summary = null;
    topThemes = [];
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <AverageReviewTimeCard data={avgReviewTime} />
      </div>
      <div className="grid grid-cols-1 gap-6">
        <PRsByAuthorCard data={byAuthor} />
      </div>

      <OpenPRsThroughTimeCard data={openThroughTime} />

      <TopThemesCard data={topThemes} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AverageDaysPRsRemainOpenCard data={avgOpenBy} />
        <PRStatisticsCard summary={summary} avgComments={avgComments} />
      </div>
    </div>
  );
}
