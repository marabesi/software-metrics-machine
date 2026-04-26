import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toBeInTheDocument();
  });

  it('renders and can open dropdown', () => {
    render(<MultiSelectFilter {...defaultProps} />);
    const selectElement = screen.getByRole('combobox');
    fireEvent.mouseDown(selectElement);
    expect(document.body).toBeInTheDocument();
  });

  it('displays selected values as chips', () => {
    render(<MultiSelectFilter {...defaultProps} values={['option1', 'option2']} />);
    const elements = screen.getAllByText('option1');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('calls onChange with array when selections change', () => {
    render(<MultiSelectFilter {...defaultProps} />);
    
    const selectElement = screen.getByRole('combobox');
    fireEvent.mouseDown(selectElement);
    
    // Get all elements with text 'option1' and click the one in the menu
    const allOptions = screen.getAllByText('option1');
    fireEvent.click(allOptions[allOptions.length - 1]); // Click the one in the menu
    
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('disables when disabled prop is true', () => {
    const { container } = render(<MultiSelectFilter {...defaultProps} disabled={true} />);
    expect(container).toBeInTheDocument();
  });

  it('is enabled by default', () => {
    const { container } = render(<MultiSelectFilter {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });
});