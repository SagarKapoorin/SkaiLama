import { Document, Types  } from 'mongoose';
export interface IProfile {
  name: string;
  timezone: string;
}

export interface IProfileDocument extends IProfile, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEvent {
  title: string;
  description?: string;
  profileIds: Types.ObjectId[];
  timezone: string;
  startDateTime: Date;
  endDateTime: Date;
}

export interface IEventDocument extends IEvent, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEventLog {
  eventId: Types.ObjectId;
  action: 'created' | 'updated' | 'deleted';
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  updatedBy: string;
}

export interface IEventLogDocument extends IEventLog, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type IProfileLean = LeanDocument<IProfileDocument>;

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  count?: number;
  message?: string;
  errors?: any[];
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}
