import type { SmmCommand } from './smm-command';
import { TimeZoneProvider } from '@smmachine/core/infrastructure/timezone-provider';
import { Logger } from '@smmachine/utils';
import {
  CommentAuthor,
  FirstCommentMetric,
  GithubPrsClient,
  GitlabMrClient,
  GitHubRateLimitManager,
  GitHubPullRequestsFetchRepository,
  MostCommentedPRData,
  PRFilters,
  PRsService,
  PullRequestFactory,
  PullRequestsRepository,
} from '@smmachine/core';

const logger = new Logger('PRsCommand');

function createPRsOrchestratorRead(command: SmmCommand): PullRequestsRepository {
  const config = command.getConfiguration();
  return PullRequestFactory.create(config);
}

function createPRsOrchestratorFetch(command: SmmCommand): GitHubPullRequestsFetchRepository {
  const config = command.getConfiguration();
  const [githubOwner, githubRepo] = config.githubRepository!.split('/');
  const isGitlab = config.gitProvider?.toLowerCase() === 'gitlab';

  const rateLimitManager = new GitHubRateLimitManager();
  const prsClient = isGitlab
    ? new GitlabMrClient(config.gitlabToken, config.githubRepository!)
    : new GithubPrsClient(config.githubToken!, githubOwner, githubRepo, rateLimitManager);

  return new GitHubPullRequestsFetchRepository(prsClient, config);
}

function createPRService(command: SmmCommand): PRsService {
  const config = command.getConfiguration();
  const prRepository = createPRsOrchestratorRead(command);
  return new PRsService(prRepository, new TimeZoneProvider(config.timezone));
}

