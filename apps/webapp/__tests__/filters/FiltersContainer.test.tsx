import React from 'react';
import { render, screen } from '@testing-library/react';
import { FiltersProvider } from '@/components/filters/FiltersContext';
import FiltersContainer from '@/components/filters/FiltersContainer';
import * as api from '@/server/api';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

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
    mockPipelineAPI.getWorkflows = jest.fn().mockResolvedValue([
      { name: 'workflow-1', path: 'path/1' },
      { name: 'workflow-2', path: 'path/2' },
    ]);
    mockPipelineAPI.getStatuses = jest.fn().mockResolvedValue(['completed', 'in_progress', 'queued']);
    mockPipelineAPI.getConclusions = jest.fn().mockResolvedValue(['success', 'failure', 'cancelled', 'timed_out']);
    mockPipelineAPI.getBranches = jest.fn().mockResolvedValue(['main', 'develop', 'staging']);
    mockPipelineAPI.getEvents = jest.fn().mockResolvedValue(['push', 'pull_request', 'schedule']);
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
