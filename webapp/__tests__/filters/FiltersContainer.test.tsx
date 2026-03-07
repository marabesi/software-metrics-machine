import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FiltersProvider } from '@/components/filters/FiltersContext';
import FiltersContainer from '@/components/filters/FiltersContainer';
import * as api from '@/lib/api';

// Mock the API
jest.mock('@/lib/api');

const mockPipelineAPI = api.pipelineAPI as jest.Mocked<typeof api.pipelineAPI>;

const FiltersContainerWithProvider = () => (
  <FiltersProvider>
    <FiltersContainer />
  </FiltersProvider>
);

describe('FiltersContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock API responses
    mockPipelineAPI.getWorkflows.mockResolvedValue([
      { name: 'workflow-1', path: 'path/1' },
      { name: 'workflow-2', path: 'path/2' },
    ]);
    mockPipelineAPI.getStatuses.mockResolvedValue(['completed', 'in_progress', 'queued']);
    mockPipelineAPI.getConclusions.mockResolvedValue(['success', 'failure', 'cancelled', 'timed_out']);
    mockPipelineAPI.getBranches.mockResolvedValue(['main', 'develop', 'staging']);
    mockPipelineAPI.getEvents.mockResolvedValue(['push', 'pull_request', 'schedule']);
    mockPipelineAPI.getAuthors.mockResolvedValue(['author1', 'author2']);
    mockPipelineAPI.getLabels.mockResolvedValue(['bug', 'feature', 'docs']);
    mockPipelineAPI.getJobs.mockResolvedValue([
      { name: 'job-1' },
      { name: 'job-2' },
    ]);
  });

  it('renders filters section', () => {
    render(<FiltersContainerWithProvider />);
    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('renders date range section', () => {
    render(<FiltersContainerWithProvider />);
    expect(screen.getByText('Date Range')).toBeInTheDocument();
    expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
    expect(screen.getByLabelText('End Date')).toBeInTheDocument();
  });

  it('renders pipeline filters section', async () => {
    render(<FiltersContainerWithProvider />);
    expect(screen.getByText('Pipeline Filters')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByLabelText('Workflow')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
      expect(screen.getByLabelText('Conclusion')).toBeInTheDocument();
    });
  });

  it('renders pull request filters section', async () => {
    render(<FiltersContainerWithProvider />);
    expect(screen.getByText('Pull Request Filters')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByLabelText('Authors')).toBeInTheDocument();
      expect(screen.getByLabelText('Labels')).toBeInTheDocument();
    });
  });

  it('renders source code filters section', async () => {
    render(<FiltersContainerWithProvider />);
    expect(screen.getByText('Source Code Filters')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByLabelText('Ignore Pattern Files')).toBeInTheDocument();
      expect(screen.getByLabelText('Include Pattern Files')).toBeInTheDocument();
    });
  });

  it('renders metrics filters section', () => {
    render(<FiltersContainerWithProvider />);
    expect(screen.getByText('Metrics Filters')).toBeInTheDocument();
  });

  it('renders reset button', () => {
    render(<FiltersContainerWithProvider />);
    expect(screen.getByRole('button', { name: /Reset Filters/i })).toBeInTheDocument();
  });

  it('fetches filter options on mount', async () => {
    render(<FiltersContainerWithProvider />);
    
    await waitFor(() => {
      expect(mockPipelineAPI.getWorkflows).toHaveBeenCalled();
      expect(mockPipelineAPI.getStatuses).toHaveBeenCalled();
      expect(mockPipelineAPI.getConclusions).toHaveBeenCalled();
      expect(mockPipelineAPI.getBranches).toHaveBeenCalled();
      expect(mockPipelineAPI.getEvents).toHaveBeenCalled();
      expect(mockPipelineAPI.getAuthors).toHaveBeenCalled();
      expect(mockPipelineAPI.getLabels).toHaveBeenCalled();
      expect(mockPipelineAPI.getJobs).toHaveBeenCalled();
    });
  });

  it('handles API failures gracefully', async () => {
    mockPipelineAPI.getWorkflows.mockRejectedValue(new Error('API Error'));
    mockPipelineAPI.getStatuses.mockRejectedValue(new Error('API Error'));
    mockPipelineAPI.getConclusions.mockRejectedValue(new Error('API Error'));
    mockPipelineAPI.getBranches.mockRejectedValue(new Error('API Error'));
    mockPipelineAPI.getEvents.mockRejectedValue(new Error('API Error'));
    mockPipelineAPI.getAuthors.mockRejectedValue(new Error('API Error'));
    mockPipelineAPI.getLabels.mockRejectedValue(new Error('API Error'));
    mockPipelineAPI.getJobs.mockRejectedValue(new Error('API Error'));

    const { container } = render(<FiltersContainerWithProvider />);
    
    // Should render without crashing
    await waitFor(() => {
      expect(container).toBeInTheDocument();
    });
  });

  it('renders with default options when API returns empty arrays', async () => {
    mockPipelineAPI.getWorkflows.mockResolvedValue([]);
    mockPipelineAPI.getStatuses.mockResolvedValue([]);
    mockPipelineAPI.getConclusions.mockResolvedValue([]);
    mockPipelineAPI.getBranches.mockResolvedValue([]);
    mockPipelineAPI.getEvents.mockResolvedValue([]);
    mockPipelineAPI.getAuthors.mockResolvedValue([]);
    mockPipelineAPI.getLabels.mockResolvedValue([]);
    mockPipelineAPI.getJobs.mockResolvedValue([]);

    render(<FiltersContainerWithProvider />);
    
    await waitFor(() => {
      // Should still render with empty or default values
      expect(screen.getByText('Filters')).toBeInTheDocument();
    });
  });

  it('has all required filter inputs', async () => {
    render(<FiltersContainerWithProvider />);
    
    await waitFor(() => {
      // Check for key filter inputs
      expect(screen.getByLabelText('Workflow')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
      expect(screen.getByLabelText('Conclusion')).toBeInTheDocument();
      expect(screen.getByLabelText('Jobs')).toBeInTheDocument();
      expect(screen.getByLabelText('Branch')).toBeInTheDocument();
      expect(screen.getByLabelText('Event')).toBeInTheDocument();
      expect(screen.getByLabelText('Authors')).toBeInTheDocument();
      expect(screen.getByLabelText('Labels')).toBeInTheDocument();
      expect(screen.getByLabelText('Aggregate By')).toBeInTheDocument();
      expect(screen.getByLabelText('Ignore Pattern Files')).toBeInTheDocument();
      expect(screen.getByLabelText('Include Pattern Files')).toBeInTheDocument();
      expect(screen.getByLabelText('Authors (Source Code)')).toBeInTheDocument();
      expect(screen.getByLabelText('Type Churn')).toBeInTheDocument();
      expect(screen.getByLabelText('Top Entries')).toBeInTheDocument();
      expect(screen.getByLabelText('Aggregate Metric')).toBeInTheDocument();
    });
  });

  it('reset button exists and is clickable', async () => {
    const user = userEvent.setup();
    render(<FiltersContainerWithProvider />);
    
    const resetButton = screen.getByRole('button', { name: /Reset Filters/i });
    expect(resetButton).toBeInTheDocument();
    
    await user.click(resetButton);
    // No error means click worked
  });
});
