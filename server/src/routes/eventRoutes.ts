import express from 'express';
import { body } from 'express-validator';
import { 
  createEvent, 
  getEventsByProfile, 
  getAllEvents,
  getEventById,
  updateEvent, 
  getEventLogs 
} from '../controllers/eventController.js';
import { validate } from '../middleware/validateRequest.js';
import { cacheMiddleware } from '../middleware/cacheMiddleware.js';
import { generateCacheKey } from '../utils/cacheHelper.js';

const router = express.Router();

router.post('/',
  [
    body('title')
      .trim()
      .notEmpty().withMessage('Title is required')
      .isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
    body('profileIds')
      .isArray({ min: 1 }).withMessage('At least one profile is required')
      .custom((value) => {
        if (!value.every((id: string) => /^[0-9a-fA-F]{24}$/.test(id))) {
          throw new Error('Invalid profile ID format');
        }
        return true;
      }),
    body('timezone')
      .notEmpty().withMessage('Timezone is required'),
    body('startDateTime')
      .notEmpty().withMessage('Start date/time is required'),
    body('endDateTime')
      .notEmpty().withMessage('End date/time is required')
  ],
  validate,
  createEvent
);

router.get('/',
  getAllEvents
);

// Get events by profile (cached for 30 minutes)
router.get('/profile/:profileId', 
  cacheMiddleware({
    keyGenerator: (req) => {
      const limit = parseInt((req.query.limit as string) || '100', 10);
      const skip = parseInt((req.query.skip as string) || '0', 10);
      return generateCacheKey.eventsByProfile(
        req.params.profileId!,
        req.clientTimezone || 'UTC',
        skip,
        limit
      );
    },
    ttl: 432000
  }),
  getEventsByProfile
);

router.get('/:eventId',
  cacheMiddleware({
    keyGenerator: (req) => generateCacheKey.eventById(req.params.eventId!),
    ttl: 432000
  }),
  getEventById
);

// Update event
router.put('/:eventId', 
  [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
    body('profileIds')
      .optional()
      .isArray({ min: 1 }).withMessage('At least one profile is required'),
    body('timezone')
      .optional()
      .notEmpty().withMessage('Timezone cannot be empty'),
    body('startDateTime')
      .optional()
      .notEmpty().withMessage('Start date/time cannot be empty'),
    body('endDateTime')
      .optional()
      .notEmpty().withMessage('End date/time cannot be empty')
  ],
  validate,
  updateEvent
);

router.get('/:eventId/logs',
  cacheMiddleware({
    keyGenerator: (req) => {
      const limit = parseInt((req.query.limit as string) || '100', 10);
      const skip = parseInt((req.query.skip as string) || '0', 10);
      return generateCacheKey.eventLogs(
        req.params.eventId!,
        skip,
        limit
      );
    },
    ttl: 432000
  }),
  getEventLogs
);

export default router;
