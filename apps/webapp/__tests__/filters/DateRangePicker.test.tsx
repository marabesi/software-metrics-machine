import React from 'react';
import { render } from '@testing-library/react';
import { FiltersProvider } from '@/components/filters/FiltersContext';
import DateRangePicker from '@/components/filters/DateRangePicker';

// Test wrapper component
const DateRangePickerWithProvider = () => (
  <FiltersProvider>
    <DateRangePicker />
  </FiltersProvider>
);

describe('DateRangePicker', () => {
  it('renders date picker with inputs', () => {
    const { container } = render(<DateRangePickerWithProvider />);
    // MUI DatePicker renders input fields
    const inputs = container.querySelectorAll('input');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('renders within provider without errors', () => {
    const { container } = render(<DateRangePickerWithProvider />);
    expect(container).toBeInTheDocument();
  });
});
