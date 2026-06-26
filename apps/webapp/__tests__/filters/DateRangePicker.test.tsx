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
    const startDate = today.subtract(7, 'day');

    expect(screen.getByLabelText('Date range')).toHaveValue(
      `${startDate.format('YYYY-MM-DD HH:mm')} - ${today.format('YYYY-MM-DD HH:mm')}`,
    );
  });

  it('lets users select date and time for a custom range', () => {
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
    fireEvent.change(screen.getByLabelText('Start date and time'), {
      target: { value: '2026-01-05T08:30' },
    });
    fireEvent.change(screen.getByLabelText('End date and time'), {
      target: { value: '2026-01-10T17:45' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(screen.getByLabelText('Date range')).toHaveValue('2026-01-05 08:30 - 2026-01-10 17:45');
  });
});
