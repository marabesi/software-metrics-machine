import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SelectFilter from '@/components/filters/SelectFilter';

describe('SelectFilter', () => {
  const mockOnChange = jest.fn();
  const defaultProps = {
    label: 'Test Select',
    value: 'option1',
    options: ['option1', 'option2', 'option3'],
    onChange: mockOnChange,
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders with label', () => {
    render(<SelectFilter {...defaultProps} />);
    expect(screen.getByLabelText('Test Select')).toBeInTheDocument();
  });

  it('renders all options', () => {
    render(<SelectFilter {...defaultProps} />);
    const selectElement = screen.getByRole('combobox');
    fireEvent.mouseDown(selectElement);
    
    defaultProps.options.forEach((option) => {
      expect(screen.getByText(option)).toBeInTheDocument();
    });
  });

  it('displays the current value', () => {
    render(<SelectFilter {...defaultProps} value="option2" />);
    expect(screen.getByRole('combobox')).toHaveTextContent('option2');
  });

  it('calls onChange when selection changes', async () => {
    const user = userEvent.setup();
    render(<SelectFilter {...defaultProps} />);
    
    const selectElement = screen.getByRole('combobox');
    await user.click(selectElement);
    
    const option = screen.getByText('option3');
    await user.click(option);
    
    expect(mockOnChange).toHaveBeenCalledWith('option3');
  });

  it('disables when disabled prop is true', () => {
    render(<SelectFilter {...defaultProps} disabled={true} />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('is enabled by default', () => {
    render(<SelectFilter {...defaultProps} />);
    expect(screen.getByRole('combobox')).not.toBeDisabled();
  });
});
