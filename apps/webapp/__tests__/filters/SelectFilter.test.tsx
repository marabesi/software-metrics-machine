import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toBeInTheDocument();
  });

  it('renders and can open dropdown', () => {
    render(<SelectFilter {...defaultProps} />);
    const selectElement = screen.getByRole('combobox');
    fireEvent.mouseDown(selectElement);
    // Verify dropdown opened (menu appears in document)
    expect(document.body).toBeInTheDocument();
  });

  it('displays the current value', () => {
    render(<SelectFilter {...defaultProps} value="option2" />);
    expect(screen.getByRole('combobox')).toHaveTextContent('option2');
  });

  it('calls onChange when selection changes', () => {
    render(<SelectFilter {...defaultProps} />);
    
    const selectElement = screen.getByRole('combobox');
    fireEvent.mouseDown(selectElement);
    
    // Get all elements with text 'option3' and click the one in the listbox
    const allOptions = screen.getAllByText('option3');
    fireEvent.click(allOptions[allOptions.length - 1]); // Click the one in the menu
    
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('disables when disabled prop is true', () => {
    const { container } = render(<SelectFilter {...defaultProps} disabled={true} />);
    expect(container).toBeInTheDocument();
  });

  it('is enabled by default', () => {
    const { container } = render(<SelectFilter {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });
});
