'use client';

import { CalendarToday } from '@mui/icons-material';
import {
  Box,
  Button,
  Divider,
  InputAdornment,
  Popover,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar, LocalizationProvider } from "@mui/x-date-pickers";
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import dayjs, { Dayjs } from "dayjs";
import { useMemo, useState } from 'react';
import { useFilters } from './FiltersContext';

interface PresetRange {
  label: string;
  getRange: () => [Dayjs, Dayjs];
}

interface RangePickersDayProps extends PickersDayProps {
  rangeStart?: Dayjs | null;
  rangeEnd?: Dayjs | null;
  previewEnd?: Dayjs | null;
}

const DATE_FORMAT = 'YYYY-MM-DD';

const presets: PresetRange[] = [
  {
    label: 'Today',
    getRange: () => {
      const today = dayjs();
      return [today, today];
    },
  },
  {
    label: 'Yesterday',
    getRange: () => {
      const yesterday = dayjs().subtract(1, 'day');
      return [yesterday, yesterday];
    },
  },
  {
    label: 'Last 7 days',
    getRange: () => {
      const today = dayjs();
      return [today.subtract(6, 'day'), today];
    },
  },
  {
    label: 'Last 30 days',
    getRange: () => {
      const today = dayjs();
      return [today.subtract(29, 'day'), today];
    },
  },
  {
    label: 'This month',
    getRange: () => {
      const today = dayjs();
      return [today.startOf('month'), today];
    },
  },
  {
    label: 'Last month',
    getRange: () => {
      const lastMonth = dayjs().subtract(1, 'month');
      return [lastMonth.startOf('month'), lastMonth.endOf('month')];
    },
  },
];

function parseFilterDate(value: string): Dayjs | null {
  if (!value) {
    return null;
  }

  const parsedDate = dayjs(value);
  return parsedDate.isValid() ? parsedDate : null;
}

function formatDate(value: Dayjs | null): string {
  return value ? value.format(DATE_FORMAT) : '';
}

function getDisplayValue(startDate: string, endDate: string): string {
  if (startDate && endDate) {
    return `${startDate} - ${endDate}`;
  }

  if (startDate) {
    return `${startDate} -`;
  }

  if (endDate) {
    return `- ${endDate}`;
  }

  return '';
}

function isSameDay(left: Dayjs | null | undefined, right: Dayjs | null | undefined): boolean {
  return Boolean(left && right && left.isSame(right, 'day'));
}

function isDayInRange(day: Dayjs, start: Dayjs | null, end: Dayjs | null): boolean {
  if (!start || !end) {
    return false;
  }

  const currentTime = day.startOf('day').valueOf();
  const startTime = start.startOf('day').valueOf();
  const endTime = end.startOf('day').valueOf();

  return currentTime >= Math.min(startTime, endTime) && currentTime <= Math.max(startTime, endTime);
}

function RangePickersDay({
  day,
  rangeStart,
  rangeEnd,
  previewEnd,
  selected,
  ...other
}: RangePickersDayProps) {
  const effectiveEnd = rangeEnd || previewEnd || null;
  const isStart = isSameDay(day, rangeStart);
  const isEnd = isSameDay(day, effectiveEnd);
  const isInRange = isDayInRange(day, rangeStart || null, effectiveEnd);
  const isSingleDay = isStart && isEnd;

  return (
    <PickersDay
      {...other}
      day={day}
      selected={selected || isStart || isEnd}
      sx={{
        ...(isInRange && {
          borderRadius: isSingleDay ? '50%' : 0,
          bgcolor: isStart || isEnd ? 'primary.main' : 'primary.light',
          color: isStart || isEnd ? 'primary.contrastText' : 'primary.contrastText',
          opacity: isStart || isEnd ? 1 : 0.55,
          '&:hover, &:focus': {
            bgcolor: isStart || isEnd ? 'primary.dark' : 'primary.main',
          },
        }),
      }}
    />
  );
}

