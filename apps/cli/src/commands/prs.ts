import {Command} from 'commander';
import {Configuration} from '@smmachine/core/infrastructure/configuration';
import {Logger} from '@smmachine/utils';
import {CommentAuthor, FirstCommentMetric, GithubPrsClient, GitHubPullRequestsFetchRepository, MostCommentedPRData, PRsService, PullRequestFactory, PullRequestsRepository} from "@smmachine/core";

const logger = new Logger('PRsCommand');

function createPRsOrchestratorRead(): PullRequestsRepository {
  const config = new Configuration(process.env);
  return PullRequestFactory.create(config);
}

function createPRsOrchestratorFetch(): GitHubPullRequestsFetchRepository {
  const config = new Configuration(process.env);
  const [githubOwner, githubRepo] = config.githubRepository!.split('/');
  const githubToken = config.githubToken!;

  const githubPrsClient = new GithubPrsClient(githubToken, githubOwner, githubRepo);
  return new GitHubPullRequestsFetchRepository(githubPrsClient, config);
}

function createPRService(): PRsService {
  const prRepository = createPRsOrchestratorRead();
  return new PRsService(prRepository);
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
export function createPRsCommands(program: Command): void {
  const prsGroup = program.command('prs').description('Pull request operations');

  /**
   * smm prs fetch [options]
   * Fetch pull requests from GitHub
   */
  prsGroup
    .command('fetch')
    .description('Fetch pull requests from GitHub')
    .option('--force', 'Force re-fetching PRs even if already fetched')
    .option('--update', 'Incrementally update PRs — fetch only newer items and merge with existing cache')
    .option('--start-date <date>', 'Filter PRs created on or after this date (ISO 8601)')
    .option('--end-date <date>', 'Filter PRs created on or before this date (ISO 8601)')
    .action(async (options) => {
      try {
        logger.info('🔄 Fetching pull requests from GitHub...');
        const orchestrator = createPRsOrchestratorFetch();
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
    .command('fetch-comments')
    .description('Fetch pull request comments from GitHub')
    .option('--force', 'Force re-fetching PR comments even if already fetched')
    .option('--update', 'Incremental update: only fetch comments updated since last sync')
    .option('--start-date <date>', 'Filter PRs by creation date on or after this date (ISO 8601)')
    .option('--end-date <date>', 'Filter PRs by creation date on or before this date (ISO 8601)')
    .action(async (options) => {
      try {
        logger.info('🔄 Fetching pull request comments from GitHub...');
        const orchestrator = createPRsOrchestratorRead();
        const prs = await orchestrator.loadPrsWithFilters({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        const orchestratorFetch = createPRsOrchestratorFetch();

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
    .command('summary')
    .description('View PR summary statistics')
    .option('--start-date <date>', 'Filter PRs created on or after this date')
    .option('--end-date <date>', 'Filter PRs created on or before this date')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        console.log('📊 Generating PR summary...');

        const service = createPRService();
        const summary = await service.getMetrics({
          startDate: options.startDate,
          endDate: options.endDate,
        });

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
          const commentsByAuthor = await service.getCommentsByAuthor(
            { startDate: options.startDate, endDate: options.endDate },
            10
          );
          const firstCommentTime = await service.getFirstCommentTime(
            { startDate: options.startDate, endDate: options.endDate },
            10
          );

          if (commentsByAuthor && commentsByAuthor.length > 0) {
            console.log('\nTop Commenters:\n');
            commentsByAuthor.forEach((commenter: CommentAuthor, index: number) => {
              console.log(`  ${index + 1}. ${commenter.author}: ${commenter.count} comments`);
            });
          }

          if (firstCommentTime && firstCommentTime.length > 0) {
            console.log('\nAverage Time to First Comment (by PR author):\n');
            firstCommentTime.forEach((metric: FirstCommentMetric, index: number) => {
              console.log(`  ${index + 1}. ${metric.author}: ${metric.avg_hours.toFixed(2)} hours (${metric.prs_with_comments} PRs)`);
            });
          }

          if (summary.most_commented_prs && summary.most_commented_prs.length > 0) {
            console.log('\nMost Commented Pull Requests:\n');
            summary.most_commented_prs.forEach((pr: MostCommentedPRData) => {
              console.log(`  - PR #${pr.pull_request_id}: ${pr.pull_request_title} (${pr.comments_count} comments) - ${pr.pull_request_url}`);
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
    .command('by-month')
    .description('View PR metrics grouped by month')
    .option('--start-date <date>', 'Filter PRs created on or after this date')
    .option('--end-date <date>', 'Filter PRs created on or before this date')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        console.log('📊 Analyzing PRs by month...');

        const service = createPRService();
        const metrics = await service.getMetricsByMonth({
          startDate: options.startDate,
          endDate: options.endDate,
        });

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
    .command('by-week')
    .description('View PR metrics grouped by week')
    .option('--start-date <date>', 'Filter PRs created on or after this date')
    .option('--end-date <date>', 'Filter PRs created on or before this date')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        console.log('📊 Analyzing PRs by week...');

        const service = createPRService();
        const metrics = await service.getMetricsByWeek({
          startDate: options.startDate,
          endDate: options.endDate,
        });

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
}
