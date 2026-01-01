'use client';

import { useState } from 'react';
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import {DatePicker, LocalizationProvider} from "@mui/x-date-pickers";
import dayjs from "dayjs";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
}

export default function DateRangePicker({ startDate, endDate }: DateRangePickerProps) {
  const [localStartDate, setLocalStartDate] = useState(startDate);
  const [localEndDate, setLocalEndDate] = useState(endDate);

  // const handleApply = () => {
  //   onChange({
  //     start_date: localStartDate,
  //     end_date: localEndDate,
  //   });
  // };

  const handleClear = () => {
    setLocalStartDate('');
    setLocalEndDate('');
    // onChange({ start_date: '', end_date: '' });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker label="Basic date picker"
                  value={dayjs(localStartDate)}
                  onChange={(e) => setLocalStartDate(dayjs(e).format('YYYY-MM-DD'))}
      />
      <DatePicker label="Basic date picker"
                  value={dayjs(localEndDate)}
                  onChange={(e) => setLocalEndDate(dayjs(e).format('YYYY-MM-DD'))}
      />
    </LocalizationProvider>
  );
}