function parseCsvList(value?: string): string[] {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function buildPRFilters(options: {
  startDate?: string;
  endDate?: string;
  excludeAuthors?: string;
  excludeCommenters?: string;
  authors?: string;
  labels?: string;
  state?: string;
  rawFilters?: string;
}): PRFilters {
  const filters: PRFilters = {
    startDate: options.startDate,
    endDate: options.endDate,
    excludeAuthors: parseCsvList(options.excludeAuthors),
    excludeCommenters: parseCsvList(options.excludeCommenters),
    authors: parseCsvList(options.authors),
    labels: parseCsvList(options.labels),
  };

  if (options.state) {
    filters.state = options.state as PRFilters['state'];
  }

  if (options.rawFilters) {
    const parts = options.rawFilters
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    for (const part of parts) {
      const eqIdx = part.indexOf('=');
      if (eqIdx === -1) continue;
      const key = part.slice(0, eqIdx).trim().toLowerCase();
      const value = part.slice(eqIdx + 1).trim();
      if (!value) continue;

      switch (key) {
        case 'status':
          filters.state = value as PRFilters['state'];
          break;
        case 'author':
        case 'authors':
          filters.authors = [...(filters.authors || []), ...parseCsvList(value)];
          break;
        case 'label':
        case 'labels':
          filters.labels = [...(filters.labels || []), ...parseCsvList(value)];
          break;
        case 'start_date':
        case 'start-date':
          filters.startDate = value;
          break;
        case 'end_date':
        case 'end-date':
          filters.endDate = value;
          break;
      }
    }
  }

  return filters;
}

/**
 * PRs Command Group
 *
 * Provides CLI commands for pull request operations matching Python CLI functionality.
 *
 * Commands:
 *   smm prs fetch       Fetch pull requests from GitHub
 *   smm prs summary     View PR summary statistics
 *   smm prs by-month    View PR metrics by month
 *   smm prs by-week     View PR metrics by week
 */
export function createPRsCommands(program: SmmCommand): void {
  const prsGroup = program.subcommand('prs').description('Pull request operations');

  /**
   * smm prs fetch [options]
   * Fetch pull requests from GitHub
   */
  prsGroup
    .subcommand('fetch')
    .description('Fetch pull requests from the configured Git provider')
    .option('--force', 'Force re-fetching PRs even if already fetched')
    .option(
      '--update',
      'Incrementally update PRs — fetch only newer items and merge with existing cache'
    )
    .option('--start-date <date>', 'Filter PRs created on or after this date (ISO 8601)')
    .option('--end-date <date>', 'Filter PRs created on or before this date (ISO 8601)')
    .actionWithSmm(async (options, command) => {
      try {
        logger.info('🔄 Fetching pull requests from the configured Git provider...');
        const orchestrator = createPRsOrchestratorFetch(command);
        await orchestrator.fetchPRs({
          startDate: options.startDate,
          endDate: options.endDate,
          forceRefresh: options.force,
          incrementalUpdate: options.update,
        });

        console.log('✅ Fetch data has been completed');
      } catch (error) {
        logger.error('Failed to fetch pull requests', error);
      }
    });

  prsGroup
    .subcommand('fetch-comments')
    .description('Fetch pull request comments from the configured Git provider')
    .option('--force', 'Force re-fetching PR comments even if already fetched')
    .option('--update', 'Incremental update: only fetch comments updated since last sync')
    .option('--start-date <date>', 'Filter PRs by creation date on or after this date (ISO 8601)')
    .option('--end-date <date>', 'Filter PRs by creation date on or before this date (ISO 8601)')
    .actionWithSmm(async (options, command) => {
      try {
        logger.info('🔄 Fetching pull request comments from the configured Git provider...');
        const orchestrator = createPRsOrchestratorRead(command);
        const prs = await orchestrator.loadPrsWithFilters({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        const orchestratorFetch = createPRsOrchestratorFetch(command);

        for (const pr of prs) {
          await orchestratorFetch.fetchPRComments(pr.number, {
            forceRefresh: options.force,
            incrementalUpdate: options.update,
          });
        }

        console.log('✅ Fetch PR comments data has been completed');
      } catch (error) {
        logger.error('Failed to fetch pull request comments', error);
      }
    });

  /**
   * smm prs summary [options]
   * View PR summary statistics
   */
  prsGroup
    .subcommand('summary')
    .description('View PR summary statistics')
    .option('--start-date <date>', 'Filter PRs created on or after this date')
    .option('--end-date <date>', 'Filter PRs created on or before this date')
    .option('--exclude-authors <authors>', 'Comma-separated PR authors to exclude')
    .option('--exclude-commenters <commenters>', 'Comma-separated PR commenters to exclude')
    .option('--authors <authors>', 'Comma-separated PR authors to include')
    .option('--labels <labels>', 'Comma-separated PR labels to filter by')
    .option(
      '--raw-filters <filters>',
      'Comma-separated raw filter string (e.g. status=draft,author=john)'
    )
    .option('--output <format>', 'Output format (text|json)', 'text')
    .actionWithSmm(async (options, command) => {
      try {
        console.log('📊 Generating PR summary...');
        const service = createPRService(command);
        const filters = buildPRFilters(options);
        const summary = await service.getMetrics(filters);

        if (options.output === 'json') {
          console.log(JSON.stringify(summary, null, 2));
        } else {
          console.log('\n=== PR Summary ===\n');
          console.log(`Total PRs: ${summary.totalPRs || 0}`);
          console.log(`Open PRs: ${summary.openPRs || 0}`);
          console.log(`Closed PRs: ${summary.closedPRs || 0}`);
          console.log(`Merged PRs: ${summary.mergedPRs || 0}`);
          console.log(`Average Comments: ${summary.averageComments || 'N/A'}`);

          // Fetch review metrics
          const commentsByAuthor = await service.getCommentsByAuthor(filters, 10);
          const firstCommentTime = await service.getFirstCommentTime(filters, 10);

          if (commentsByAuthor && commentsByAuthor.length > 0) {
            console.log('\nTop Commenters:\n');
            commentsByAuthor.forEach((commenter: CommentAuthor, index: number) => {
              console.log(`  ${index + 1}. ${commenter.author}: ${commenter.count} comments`);
            });
          }

          if (firstCommentTime && firstCommentTime.length > 0) {
            console.log('\nAverage Time to First Comment (by PR author):\n');
            firstCommentTime.forEach((metric: FirstCommentMetric, index: number) => {
              console.log(
                `  ${index + 1}. ${metric.author}: ${metric.avg_hours.toFixed(2)} hours (${metric.prs_with_comments} PRs)`
              );
            });
          }

          if (summary.most_commented_prs && summary.most_commented_prs.length > 0) {
            console.log('\nMost Commented Pull Requests:\n');
            summary.most_commented_prs.forEach((pr: MostCommentedPRData) => {
              console.log(
                `  - PR #${pr.pull_request_id}: ${pr.pull_request_title} (${pr.comments_count} comments) - ${pr.pull_request_url}`
              );
            });
          }
        }

        console.log('\n✅ Summary generated');
      } catch (error) {
        logger.error('Failed to generate PR summary', error);
        process.exit(1);
      }
    });

  /**
   * smm prs by-month [options]
   * View PR metrics grouped by month
   */
  prsGroup
    .subcommand('by-month')
    .description('View PR metrics grouped by month')
    .option('--start-date <date>', 'Filter PRs created on or after this date')
    .option('--end-date <date>', 'Filter PRs created on or before this date')
    .option('--exclude-authors <authors>', 'Comma-separated PR authors to exclude')
    .option('--exclude-commenters <commenters>', 'Comma-separated PR commenters to exclude')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .actionWithSmm(async (options, command) => {
      try {
        console.log('📊 Analyzing PRs by month...');
        const service = createPRService(command);
        const metrics = await service.getMetricsByMonth(buildPRFilters(options));

        if (options.output === 'json') {
          console.log(JSON.stringify(metrics, null, 2));
        } else {
          console.log('\n=== PRs by Month ===\n');
          console.log(JSON.stringify(metrics, null, 2));
        }

        console.log('\n✅ Analysis completed');
      } catch (error) {
        logger.error('Failed to analyze PRs by month', error);
        process.exit(1);
      }
    });

  /**
   * smm prs by-week [options]
   * View PR metrics grouped by week
   */
  prsGroup
    .subcommand('by-week')
    .description('View PR metrics grouped by week')
    .option('--start-date <date>', 'Filter PRs created on or after this date')
    .option('--end-date <date>', 'Filter PRs created on or before this date')
    .option('--exclude-authors <authors>', 'Comma-separated PR authors to exclude')
    .option('--exclude-commenters <commenters>', 'Comma-separated PR commenters to exclude')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .actionWithSmm(async (options, command) => {
      try {
        console.log('📊 Analyzing PRs by week...');
        const service = createPRService(command);
        const metrics = await service.getMetricsByWeek(buildPRFilters(options));

        if (options.output === 'json') {
          console.log(JSON.stringify(metrics, null, 2));
        } else {
          console.log('\n=== PRs by Week ===\n');
          console.log(JSON.stringify(metrics, null, 2));
        }

        console.log('\n✅ Analysis completed');
      } catch (error) {
        logger.error('Failed to analyze PRs by week', error);
        process.exit(1);
      }
    });

  /**
   * smm prs through-time [options]
   * View PRs opened and closed through time
   */
  prsGroup
    .subcommand('through-time')
    .description('View PRs opened and closed through time (daily/weekly/monthly)')
    .option('--start-date <date>', 'Filter PRs created on or after this date')
    .option('--end-date <date>', 'Filter PRs created on or before this date')
    .option('--exclude-authors <authors>', 'Comma-separated PR authors to exclude')
    .option('--exclude-commenters <commenters>', 'Comma-separated PR commenters to exclude')
    .option('--authors <authors>', 'Comma-separated PR authors to include')
    .option('--labels <labels>', 'Comma-separated PR labels to filter by')
    .option('--aggregate-by <period>', 'Aggregation period: day, week, or month (default: week)')
    .option('--raw-filters <filters>', 'Comma-separated raw filter string')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .actionWithSmm(async (options, command) => {
      try {
        console.log('📊 Analyzing PRs through time...');
        const service = createPRService(command);
        const filters = buildPRFilters(options);
        const rows = await service.getThroughTime(filters, options.aggregateBy);

        if (options.output === 'json') {
          console.log(JSON.stringify(rows, null, 2));
        } else {
          console.log('\n=== PRs Through Time ===\n');
          for (const row of rows) {
            console.log(`${row.date} | ${row.kind}: ${row.count}`);
          }
        }

        console.log('\n✅ Analysis completed');
      } catch (error) {
        logger.error('Failed to analyze PRs through time', error);
        process.exit(1);
      }
    });

  /**
   * smm prs by-author [options]
   * View PRs grouped by author
   */
  prsGroup
    .subcommand('by-author')
    .description('View PRs grouped by author')
    .option('--start-date <date>', 'Filter PRs created on or after this date')
    .option('--end-date <date>', 'Filter PRs created on or before this date')
    .option('--exclude-authors <authors>', 'Comma-separated PR authors to exclude')
    .option('--exclude-commenters <commenters>', 'Comma-separated PR commenters to exclude')
    .option('--authors <authors>', 'Comma-separated PR authors to include')
    .option('--labels <labels>', 'Comma-separated PR labels to filter by')
    .option('--top <number>', 'Show top N authors', '10')
    .option('--raw-filters <filters>', 'Comma-separated raw filter string')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .actionWithSmm(async (options, command) => {
      try {
        console.log('📊 Analyzing PRs by author...');
        const service = createPRService(command);
        const filters = buildPRFilters(options);
        const authors = await service.getByAuthor(filters, Number(options.top));

        if (options.output === 'json') {
          console.log(JSON.stringify(authors, null, 2));
        } else {
          console.log('\n=== PRs by Author ===\n');
          for (const author of authors) {
            console.log(`${author.author}: ${author.count} PRs`);
          }
        }

        console.log('\n✅ Analysis completed');
      } catch (error) {
        logger.error('Failed to analyze PRs by author', error);
        process.exit(1);
      }
    });

  /**
   * smm prs average-review-time [options]
   * View average review time by author
   */
  prsGroup
    .subcommand('average-review-time')
    .description('View average review time (days) by author')
    .option('--start-date <date>', 'Filter PRs created on or after this date')
    .option('--end-date <date>', 'Filter PRs created on or before this date')
    .option('--exclude-authors <authors>', 'Comma-separated PR authors to exclude')
    .option('--exclude-commenters <commenters>', 'Comma-separated PR commenters to exclude')
    .option('--authors <authors>', 'Comma-separated PR authors to include')
    .option('--labels <labels>', 'Comma-separated PR labels to filter by')
    .option('--top <number>', 'Show top N authors', '10')
    .option('--raw-filters <filters>', 'Comma-separated raw filter string')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .actionWithSmm(async (options, command) => {
      try {
        console.log('📊 Calculating average review time...');
        const service = createPRService(command);
        const filters = buildPRFilters(options);
        const reviews = await service.getAverageReviewTime(filters, Number(options.top));

        if (options.output === 'json') {
          console.log(JSON.stringify(reviews, null, 2));
        } else {
          console.log('\n=== Average Review Time by Author ===\n');
          for (const review of reviews) {
            console.log(`${review.author}: ${review.avg_days.toFixed(2)} days`);
          }
        }

        console.log('\n✅ Analysis completed');
      } catch (error) {
        logger.error('Failed to calculate average review time', error);
        process.exit(1);
      }
    });

  /**
   * smm prs average-open [options]
   * View average PR open time by period
   */
  prsGroup
    .subcommand('average-open')
    .description('View average PR open time (days) aggregated by day/week/month')
    .option('--start-date <date>', 'Filter PRs created on or after this date')
    .option('--end-date <date>', 'Filter PRs created on or before this date')
    .option('--exclude-authors <authors>', 'Comma-separated PR authors to exclude')
    .option('--exclude-commenters <commenters>', 'Comma-separated PR commenters to exclude')
    .option('--authors <authors>', 'Comma-separated PR authors to include')
    .option('--labels <labels>', 'Comma-separated PR labels to filter by')
    .option('--aggregate-by <period>', 'Aggregation period: day, week, or month (default: week)')
    .option('--raw-filters <filters>', 'Comma-separated raw filter string')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .actionWithSmm(async (options, command) => {
      try {
        console.log('📊 Calculating average PR open time...');
        const service = createPRService(command);
        const filters = buildPRFilters(options);
        const periods = await service.getAverageOpenBy(filters, options.aggregateBy);

        if (options.output === 'json') {
          console.log(JSON.stringify(periods, null, 2));
        } else {
          console.log('\n=== Average PR Open Time ===\n');
          for (const period of periods) {
            console.log(`${period.period}: ${period.avg_days.toFixed(2)} days`);
          }
        }

        console.log('\n✅ Analysis completed');
      } catch (error) {
        logger.error('Failed to calculate average PR open time', error);
        process.exit(1);
      }
    });

  /**
   * smm prs average-comments [options]
   * View average comments per PR
   */
  prsGroup
    .subcommand('average-comments')
    .description('View average number of comments per PR')
    .option('--start-date <date>', 'Filter PRs created on or after this date')
    .option('--end-date <date>', 'Filter PRs created on or before this date')
    .option('--exclude-authors <authors>', 'Comma-separated PR authors to exclude')
    .option('--exclude-commenters <commenters>', 'Comma-separated PR commenters to exclude')
    .option('--authors <authors>', 'Comma-separated PR authors to include')
    .option('--labels <labels>', 'Comma-separated PR labels to filter by')
    .option(
      '--aggregate-by <period>',
      'Aggregation period: week or month. Shows per-period averages.'
    )
    .option('--raw-filters <filters>', 'Comma-separated raw filter string')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .actionWithSmm(async (options, command) => {
      try {
        console.log('📊 Calculating average comments per PR...');
        const service = createPRService(command);
        const filters = buildPRFilters(options);

        if (options.aggregateBy) {
          const mode = options.aggregateBy.toLowerCase();
          const timeframes =
            mode === 'month'
              ? await service.getMetricsByMonth(filters)
              : await service.getMetricsByWeek(filters);

          if (options.output === 'json') {
            console.log(JSON.stringify(timeframes, null, 2));
          } else {
            console.log(`\n=== Average Comments per PR by ${mode} ===\n`);
            for (const tf of timeframes) {
              console.log(`${tf.period}: ${tf.averageComments} avg comments (${tf.count} PRs)`);
            }
          }
        } else {
          const metrics = await service.getMetrics(filters);

          if (options.output === 'json') {
            console.log(JSON.stringify({ avg_comments: metrics.averageComments }, null, 2));
          } else {
            console.log(`\n=== Average Comments per PR ===\n`);
            console.log(`Average Comments: ${metrics.averageComments}`);
          }
        }

        console.log('\n✅ Analysis completed');
      } catch (error) {
        logger.error('Failed to calculate average comments', error);
        process.exit(1);
      }
    });
}
