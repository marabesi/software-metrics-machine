import {JiraIssuesClient} from "../../../src";

describe('JiraIssuesClient', () => {
  let client: JiraIssuesClient;

  beforeEach(() => {
    client = new JiraIssuesClient(
      'https://jira.example.com',
      'user@example.com',
      'api-token',
      'PROJECT'
    );
  });

  it('should initialize with URL, email, token, and project', () => {
    expect(client).toBeDefined();
  });

  it('should fetch issues', async () => {
    const issues = await client.fetchIssues({
      status: 'Done',
    });

    expect(Array.isArray(issues)).toBe(true);
  });

  it('should fetch issue changes', async () => {
    const changes = await client.fetchIssueChanges('PROJ-1');

    expect(Array.isArray(changes)).toBe(true);
  });

  it('should fetch issue comments', async () => {
    const comments = await client.fetchIssueComments('PROJ-1');

    expect(Array.isArray(comments)).toBe(true);
  });
});