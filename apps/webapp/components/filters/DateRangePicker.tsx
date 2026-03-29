'use client';

import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useFilters } from './FiltersContext';
import { Box } from '@mui/material';

export default function DateRangePicker() {
  const { filters, updateFilter } = useFilters();
  const { startDate, endDate } = filters;

  return (
    <Box sx={{ display: 'flex', gap: 2, m: 1 }}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          label="Start Date"
          value={startDate ? dayjs(startDate) : null}
          onChange={(date) => {
            if (date) {
              updateFilter('startDate', dayjs(date).format('YYYY-MM-DD'));
            }
          }}
          slotProps={{
            textField: { size: 'small' },
          }}
        />
        <DatePicker
          label="End Date"
          value={endDate ? dayjs(endDate) : null}
          onChange={(date) => {
            if (date) {
              updateFilter('endDate', dayjs(date).format('YYYY-MM-DD'));
            }
          }}
          slotProps={{
            textField: { size: 'small' },
          }}
        />
      </LocalizationProvider>
    </Box>
  );
}
