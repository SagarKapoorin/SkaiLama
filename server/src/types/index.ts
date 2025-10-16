import { Document, Types } from "mongoose";
export interface IProfile {
  _id: Types.ObjectId;
  name: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

export interface IProfileDocument extends Omit<IProfile, "_id">, Document {
  _id: Types.ObjectId;
}
export interface IEvent {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  profileIds: Types.ObjectId[];
  timezone: string;
  startDateTime: Date;
  endDateTime: Date;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

export interface IEventDocument extends Omit<IEvent, "_id">, Document {
  _id: Types.ObjectId;
}
export interface IEventLog {
  _id: Types.ObjectId;
  eventId: Types.ObjectId;
  action: "created" | "updated" | "deleted";
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

export interface IEventLogDocument extends Omit<IEventLog, "_id">, Document {
  _id: Types.ObjectId;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  count?: number;
  total?: number;
  skip?: number;
  limit?: number;
  message?: string;
  errors?: any[];
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}
