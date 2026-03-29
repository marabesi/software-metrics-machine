'use client';

import React from 'react';
import { TextField } from '@mui/material';

interface TextInputFilterProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  disabled?: boolean;
}

export default function TextInputFilter({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  multiline = false,
  disabled = false 
}: TextInputFilterProps) {
  return (
    <TextField
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      size="small"
      multiline={multiline}
      rows={multiline ? 2 : 1}
      sx={{ m: 1, minWidth: 200 }}
      disabled={disabled}
    />
  );
}
