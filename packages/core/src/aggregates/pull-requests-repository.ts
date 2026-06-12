import { FileSystemRepository } from '../infrastructure/repository';
import { PRDetails, PRFilters } from '../domain/prs/pr-types';
import {
  PullRequestCommentJsonResponse,
  PullRequestJsonResponse,
  PullRequestLabelJsonResponse,
} from '../providers/github/github-response-types';

export interface IReadPullRequestsRepository {
  loadPrsWithFilters(filters?: PRFilters): Promise<PRDetails[]>;
}

export class PullRequestsRepository implements IReadPullRequestsRepository {
  constructor(
    private cache: FileSystemRepository<PullRequestJsonResponse>,
    private pullRequestCommentsStoreFile: FileSystemRepository<PullRequestCommentJsonResponse>
  ) {}

  async loadPrsWithFilters(filters?: PRFilters): Promise<PRDetails[]> {
    const fromCache = await this.cache.loadAll();
    const allComments = await this.pullRequestCommentsStoreFile.loadAll();

    let rawPrs = fromCache;

    if (filters) {
      const start = filters.startDate ? new Date(filters.startDate) : null;
      const end = filters.endDate ? new Date(filters.endDate) : null;
      const authorSet = filters.authors?.length
        ? new Set(filters.authors.map((a) => a.toLowerCase()))
        : null;
      const excludeAuthorSet = filters.excludeAuthors?.length
        ? new Set(filters.excludeAuthors.map((a) => a.toLowerCase()))
        : null;
      const labelSet = filters.labels?.length
        ? new Set(filters.labels.map((l) => l.toLowerCase()))
        : null;

      rawPrs = rawPrs.filter((pr) => {
        if (start || end) {
          const created = new Date(pr.created_at);
          if (start && created < start) return false;
          if (end && created > end) return false;
        }

        if (authorSet && !authorSet.has((pr.user?.login || 'unknown').toLowerCase())) {
          return false;
        }

        if (excludeAuthorSet && excludeAuthorSet.has((pr.user?.login || 'unknown').toLowerCase())) {
          return false;
        }

        if (labelSet && !(pr.labels || []).some((l) => labelSet.has(l.name.toLowerCase()))) {
          return false;
        }

        if (filters.state) {
          if (filters.state === 'merged' && !pr.merged_at) return false;
          if (filters.state === 'closed' && (!pr.closed_at || pr.merged_at)) return false;
          if (filters.state === 'open' && (pr.closed_at || pr.merged_at)) return false;
        }

        return true;
      });
    }

    const excludeCommenterSet = filters?.excludeCommenters?.length
      ? new Set(filters.excludeCommenters.map((commenter) => commenter.toLowerCase()))
      : null;

    return rawPrs.map((pr: PullRequestJsonResponse) => {
      const commentsForPr = allComments
        .filter((comment) => comment.pull_request_url.includes(`/pulls/${pr.number}`))
        .filter(
          (comment) =>
            !excludeCommenterSet ||
            !excludeCommenterSet.has((comment.user?.login || 'unknown').toLowerCase())
        );

      return {
        id: Number(pr.id),
        number: Number(pr.number),
        title: pr.title,
        description: pr.body || '',
        createdAt: pr.created_at,
        updatedAt: pr.updated_at,
        mergedAt: pr.merged_at || undefined,
        closedAt: pr.closed_at || undefined,
        author: {
          login: pr.user?.login || 'unknown',
          id: pr.user?.id || 0,
        },
        labels: (pr.labels || []).map((label: PullRequestLabelJsonResponse) => ({ ...label })),
        state: pr.state as PRDetails['state'],
        url: pr.html_url || '',
        totalComments: commentsForPr.length,
        comments: commentsForPr.map((comment) => ({
          url: comment.url,
          body: comment.body,
          pull_request_review_id: comment.pull_request_review_id || 0,
          id: comment.id,
          createdAt: comment.created_at,
          author: {
            login: comment.user?.login || 'unknown',
            id: comment.user?.id || 0,
          },
          reactions: {
            url: comment.reactions?.url || '',
            total_count: comment.reactions?.total_count || 0,
            '+1': comment.reactions?.['+1'] || 0,
            '-1': comment.reactions?.['-1'] || 0,
            laugh: comment.reactions?.laugh || 0,
            hooray: comment.reactions?.hooray || 0,
            confused: comment.reactions?.confused || 0,
            heart: comment.reactions?.heart || 0,
            rocket: comment.reactions?.rocket || 0,
            eyes: comment.reactions?.eyes || 0,
          },
        })),
      };
    });
  }
}
