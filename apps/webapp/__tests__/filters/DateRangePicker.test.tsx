import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { FiltersProvider } from '@/components/filters/FiltersContext';
import DateRangePicker from '@/components/filters/DateRangePicker';
import { defaultFilters, DashboardFilters } from '@/components/filters/DashboardFilters';
import dayjs from 'dayjs';

// Test wrapper component
const DateRangePickerWithProvider = ({ initialFilters }: { initialFilters?: DashboardFilters }) => (
  <FiltersProvider initialFilters={initialFilters}>
    <DateRangePicker />
  </FiltersProvider>
);

describe('DateRangePicker', () => {
  it('renders a single date range field', () => {
    render(<DateRangePickerWithProvider />);

    expect(screen.getByLabelText('Date range')).toBeInTheDocument();
    expect(screen.queryByLabelText('Start Date')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('End Date')).not.toBeInTheDocument();
  });

  it('renders within provider without errors', () => {
    const { container } = render(<DateRangePickerWithProvider />);
    expect(container).toBeInTheDocument();
  });

  it('opens range options and applies a preset', () => {
    render(<DateRangePickerWithProvider />);

    fireEvent.click(screen.getByLabelText('Date range'));
    fireEvent.click(screen.getByRole('button', { name: 'Last 7 days' }));

    const today = dayjs();
    const startDate = today.subtract(6, 'day');

    expect(screen.getByLabelText('Date range')).toHaveValue(
      `${startDate.format('YYYY-MM-DD')} - ${today.format('YYYY-MM-DD')}`,
    );
  });

  it('lets users select and apply a custom range from one calendar', () => {
    render(
      <DateRangePickerWithProvider
        initialFilters={{
          ...defaultFilters,
          startDate: '2026-01-01',
          endDate: '2026-01-31',
        }}
      />,
    );

    fireEvent.click(screen.getByLabelText('Date range'));
    fireEvent.click(screen.getByRole('gridcell', { name: '5' }));
    fireEvent.click(screen.getByRole('gridcell', { name: '10' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(screen.getByLabelText('Date range')).toHaveValue('2026-01-05 - 2026-01-10');
  });
});
