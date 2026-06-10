import React from 'react';
import { render, screen } from '@testing-library/react';
import { FiltersProvider } from '@/components/filters/FiltersContext';
import FiltersContainer from '@/components/filters/FiltersContainer';
import * as api from '@/server/api';

// Mock the API
jest.mock('@/server/api');

const mockPipelineAPI = api.pipelineAPI as jest.Mocked<typeof api.pipelineAPI>;
const mockPullRequestAPI = api.pullRequestAPI as jest.Mocked<typeof api.pullRequestAPI>;
const mockSourceCodeAPI = api.sourceCodeAPI as jest.Mocked<typeof api.sourceCodeAPI>;

const FiltersContainerWithProvider = () => (
  <FiltersProvider>
    <FiltersContainer repository="test/repository" />
  </FiltersProvider>
);

describe('FiltersContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock API responses
    mockPipelineAPI.getFilterOptions = jest.fn().mockResolvedValue({
      workflows: [
        { name: 'workflow-1', path: 'path/1' },
        { name: 'workflow-2', path: 'path/2' },
      ],
      statuses: ['completed', 'in_progress', 'queued'],
      conclusions: ['success', 'failure', 'cancelled', 'timed_out'],
      branches: ['main', 'develop', 'staging'],
      events: ['push', 'pull_request', 'schedule'],
      jobs: [{ name: 'build', id: 'build' }],
    });
    mockPullRequestAPI.getAuthors = jest.fn().mockResolvedValue(['alice']);
    mockPullRequestAPI.getLabels = jest.fn().mockResolvedValue(['bug']);
    mockSourceCodeAPI.getAuthors = jest.fn().mockResolvedValue(['alice']);
  });

  it('renders filters section', () => {
    render(<FiltersContainerWithProvider />);
    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('renders without crashing', () => {
    const { container } = render(<FiltersContainerWithProvider />);
    expect(container).toBeInTheDocument();
  });
});
