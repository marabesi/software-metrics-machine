'use client';

import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, OutlinedInput, Chip, Box } from '@mui/material';

interface MultiSelectFilterProps {
  label: string;
  values: string[];
  options: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}

export default function MultiSelectFilter({ 
  label, 
  values, 
  options, 
  onChange, 
  disabled = false 
}: MultiSelectFilterProps) {
  const handleChange = (event: SelectChangeEvent<typeof values>) => {
    const {
      target: { value },
    } = event;
    onChange(typeof value === 'string' ? value.split(',') : value);
  };

  return (
    <FormControl sx={{ m: 1, minWidth: 250 }} size="small" disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select
        multiple
        value={values}
        onChange={handleChange}
        label={label}
        input={<OutlinedInput />}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map((value) => (
              <Chip key={value} label={value} size="small" />
            ))}
          </Box>
        )}
      >
        {options.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
