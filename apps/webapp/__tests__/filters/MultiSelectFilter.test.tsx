import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MultiSelectFilter from '@/components/filters/MultiSelectFilter';

describe('MultiSelectFilter', () => {
  const mockOnChange = jest.fn();
  const defaultProps = {
    label: 'Test Multi Select',
    values: [],
    options: ['option1', 'option2', 'option3', 'option4'],
    onChange: mockOnChange,
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders with label', () => {
    render(<MultiSelectFilter {...defaultProps} />);
    expect(screen.getByLabelText('Test Multi Select')).toBeInTheDocument();
  });

  it('renders all options', () => {
    render(<MultiSelectFilter {...defaultProps} />);
    const selectElement = screen.getByRole('combobox');
    fireEvent.mouseDown(selectElement);
    
    defaultProps.options.forEach((option) => {
      expect(screen.getByText(option)).toBeInTheDocument();
    });
  });

  it('displays selected values as chips', () => {
    render(<MultiSelectFilter {...defaultProps} values={['option1', 'option2']} />);
    expect(screen.getByText('option1')).toBeInTheDocument();
    expect(screen.getByText('option2')).toBeInTheDocument();
  });

  it('calls onChange with array when selections change', async () => {
    const user = userEvent.setup();
    render(<MultiSelectFilter {...defaultProps} />);
    
    const selectElement = screen.getByRole('combobox');
    await user.click(selectElement);
    
    const option1 = screen.getAllByText('option1')[0];
    await user.click(option1);
    
    expect(mockOnChange).toHaveBeenCalledWith(['option1']);
  });

  it('allows multiple selections', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<MultiSelectFilter {...defaultProps} />);
    
    const selectElement = screen.getByRole('combobox');
    await user.click(selectElement);
    
    const option1 = screen.getAllByText('option1')[0];
    await user.click(option1);
    expect(mockOnChange).toHaveBeenCalledWith(['option1']);
    
    // Simulate updating values
    rerender(
      <MultiSelectFilter {...defaultProps} values={['option1']} onChange={mockOnChange} />
    );
    
    await user.click(selectElement);
    const option2 = screen.getAllByText('option2')[0];
    await user.click(option2);
    
    expect(mockOnChange).toHaveBeenLastCalledWith(['option1', 'option2']);
  });

  it('disables when disabled prop is true', () => {
    render(<MultiSelectFilter {...defaultProps} disabled={true} />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('is enabled by default', () => {
    render(<MultiSelectFilter {...defaultProps} />);
    expect(screen.getByRole('combobox')).not.toBeDisabled();
  });
});