export default function DateRangePicker() {
  const { filters, updateFilter } = useFilters();
  const { startDate, endDate } = filters;
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [tempStartDate, setTempStartDate] = useState<Dayjs | null>(parseFilterDate(startDate));
  const [tempEndDate, setTempEndDate] = useState<Dayjs | null>(parseFilterDate(endDate));
  const [hoveredDate, setHoveredDate] = useState<Dayjs | null>(null);
  const isOpen = Boolean(anchorEl);
  const displayValue = getDisplayValue(startDate, endDate);
  const calendarValue = tempEndDate || tempStartDate || dayjs();

  const activePreset = useMemo(() => presets.find((preset) => {
    if (!startDate || !endDate) {
      return false;
    }

    const [presetStart, presetEnd] = preset.getRange();
    return startDate === formatDate(presetStart) && endDate === formatDate(presetEnd);
  })?.label, [endDate, startDate]);

  const openPicker = (event: React.MouseEvent<HTMLElement>) => {
    setTempStartDate(parseFilterDate(startDate));
    setTempEndDate(parseFilterDate(endDate));
    setHoveredDate(null);
    setAnchorEl(event.currentTarget);
  };

  const closePicker = () => {
    setAnchorEl(null);
    setHoveredDate(null);
  };

  const applyRange = (nextStartDate: Dayjs | null, nextEndDate: Dayjs | null) => {
    updateFilter('startDate', formatDate(nextStartDate));
    updateFilter('endDate', formatDate(nextEndDate));
    closePicker();
  };

  const handleCalendarChange = (date: Dayjs | null) => {
    if (!date) {
      return;
    }

    if (!tempStartDate || tempEndDate) {
      setTempStartDate(date);
      setTempEndDate(null);
      return;
    }

    if (date.isBefore(tempStartDate, 'day')) {
      setTempStartDate(date);
      setTempEndDate(null);
      return;
    }

    setTempEndDate(date);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ m: 1, maxWidth: 320 }}>
        <TextField
          fullWidth
          label="Date range"
          placeholder="Select date range"
          size="small"
          value={displayValue}
          onClick={openPicker}
          inputProps={{ readOnly: true }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <CalendarToday fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <Popover
          open={isOpen}
          anchorEl={anchorEl}
          onClose={closePicker}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              width: { xs: 320, sm: 520 },
              maxWidth: '100vw',
            }}
          >
            <Stack
              spacing={0.5}
              sx={{
                width: { xs: '100%', sm: 160 },
                borderRight: { xs: 0, sm: 1 },
                borderBottom: { xs: 1, sm: 0 },
                borderColor: 'divider',
                p: 1,
              }}
            >
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  color={activePreset === preset.label ? 'primary' : 'inherit'}
                  size="small"
                  sx={{ justifyContent: 'flex-start' }}
                  variant={activePreset === preset.label ? 'contained' : 'text'}
                  onClick={() => {
                    const [nextStartDate, nextEndDate] = preset.getRange();
                    applyRange(nextStartDate, nextEndDate);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </Stack>

            <Box sx={{ flex: 1, p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Custom range
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <TextField
                  label="Start"
                  size="small"
                  value={formatDate(tempStartDate)}
                  inputProps={{ readOnly: true }}
                />
                <TextField
                  label="End"
                  size="small"
                  value={formatDate(tempEndDate)}
                  inputProps={{ readOnly: true }}
                />
              </Stack>

              <DateCalendar
                value={calendarValue}
                onChange={handleCalendarChange}
                showDaysOutsideCurrentMonth
                slots={{ day: RangePickersDay }}
                slotProps={{
                  day: {
                    rangeStart: tempStartDate,
                    rangeEnd: tempEndDate,
                    previewEnd: tempStartDate && !tempEndDate ? hoveredDate : null,
                    onMouseEnter: (_event, day) => setHoveredDate(day as Dayjs),
                  } as Partial<RangePickersDayProps>,
                }}
                sx={{ mx: 'auto' }}
              />

              <Divider sx={{ my: 1 }} />
              <Stack direction="row" spacing={1} justifyContent="space-between">
                <Button
                  size="small"
                  onClick={() => {
                    setTempStartDate(null);
                    setTempEndDate(null);
                    applyRange(null, null);
                  }}
                >
                  Clear
                </Button>
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={closePicker}>
                    Cancel
                  </Button>
                  <Button
                    disabled={!tempStartDate || !tempEndDate}
                    size="small"
                    variant="contained"
                    onClick={() => applyRange(tempStartDate, tempEndDate)}
                  >
                    Apply
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </Box>
        </Popover>
      </Box>
    </LocalizationProvider>
  );
}
