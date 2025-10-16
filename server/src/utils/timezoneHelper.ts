import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrAfter);
dayjs.extend(customParseFormat);

export const convertToUTC = (dateTimeString: string, tz: string): Date => {
  return dayjs.tz(dateTimeString, tz).utc().toDate();
};

export const convertFromUTC = (utcDate: Date, tz: string): string => {
  return dayjs.utc(utcDate).tz(tz).format();
};

export const formatDateTime = (
  utcDate: Date, 
  tz: string, 
  format: string = 'YYYY-MM-DD HH:mm:ss z'
): string => {
  return dayjs.utc(utcDate).tz(tz).format(format);
};
export const validateDateRange = (
  startDateTime: string, 
  endDateTime: string, 
  tz: string
): boolean => {
  const start = dayjs.tz(startDateTime, tz);
  const end = dayjs.tz(endDateTime, tz);
  return end.isAfter(start);
};
export const isPastDate = (dateTimeString: string, tz: string): boolean => {
  const inputDate = dayjs.tz(dateTimeString, tz);
  const now = dayjs().tz(tz);
  return inputDate.isBefore(now);
};
export const getAllTimezones = (): string[] => {
  return [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Shanghai',
    'Asia/Tokyo',
    'Australia/Sydney',
    'Pacific/Auckland'
  ];
};

export const isValidTimezone = (tz: string): boolean => {
  try {
    dayjs.tz('2024-01-01', tz);
    return true;
  } catch {
    return false;
  }
};
