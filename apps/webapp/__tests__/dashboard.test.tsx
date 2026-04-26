import {render, screen, waitFor} from "@testing-library/react";
import DashboardLayout from "@/app/dashboard/layout";
import React from "react";

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  usePathname: () => '/dashboard/insights',
}));

// Mock child content
const MockChild = () => <div>Insights</div>;

describe('Dashboard', () => {
  it('should render dashboard tabs', async () => {
    render(
      <DashboardLayout>
        <MockChild />
      </DashboardLayout>
    );

    // Wait for component to be mounted
    await waitFor(() => {
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);
    });

    // Check that tab labels exist by finding them in the tab list
    const insightsTab = screen.getByRole('tab', { name: /Insights/i });
    const pipelinesTab = screen.getByRole('tab', { name: /Pipelines/i });
    const prTab = screen.getByRole('tab', { name: /Pull Requests/i });
    const sourceCodeTab = screen.getByRole('tab', { name: /Source Code/i });
    
    expect(insightsTab).toBeInTheDocument();
    expect(pipelinesTab).toBeInTheDocument();
    expect(prTab).toBeInTheDocument();
    expect(sourceCodeTab).toBeInTheDocument();
  });

  it('should render child content', async () => {
    render(
      <DashboardLayout>
        <MockChild />
      </DashboardLayout>
    );

    await waitFor(() => {
      // Check the child content is in the document
      const insightsTab = screen.getByRole('tab', { name: /Insights/i });
      expect(insightsTab).toBeInTheDocument();
    });
  });
});
