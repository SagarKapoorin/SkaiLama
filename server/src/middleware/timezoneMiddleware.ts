import type { Request, Response, NextFunction } from 'express';
import { isValidTimezone } from '../utils/timezoneHelper.js';

export const timezoneDetector = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  const clientTimezone = req.headers['x-timezone'] as string;
  if (clientTimezone && isValidTimezone(clientTimezone)) {
    req.clientTimezone = clientTimezone;
  } else {
    req.clientTimezone = 'UTC';
  }
    next();
};
