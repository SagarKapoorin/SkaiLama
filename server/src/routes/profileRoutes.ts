import express from 'express';
import { body } from 'express-validator';
import { 
  createProfile, 
  getAllProfiles, 
  getProfileById,
  updateProfileTimezone 
} from '../controllers/profileController.js';
import { validate } from '../middleware/validateRequest.js';
import { cacheMiddleware } from '../middleware/cacheMiddleware.js';
import { generateCacheKey } from '../utils/cacheHelper.js';

const router = express.Router();

router.post('/', 
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('timezone')
      .notEmpty().withMessage('Timezone is required')
  ],
  validate,
  createProfile
);

router.get('/', 
  cacheMiddleware({
    keyGenerator: (req) => {
      const limit = parseInt((req.query.limit as string) || '100', 10);
      const skip = parseInt((req.query.skip as string) || '0', 10);
      return generateCacheKey.allProfiles(skip, limit);
    },
    ttl: 432000
  }),
  getAllProfiles
);

router.get('/:profileId',
  cacheMiddleware({
    keyGenerator: (req) => generateCacheKey.profileById(req.params.profileId!),
    ttl: 432000
  }),
  getProfileById
);

router.patch('/:profileId/timezone',
  [
    body('timezone')
      .notEmpty().withMessage('Timezone is required')
  ],
  validate,
  updateProfileTimezone
);

export default router;
