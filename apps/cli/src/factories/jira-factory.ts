import { IssuesRepository } from '@smmachine/core/aggregates/issues-repository';
import { Configuration } from '@smmachine/core/infrastructure/configuration';
import { JiraIssuesClient } from '@smmachine/core/providers/jira/jira-client';

export function createJiraDependencies(
  config: Configuration,
  jiraDirectory: string
): {
  issuesRepository: IssuesRepository;
} {
  const jiraClient = new JiraIssuesClient(
    config.jiraUrl || '',
    config.jiraEmail || '',
    config.jiraToken || '',
    config.jiraProject || ''
  );

  return {
    issuesRepository: new IssuesRepository(jiraClient, jiraDirectory),
  };
}
