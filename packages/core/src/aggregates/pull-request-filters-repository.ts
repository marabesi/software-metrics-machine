import { IRepository } from '../infrastructure';
import { PullRequestJsonResponse } from '../providers/github/github-response-types';

export type PullRequestFilterOptions = {
  authors: string[];
  labels: string[];
};

export class PullRequestFiltersRepository {
  constructor(
    private pullRequestFileSystemRepository: IRepository<PullRequestJsonResponse>,
    private pullRequestFiltersFileSystemRepository: IRepository<PullRequestFilterOptions>
  ) {}

  async loadOptions(): Promise<PullRequestFilterOptions> {
    const cachedOptions = await this.pullRequestFiltersFileSystemRepository.load();
    return cachedOptions || this.refreshOptions();
  }

  async refreshOptions(): Promise<PullRequestFilterOptions> {
    const prs = await this.pullRequestFileSystemRepository.loadAll();
    const authors = new Set<string>();
    const labels = new Set<string>();

    for (const pr of prs) {
      this.addValue(authors, pr.user?.login);

      for (const label of pr.labels || []) {
        this.addValue(labels, label.name);
      }
    }

    const options = {
      authors: this.sortedValues(authors),
      labels: this.sortedValues(labels),
    };

    await this.pullRequestFiltersFileSystemRepository.save(options);
    return options;
  }

  private addValue(target: Set<string>, value?: string | null): void {
    const normalized = (value || '').trim();
    if (normalized) {
      target.add(normalized);
    }
  }

  private sortedValues(values: Set<string>): string[] {
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }
}
