import type { Request, Response, NextFunction } from "express";
import Profile from "../models/Profile.js";
import type {
  ApiResponse,
  IProfile,
  IProfileDocument,
} from "../types/index.js";
import {
  deleteCachedData,
  deleteCachedDataByPattern,
  generateCacheKey,
} from "../utils/cacheHelper.js";

export const createProfile = async (
  req: Request,
  res: Response<ApiResponse<IProfileDocument>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, timezone } = req.body;
    const profile = await Profile.create({ name, timezone });

    await deleteCachedData(generateCacheKey.allProfiles());

    res.status(201).json({
      success: true,
      message: "Profile created successfully",
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};
export const getAllProfiles = async (
  req: Request,
  res: Response<ApiResponse<IProfile[]>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const limit = parseInt((req.query.limit as string) || "100", 10);
    const skip = parseInt((req.query.skip as string) || "0", 10);
    const total = await Profile.countDocuments();
    const profiles = await Profile.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<IProfile[]>();

    res.status(200).json({
      success: true,
      count: profiles.length,
      total,
      skip,
      limit,
      data: profiles,
    });
  } catch (error) {
    next(error);
  }
};
export const getProfileById = async (
  req: Request,
  res: Response<ApiResponse<IProfile>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const { profileId } = req.params;
    const profile = await Profile.findById(profileId).lean<IProfile>();

    if (!profile) {
      const error: any = new Error("Profile not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfileTimezone = async (
  req: Request,
  res: Response<ApiResponse<IProfileDocument>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const { profileId } = req.params;
    const { timezone } = req.body;

    const profile = await Profile.findByIdAndUpdate(
      profileId,
      { timezone },
      { new: true, runValidators: true },
    );

    if (!profile || !profileId) {
      const error: any = new Error("Profile not found");
      error.statusCode = 404;
      throw error;
    }

    await deleteCachedData(generateCacheKey.profileById(profileId));
    await deleteCachedData(generateCacheKey.allProfiles());
    await deleteCachedDataByPattern(`events:profile:${profileId}:*`);

    res.status(200).json({
      success: true,
      message: "Profile timezone updated successfully",
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};
