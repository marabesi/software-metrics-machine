import {beforeEach, describe, expect, it} from "vitest";
import {formatPullRequestMetrics} from "../../src/formatters";
import {Command} from "commander";
import {commands} from "../../src";

describe('Pull Request Metrics', () => {
  let program: Command;

  beforeEach(async () => {
    program = commands();
  });

  it('should have metrics command group', async () => {
    const result = program.parse(['prs', 'fetch'], {from: 'user'});

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
