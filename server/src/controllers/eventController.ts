import type { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import Event from "../models/Event.js";
import EventLog from "../models/EventLog.js";
import {
  convertToUTC,
  formatDateTime,
  validateDateRange,
} from "../utils/timezoneHelper.js";
import type { ApiResponse, IEventDocument } from "../types/index.js";
import {
  deleteCachedData,
  deleteCachedDataByPattern,
  generateCacheKey,
} from "../utils/cacheHelper.js";

export const createEvent = async (
  req: Request,
  res: Response<ApiResponse<IEventDocument>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      title,
      description,
      profileIds,
      timezone,
      startDateTime,
      endDateTime,
    } = req.body;

    if (!validateDateRange(startDateTime, endDateTime, timezone)) {
      const error: any = new Error(
        "End date/time must be after start date/time",
      );
      error.statusCode = 400;
      throw error;
    }

    const event = await Event.create({
      title,
      description,
      profileIds: profileIds.map((id: string) => new Types.ObjectId(id)),
      timezone,
      startDateTime: convertToUTC(startDateTime, timezone),
      endDateTime: convertToUTC(endDateTime, timezone),
    });

    // Populate profile details
    await event.populate("profileIds", "name timezone");
    await EventLog.create({
      eventId: event._id,
      action: "created",
      newValues: event.toObject(),
    });

    for (const profileId of profileIds) {
      await deleteCachedDataByPattern(`events:profile:${profileId}:*`);
    }

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

export const getEventsByProfile = async (
  req: Request,
  res: Response<ApiResponse<any[]>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const { profileId } = req.params;
    const clientTimezone = req.clientTimezone || "UTC";
    const limit = parseInt((req.query.limit as string) || "100", 10);
    const skip = parseInt((req.query.skip as string) || "0", 10);
    const filter = { profileIds: new Types.ObjectId(profileId) };
    const total = await Event.countDocuments(filter);
    const events = await Event.find(filter)
      .sort({ startDateTime: 1 })
      .skip(skip)
      .limit(limit)
      .populate("profileIds", "name timezone")
      .lean();

    const formattedEvents = events.map((event) => ({
      ...event,
      startDateTime: formatDateTime(event.startDateTime, clientTimezone),
      endDateTime: formatDateTime(event.endDateTime, clientTimezone),
      displayTimezone: clientTimezone,
      createdAt: formatDateTime(event.createdAt, clientTimezone),
      updatedAt: formatDateTime(event.updatedAt, clientTimezone),
    }));

    res.status(200).json({
      success: true,
      count: formattedEvents.length,
      total,
      skip,
      limit,
      data: formattedEvents,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllEvents = async (
  req: Request,
  res: Response<ApiResponse<any[]>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const clientTimezone = req.clientTimezone || "UTC";
    // Pagination parameters
    const limit = parseInt((req.query.limit as string) || "100", 10);
    const skip = parseInt((req.query.skip as string) || "0", 10);
    // Total count before pagination
    const total = await Event.countDocuments();
    // Fetch paginated events
    const events = await Event.find()
      .sort({ startDateTime: 1 })
      .skip(skip)
      .limit(limit)
      .populate("profileIds", "name timezone")
      .lean();

    const formattedEvents = events.map((event) => ({
      ...event,
      startDateTime: formatDateTime(event.startDateTime, clientTimezone),
      endDateTime: formatDateTime(event.endDateTime, clientTimezone),
      displayTimezone: clientTimezone,
      createdAt: formatDateTime(event.createdAt, clientTimezone),
      updatedAt: formatDateTime(event.updatedAt, clientTimezone),
    }));

    res.status(200).json({
      success: true,
      // Number of items returned in this page
      count: formattedEvents.length,
      // Total number of items available
      total,
      // Pagination info
      skip,
      limit,
      data: formattedEvents,
    });
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (
  req: Request,
  res: Response<ApiResponse<any>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const { eventId } = req.params;
    const clientTimezone = req.clientTimezone || "UTC";

    const event = await Event.findById(eventId)
      .populate("profileIds", "name timezone")
      .lean();

    if (!event) {
      const error: any = new Error("Event not found");
      error.statusCode = 404;
      throw error;
    }

    // Convert dates to client timezone
    const formattedEvent = {
      ...event,
      startDateTime: formatDateTime(event.startDateTime, clientTimezone),
      endDateTime: formatDateTime(event.endDateTime, clientTimezone),
      displayTimezone: clientTimezone,
      createdAt: formatDateTime(event.createdAt, clientTimezone),
      updatedAt: formatDateTime(event.updatedAt, clientTimezone),
    };

    res.status(200).json({
      success: true,
      data: formattedEvent,
    });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (
  req: Request,
  res: Response<ApiResponse<IEventDocument>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const { eventId } = req.params;
    const {
      title,
      description,
      profileIds,
      timezone,
      startDateTime,
      endDateTime,
    } = req.body;

    const existingEvent = await Event.findById(eventId);

    if (!existingEvent || !eventId) {
      const error: any = new Error("Event not found");
      error.statusCode = 404;
      throw error;
    }

    const previousValues = existingEvent.toObject();
    const updates: any = {};

    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;

    if (profileIds && Array.isArray(profileIds)) {
      updates.profileIds = profileIds.map(
        (id: string) => new Types.ObjectId(id),
      );
    }

    if (startDateTime && endDateTime && timezone) {
      if (!validateDateRange(startDateTime, endDateTime, timezone)) {
        const error: any = new Error(
          "End date/time must be after start date/time",
        );
        error.statusCode = 400;
        throw error;
      }
      updates.startDateTime = convertToUTC(startDateTime, timezone);
      updates.endDateTime = convertToUTC(endDateTime, timezone);
      updates.timezone = timezone;
    } else if (startDateTime || endDateTime) {
      const error: any = new Error(
        "Both startDateTime and endDateTime must be provided together",
      );
      error.statusCode = 400;
      throw error;
    }

    const updatedEvent = await Event.findByIdAndUpdate(eventId, updates, {
      new: true,
      runValidators: false,
      context: "query",
    }).populate("profileIds", "name timezone");

    if (!updatedEvent) {
      const error: any = new Error("Event update failed");
      error.statusCode = 500;
      throw error;
    }

    // Log the change
    await EventLog.create({
      eventId,
      action: "updated",
      previousValues,
      newValues: updatedEvent.toObject(),
    });

    const allProfileIds = new Set([
      ...existingEvent.profileIds.map((id) => id.toString()),
      ...(updates.profileIds || existingEvent.profileIds).map((id: any) =>
        id.toString(),
      ),
    ]);

    for (const profileId of allProfileIds) {
      await deleteCachedDataByPattern(`events:profile:${profileId}:*`);
    }
    await deleteCachedData(generateCacheKey.eventById(eventId));
    await deleteCachedData(generateCacheKey.eventLogs(eventId));

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: updatedEvent,
    });
  } catch (error) {
    next(error);
  }
};

export const getEventLogs = async (
  req: Request,
  res: Response<ApiResponse<any[]>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const { eventId } = req.params;
    const clientTimezone = req.clientTimezone || "UTC";
    // Pagination parameters
    const limit = parseInt((req.query.limit as string) || "100", 10);
    const skip = parseInt((req.query.skip as string) || "0", 10);
    // Filter by eventId
    const filter = { eventId: new Types.ObjectId(eventId) };
    // Total count before pagination
    const total = await EventLog.countDocuments(filter);
    // Fetch paginated logs
    const logs = await EventLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const formattedLogs = logs.map((log) => ({
      ...log,
      createdAt: formatDateTime(log.createdAt, clientTimezone),
      updatedAt: formatDateTime(log.updatedAt, clientTimezone),
      displayTimezone: clientTimezone,
      previousValues: log.previousValues
        ? {
            ...log.previousValues,
            startDateTime: log.previousValues.startDateTime
              ? formatDateTime(
                  new Date(log.previousValues.startDateTime),
                  clientTimezone,
                )
              : undefined,
            endDateTime: log.previousValues.endDateTime
              ? formatDateTime(
                  new Date(log.previousValues.endDateTime),
                  clientTimezone,
                )
              : undefined,
          }
        : undefined,
      newValues: log.newValues
        ? {
            ...log.newValues,
            startDateTime: log.newValues.startDateTime
              ? formatDateTime(
                  new Date(log.newValues.startDateTime),
                  clientTimezone,
                )
              : undefined,
            endDateTime: log.newValues.endDateTime
              ? formatDateTime(
                  new Date(log.newValues.endDateTime),
                  clientTimezone,
                )
              : undefined,
          }
        : undefined,
    }));

    res.status(200).json({
      success: true,
      // Number of items returned in this page
      count: formattedLogs.length,
      // Total number of items available
      total,
      // Pagination info
      skip,
      limit,
      data: formattedLogs,
    });
  } catch (error) {
    next(error);
  }
};
