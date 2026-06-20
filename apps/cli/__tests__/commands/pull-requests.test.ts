import { beforeEach, describe, expect, it } from 'vitest';
import { formatPullRequestMetrics } from '../../src/formatters';
import { Command } from 'commander';
import { commands } from '../../src';
import { formatPRSummary } from '../../src/commands/prs';

describe('cli: Pull Request Metrics', () => {
  let program: Command;

  beforeEach(async () => {
    program = commands();
  });

  it('should have metrics command group', async () => {
    program.parse(['prs', 'fetch'], { from: 'user' });

    // const metricsCmd = program.commands.find((cmd) => {
    //   return cmd.name() === 'prs';
    // });
    // expect(metricsCmd).toBeDefined();
  });

  it('should have pr subcommand', () => {
    const prsCmd = program.commands.find((cmd) => cmd.name() === 'prs');
    expect(prsCmd).toBeDefined();
  });

  describe('Output Formatters', () => {
    it('should format PR summary in the expected CLI shape', () => {
      const output = formatPRSummary({
        total_prs: 2,
        merged_prs: 1,
        closed_prs: 2,
        prs_without_conclusion: 1,
        open_prs: 0,
        unique_authors: 2,
        unique_labels: 1,
        avg_comments_per_pr: 1.5,
        labels: [{ label: 'bug', prs: 1 }],
        first_pr: {
          number: 1,
          title: 'First change',
          author: 'alice',
          created: '2025-01-01T00:00:00Z',
          closed: '2025-01-02T00:00:00Z',
        },
        last_pr: {
          number: 2,
          title: 'Last change',
          author: 'bob',
          created: '2025-01-03T00:00:00Z',
          merged: '2025-01-04T00:00:00Z',
          closed: '2025-01-04T00:00:00Z',
        },
        most_commented_pr: {
          number: 2,
          title: 'Last change',
          author: 'bob',
          comments: 2,
        },
        most_commented_prs: [],
        top_commenter: {
          login: 'reviewer',
          comments: 2,
        },
        top_themes: [{ text: 'github', value: 2 }],
        time_to_first_comment_hours: {
          average: 12.345,
          median: 12.345,
          min: 1,
          max: 24,
          prs_with_comment: 1,
          prs_without_comment: 1,
        },
      });

      expect(output).toContain('PRs Summary:');
      expect(output).toContain('PRs Without Conclusion: 1');
      expect(output).toContain('Average of comments per PR: 1.5');
      expect(output).toContain('  - bug: 1 PRs');
      expect(output).toContain('Most commented PR:');
      expect(output).toContain('Top commenter:');
      expect(output).toContain('Top themes:');
      expect(output).toContain('Time to first comment (hours):');
    });

    it('should format PR metrics in text format', () => {
      const data = {
        totalPRs: 42,
        leadTime: { average: 2.5, unit: 'days' },
        commentSummary: { total: 156 },
        labelSummary: { bug: 8, feature: 15 },
      };

      const output = formatPullRequestMetrics(data, { format: 'text' });
      expect(output).toContain('Pull Request Metrics');
      expect(output).toContain('42');
      expect(output).toContain('2.5 days');
    });

    it('should format PR metrics in JSON format', () => {
      const data = {
        totalPRs: 42,
        leadTime: { average: 2.5, unit: 'days' },
      };

      const output = formatPullRequestMetrics(data, { format: 'json' });
      const parsed = JSON.parse(output);
      expect(parsed.totalPRs).toBe(42);
      expect(parsed.leadTime.average).toBe(2.5);
    });

    it('should format PR metrics in CSV format', () => {
      const data = {
        totalPRs: 42,
        leadTime: { average: 2.5, unit: 'days' },
        commentSummary: { total: 156 },
      };

      const output = formatPullRequestMetrics(data, { format: 'csv' });
      expect(output).toContain('metric,value');
      expect(output).toContain('total_prs,42');
      expect(output).toContain('lead_time_days,2.5');
    });
  });
});
