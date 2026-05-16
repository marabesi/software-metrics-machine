import { CodemaatAnalyzer } from '../../../src';

describe('CodemaatAnalyzer', () => {
  let analyzer: CodemaatAnalyzer;

  beforeEach(() => {
    analyzer = new CodemaatAnalyzer('/path/to/data');
  });

  it('should initialize with data directory', () => {
    expect(analyzer).toBeDefined();
  });

  it('should get code churn', async () => {
    const churn = await analyzer.getCodeChurn({
      startDate: '2024-01-01',
      endDate: '2024-02-01',
    });

    expect(churn).toBeDefined();
    expect(Array.isArray(churn.data)).toBe(true);
    expect(churn.startDate).toBe('2024-01-01');
    expect(churn.endDate).toBe('2024-02-01');
  });

  it('should get file coupling', async () => {
    const coupling = await analyzer.getFileCoupling({
      ignorePatterns: ['*.test.ts', 'node_modules/'],
    });

    expect(Array.isArray(coupling)).toBe(true);
  });

  it('should run full analysis', async () => {
    const result = await analyzer.analyze({
      startDate: '2024-01-01',
      endDate: '2024-02-01',
      ignorePatterns: ['*.test.ts'],
    });

    expect(result).toBeDefined();
    expect(result.churn).toBeDefined();
    expect(result.coupling).toBeDefined();
  });
});
