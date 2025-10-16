import { Schema, model } from 'mongoose';
import type { IProfileDocument } from '../types/index.js';

const profileSchema = new Schema<IProfileDocument>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  timezone: {
    type: String,
    required: [true, 'Timezone is required'],
    default: 'UTC',
    validate: {
      validator: function(v: string) {
        try {
          const dayjs = require('dayjs');
          const timezone = require('dayjs/plugin/timezone');
          dayjs.extend(timezone);
          dayjs.tz('2024-01-01', v);// eg date for testing only
          return true;
        } catch {
          return false;
        }
      },
      message: 'Invalid timezone'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

profileSchema.index({ name: 1 });
profileSchema.index({ createdAt: -1 });

export default model<IProfileDocument>('Profile', profileSchema);
