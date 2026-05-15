import {beforeEach, describe, expect, it} from 'vitest';
import {commands} from '../src';
import {
  formatCodeMetrics,
  formatCompleteReport,
  formatDeploymentMetrics,
  formatError,
  formatIssueMetrics,
  formatLoading,
  formatPullRequestMetrics,
  formatQualityMetrics,
  formatSuccess,
} from '../src/formatters';
import {validateConfiguration} from '../src/orchestrator-factory';
import {Command} from 'commander';

describe('CLI Commands', () => {
  let program: Command;

  beforeEach(async () => {
    program = commands();
  });

  describe('Metrics Command Structure', () => {
    it.only('should have metrics command group', async () => {
      const metricsCmd = program.commands.find((cmd) => {
        return cmd.name() === 'prs';
      });
      expect(metricsCmd).toBeDefined();
    });

    it('should have pr subcommand', () => {
      const metricsCmd = program.commands.find((cmd) => cmd.name() === 'metrics');
      const prCmd = metricsCmd?.commands.find((cmd) => cmd.name() === 'pr');
      expect(prCmd).toBeDefined();
    });

    it('should have deployment subcommand', () => {
      const metricsCmd = program.commands.find((cmd) => cmd.name() === 'metrics');
      const depCmd = metricsCmd?.commands.find((cmd) => cmd.name() === 'deployment');
      expect(depCmd).toBeDefined();
    });

    it('should have code subcommand', () => {
      const metricsCmd = program.commands.find((cmd) => cmd.name() === 'metrics');
      const codeCmd = metricsCmd?.commands.find((cmd) => cmd.name() === 'code');
      expect(codeCmd).toBeDefined();
    });

    it('should have issues subcommand', () => {
      const metricsCmd = program.commands.find((cmd) => cmd.name() === 'metrics');
      const issuesCmd = metricsCmd?.commands.find((cmd) => cmd.name() === 'issues');
      expect(issuesCmd).toBeDefined();
    });

    it('should have quality subcommand', () => {
      const metricsCmd = program.commands.find((cmd) => cmd.name() === 'metrics');
      const qualityCmd = metricsCmd?.commands.find((cmd) => cmd.name() === 'quality');
      expect(qualityCmd).toBeDefined();
    });

    it('should have report subcommand', () => {
      const metricsCmd = program.commands.find((cmd) => cmd.name() === 'metrics');
      const reportCmd = metricsCmd?.commands.find((cmd) => cmd.name() === 'report');
      expect(reportCmd).toBeDefined();
    });
  });

  describe('Command Options', () => {
    it('pr command should support format options', () => {
      const metricsCmd = program.commands.find((cmd) => cmd.name() === 'metrics');
      const prCmd = metricsCmd?.commands.find((cmd) => cmd.name() === 'pr');
      expect(prCmd?.options).toBeDefined();
    });

    it('deployment command should support frequency option', () => {
      const metricsCmd = program.commands.find((cmd) => cmd.name() === 'metrics');
      const depCmd = metricsCmd?.commands.find((cmd) => cmd.name() === 'deployment');
      const frequencyOpt = depCmd?.options.find((opt) => opt.long === '--frequency');
      expect(frequencyOpt).toBeDefined();
    });

    it('report command should support all filter options', () => {
      const metricsCmd = program.commands.find((cmd) => cmd.name() === 'metrics');
      const reportCmd = metricsCmd?.commands.find((cmd) => cmd.name() === 'report');
      const hasDateOptions = reportCmd?.options.some((opt) => opt.long === '--start-date');
      const hasAuthorsOption = reportCmd?.options.some((opt) => opt.long === '--authors');
      expect(hasDateOptions && hasAuthorsOption).toBe(true);
    });
  });

  describe('Output Formatters', () => {
    describe('Pull Request Metrics Formatter', () => {
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
  
    describe('Deployment Metrics Formatter', () => {
      it('should format deployment metrics in text format', () => {
        const data = {
          pipelineMetrics: { totalRuns: 100, successRate: 0.95 },
          deploymentFrequency: [
            { date: '2024-03-20', value: 5 },
            { date: '2024-03-21', value: 4 },
          ],
          jobMetrics: [{ jobName: 'Build', avgDuration: 300, successRate: 0.98 }],
        };
  
        const output = formatDeploymentMetrics(data, { format: 'text' });
        expect(output).toContain('Deployment Metrics');
        expect(output).toContain('100');
        expect(output).toContain('95.0%');
      });
  
      it('should format deployment metrics in JSON format', () => {
        const data = {
          pipelineMetrics: { totalRuns: 100, successRate: 0.95 },
        };
  
        const output = formatDeploymentMetrics(data, { format: 'json' });
        const parsed = JSON.parse(output);
        expect(parsed.pipelineMetrics.totalRuns).toBe(100);
      });
    });
  
    describe('Code Metrics Formatter', () => {
      it('should format code metrics in text format', () => {
        const data = {
          pairingIndex: { pairingIndexPercentage: 45 },
          codeChurn: { data: { additions: 1520, deletions: 890 } },
          fileCoupling: [
            { file1: 'src/auth.ts', file2: 'src/middleware.ts', couplingStrength: 0.853 },
          ],
        };
  
        const output = formatCodeMetrics(data, { format: 'text' });
        expect(output).toContain('Code Metrics');
        expect(output).toContain('45%');
        expect(output).toContain('1520');
      });
  
      it('should format code metrics in CSV format', () => {
        const data = {
          pairingIndex: { pairingIndexPercentage: 45 },
          codeChurn: { data: { additions: 1520, deletions: 890 } },
        };
  
        const output = formatCodeMetrics(data, { format: 'csv' });
        expect(output).toContain('metric,value');
        expect(output).toContain('pairing_index,45');
      });
    });
  
    describe('Issue Metrics Formatter', () => {
      it('should format issue metrics in text format', () => {
        const data = {
          totalIssues: 320,
          issues: [
            { key: 'PROJ-001', status: 'Done', priority: 'High', createdAt: '2024-03-20' },
            { key: 'PROJ-002', status: 'In Progress', priority: 'Medium', createdAt: '2024-03-21' },
          ],
        };
  
        const output = formatIssueMetrics(data, { format: 'text' });
        expect(output).toContain('Issue Metrics');
        expect(output).toContain('320');
        expect(output).toContain('PROJ-001');
      });
  
      it('should format issue metrics in CSV format', () => {
        const data = {
          totalIssues: 320,
          issues: [{ key: 'PROJ-001', status: 'Done', priority: 'High', createdAt: '2024-03-20' }],
        };
  
        const output = formatIssueMetrics(data, { format: 'csv' });
        expect(output).toContain('key,status,priority,created_at');
        expect(output).toContain('PROJ-001,Done,High,2024-03-20');
      });
    });
  
    describe('Quality Metrics Formatter', () => {
      it('should format quality metrics in text format', () => {
        const data = {
          coverage: '78.5%',
          complexity: 42,
          sqale_rating: 'A',
        };
  
        const output = formatQualityMetrics(data, { format: 'text' });
        expect(output).toContain('Quality Metrics');
        expect(output).toContain('coverage: 78.5%');
      });
  
      it('should format quality metrics in JSON format', () => {
        const data = {
          coverage: '78.5%',
          complexity: 42,
        };
  
        const output = formatQualityMetrics(data, { format: 'json' });
        const parsed = JSON.parse(output);
        expect(parsed.coverage).toBe('78.5%');
      });
    });
  
    describe('Complete Report Formatter', () => {
      it('should format complete report in text format', () => {
        const data = {
          timestamp: '2024-03-29T10:30:00Z',
          pullRequests: { totalPRs: 42 },
          deployment: { pipelineMetrics: { totalRuns: 100, successRate: 0.95 } },
          code: { pairingIndex: { pairingIndexPercentage: 45 } },
          issues: { totalIssues: 320 },
          quality: { coverage: '78.5%' },
          filters: { startDate: '2024-01-01' },
        };
  
        const output = formatCompleteReport(data, { format: 'text' });
        expect(output).toContain('Software Metrics Machine');
        expect(output).toContain('Comprehensive Report');
        expect(output).toContain('2024-03-29T10:30:00Z');
      });
  
      it('should format complete report in JSON format', () => {
        const data = {
          timestamp: '2024-03-29T10:30:00Z',
          pullRequests: { totalPRs: 42 },
        };
  
        const output = formatCompleteReport(data, { format: 'json' });
        const parsed = JSON.parse(output);
        expect(parsed.timestamp).toBe('2024-03-29T10:30:00Z');
      });
  
      it('should format complete report in CSV format', () => {
        const data = {
          pullRequests: { totalPRs: 42 },
          deployment: { pipelineMetrics: { totalRuns: 100, successRate: 0.95 } },
        };
  
        const output = formatCompleteReport(data, { format: 'csv' });
        expect(output).toContain('section,metric,value');
      });
    });
  
    describe('Error & Status Formatters', () => {
      it('should format error message', () => {
        const error = new Error('Database connection failed');
        const output = formatError(error);
        expect(output).toContain('❌ Error');
        expect(output).toContain('Database connection failed');
      });
  
      it('should format error with verbose stack trace', () => {
        const error = new Error('Test error');
        const output = formatError(error, { verbose: true });
        expect(output).toContain('Stack Trace');
      });
  
      it('should format success message', () => {
        const output = formatSuccess('Metrics retrieved successfully');
        expect(output).toContain('✓');
        expect(output).toContain('Metrics retrieved successfully');
      });
  
      it('should format loading message', () => {
        const output = formatLoading('Fetching metrics...');
        expect(output).toContain('⏳');
        expect(output).toContain('Fetching metrics...');
      });
    });
  });
  
  describe('Configuration Validation', () => {
    it('should warn about missing providers', () => {
      // Save original env
      const originalEnv = process.env;
      process.env = {};
  
      const validation = validateConfiguration();
  
      // At least it should indicate no valid config
      expect(validation).toBeDefined();
      expect(validation.errors || validation.valid === false).toBeTruthy();
  
      // Restore env
      process.env = originalEnv;
    });
  
    it('should accept configuration with at least one provider', () => {
      const originalEnv = process.env;
      process.env = {
        GITHUB_TOKEN: 'test',
        GITHUB_OWNER: 'test',
        GITHUB_REPO: 'test',
      };
  
      const validation = validateConfiguration();
      expect(validation.valid).toBe(true);
  
      process.env = originalEnv;
    });
  
    it('deployment command should have frequency option', () => {
      const metricsCmd = program.commands.find((cmd) => cmd.name() === 'metrics');
      const depCmd = metricsCmd?.commands.find((cmd) => cmd.name() === 'deployment');
      const freqOption = depCmd?.options.find((opt) => opt.long === '--frequency');
      expect(freqOption).toBeDefined();
    });
  
    it('code command should have authors option', () => {
      const metricsCmd = program.commands.find((cmd) => cmd.name() === 'metrics');
      const codeCmd = metricsCmd?.commands.find((cmd) => cmd.name() === 'code');
      const authorsOption = codeCmd?.options.find((opt) => opt.long === '--authors');
      expect(authorsOption).toBeDefined();
    });
  
    it('report command should have format option', () => {
      const metricsCmd = program.commands.find((cmd) => cmd.name() === 'metrics');
      const reportCmd = metricsCmd?.commands.find((cmd) => cmd.name() === 'report');
      const formatOption = reportCmd?.options.find((opt) => opt.long === '--format');
      expect(formatOption).toBeDefined();
    });
  
    describe('Command Descriptions', () => {
      it('should have descriptive help text', () => {
        const metricsCmd = program.commands.find((cmd) => cmd.name() === 'metrics');
        expect(metricsCmd?.description()).toBeDefined();
        expect(metricsCmd?.description()?.length).toBeGreaterThan(0);
      });
    });
  });
});

