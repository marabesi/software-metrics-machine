import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { CodemaatAnalyzer } from '../../../src';

describe('CodeMaat Analyzer Tests', () => {
  let tempDir: string;
  let analyzer: CodemaatAnalyzer;

  beforeAll(() => {
    // Create temporary directory for test CSV files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codemaat-test-'));
    analyzer = new CodemaatAnalyzer(tempDir);
  });

  afterAll(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe('Code Churn Analysis', () => {
    it('should handle missing churn CSV file', async () => {
      const result = await analyzer.getCodeChurn();

      expect(result).toBeDefined();
      expect(result.data).toEqual([]);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should parse valid code churn CSV', async () => {
      const csvContent = `date,added,deleted,commits
2024-01-01,50,10,5
2024-01-02,120,30,8
2024-01-03,75,20,3`;

      fs.writeFileSync(path.join(tempDir, 'abs-churn.csv'), csvContent);

      const result = await analyzer.getCodeChurn();

      expect(result).toBeDefined();
      expect(result.data.length).toBe(3);
      expect(result.data[0]).toEqual({
        date: '2024-01-01',
        added: 50,
        deleted: 10,
        commits: 5,
      });
    });

    it('should filter churn by date range', async () => {
      const csvContent = `date,added,deleted,commits
2024-01-01,50,10,5
2024-02-01,120,30,8
2024-03-01,75,20,3`;

      fs.writeFileSync(path.join(tempDir, 'abs-churn.csv'), csvContent);

      const result = await analyzer.getCodeChurn({
        startDate: '2024-02-01',
        endDate: '2024-03-01',
      });

      expect(result.data.length).toBe(2);
      expect(result.data.map(d => d.date)).toEqual(['2024-02-01', '2024-03-01']);
    });

    it('should handle CSV with quoted values', async () => {
      const csvContent = `date,"added","deleted","commits"
"2024-01-01",50,10,5
"2024-01-02",120,30,8`;

      fs.writeFileSync(path.join(tempDir, 'abs-churn.csv'), csvContent);

      const result = await analyzer.getCodeChurn();

      expect(result.data.length).toBe(2);
      expect(result.data[0].date).toBe('2024-01-01');
    });

    it('should provide metadata with results', async () => {
      const csvContent = `date,added,deleted,commits
2024-01-01,50,10,5`;

      fs.writeFileSync(path.join(tempDir, 'abs-churn.csv'), csvContent);

      const result = await analyzer.getCodeChurn({
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });

      expect(result.startDate).toBe('2024-01-01');
      expect(result.endDate).toBe('2024-12-31');
    });
  });

  describe('File Coupling Analysis', () => {
    it('should handle missing coupling CSV file', async () => {
      const result = await analyzer.getFileCoupling();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should parse valid coupling CSV', async () => {
      const csvContent = `file1,file2,coupling_strength
src/index.ts,src/utils.ts,45
src/api.ts,src/utils.ts,78
src/models.ts,src/database.ts,92`;

      fs.writeFileSync(path.join(tempDir, 'coupling.csv'), csvContent);

      const result = await analyzer.getFileCoupling();

      expect(result.length).toBe(3);
      expect(result[0]).toEqual({
        file1: 'src/index.ts',
        file2: 'src/utils.ts',
        couplingStrength: 45,
      });
    });

    it('should apply ignore patterns', async () => {
      const csvContent = `file1,file2,coupling_strength
src/index.ts,src/utils.ts,45
src/test.js,src/utils.ts,78
dist/build.ts,src/api.ts,92`;

      fs.writeFileSync(path.join(tempDir, 'coupling.csv'), csvContent);

      const result = await analyzer.getFileCoupling({
        ignorePatterns: ['*.js', 'dist/'],
      });

      expect(result.length).toBe(1);
      expect(result[0].file1).toBe('src/index.ts');
    });

    it('should handle ignore patterns with prefix', async () => {
      const csvContent = `file1,file2,coupling_strength
src/index.ts,src/utils.ts,45
test/unit.ts,src/utils.ts,78
node_modules/pkg.ts,src/api.ts,92`;

      fs.writeFileSync(path.join(tempDir, 'coupling.csv'), csvContent);

      const result = await analyzer.getFileCoupling({
        ignorePatterns: ['test/', 'node_modules/'],
      });

      expect(result.length).toBe(1);
    });

    it('should handle CSV with various header formats', async () => {
      const csvContent = `entity1,entity2,strength
src/index.ts,src/utils.ts,45
src/api.ts,src/utils.ts,78`;

      fs.writeFileSync(path.join(tempDir, 'coupling.csv'), csvContent);

      const result = await analyzer.getFileCoupling();

      expect(result.length).toBe(2);
    });
  });

  describe('Full Analysis', () => {
    beforeAll(() => {
      // Set up test CSV files
      const churnCsv = `date,added,deleted,commits
2024-01-01,50,10,5
2024-01-02,120,30,8`;

      const couplingCsv = `file1,file2,coupling_strength
src/index.ts,src/utils.ts,45
src/api.ts,src/utils.ts,78`;

      fs.writeFileSync(path.join(tempDir, 'abs-churn.csv'), churnCsv);
      fs.writeFileSync(path.join(tempDir, 'coupling.csv'), couplingCsv);
    });

    it('should run full analysis', async () => {
      const result = await analyzer.analyze();

      expect(result).toBeDefined();
      expect(result.churn).toBeDefined();
      expect(result.coupling).toBeDefined();
      expect(result?.churn?.data.length).toBe(2);
      expect(result?.coupling?.length).toBe(2);
    });

    it('should analyze with date filtering', async () => {
      const result = await analyzer.analyze({
        startDate: '2024-01-02',
        endDate: '2024-01-02',
      });

      expect(result?.churn?.data.length).toBe(1);
      expect(result?.churn?.data[0].date).toBe('2024-01-02');
    });

    it('should analyze with ignore patterns', async () => {
      const result = await analyzer.analyze({
        ignorePatterns: ['*.ts'],
      });

      expect(result?.coupling?.length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle directory with no CSV files', async () => {
      const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codemaat-empty-'));
      const emptyAnalyzer = new CodemaatAnalyzer(emptyDir);

      try {
        const churn = await emptyAnalyzer.getCodeChurn();
        const coupling = await emptyAnalyzer.getFileCoupling();

        expect(churn.data.length).toBe(0);
        expect(coupling.length).toBe(0);
      } finally {
        if (fs.existsSync(emptyDir)) {
          fs.rmSync(emptyDir, { recursive: true });
        }
      }
    });

    it('should handle malformed CSV gracefully', async () => {
      const malformedCsv = `this,is,broken
missing,columns`;

      fs.writeFileSync(path.join(tempDir, 'abs-churn.csv'), malformedCsv);

      const result = await analyzer.getCodeChurn();

      // Should return empty data for malformed CSV
      expect(result.data.length).toBe(0);
    });

    it('should skip malformed CSV rows', async () => {
      const csvContent = `date,added,deleted,commits
2024-01-01,50,10,5
broken,row,here
2024-01-02,120,30,8`;

      fs.writeFileSync(path.join(tempDir, 'abs-churn.csv'), csvContent);

      const result = await analyzer.getCodeChurn();

      // Should parse valid rows and skip malformed ones
      expect(result.data.length).toBe(2);
      expect(result.data[0].date).toBe('2024-01-01');
      expect(result.data[1].date).toBe('2024-01-02');
    });
  });
});
