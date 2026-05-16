import {SonarqubeMeasuresClient} from "../../../src";

describe('SonarqubeMeasuresClient', () => {
  let client: SonarqubeMeasuresClient;

  beforeEach(() => {
    client = new SonarqubeMeasuresClient(
      'https://sonarqube.example.com',
      'sonar-token',
      'project-key'
    );
  });

  it('should initialize with URL, token, and project key', () => {
    expect(client).toBeDefined();
  });

  it('should fetch component measures', async () => {
    const measures = await client.fetchComponentMeasures({
      metrics: ['coverage', 'complexity'],
    });

    expect(measures).toBeDefined();
    expect(measures.key).toBe('project-key');
    expect(Array.isArray(measures.measures)).toBe(true);
  });
});
