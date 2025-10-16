import { Schema, model } from "mongoose";
import type { IEventDocument } from "../types/index.js";

const eventSchema = new Schema<IEventDocument>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    profileIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Profile",
        required: [true, "At least one profile is required"],
      },
    ],
    timezone: {
      type: String,
      required: [true, "Timezone is required"],
    },
    startDateTime: {
      type: Date,
      required: [true, "Start date/time is required"],
    },
    endDateTime: {
      type: Date,
      required: [true, "End date/time is required"],
      validate: {
        validator: function (this: IEventDocument, value: Date) {
          return value > this.startDateTime;
        },
        message: "End date/time must be after start date/time",
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

eventSchema.index({ profileIds: 1, startDateTime: 1 });
eventSchema.index({ startDateTime: 1, endDateTime: 1 });
eventSchema.index({ createdAt: -1 });

eventSchema.virtual("duration").get(function () {
  return this.endDateTime.getTime() - this.startDateTime.getTime();
});

export default model<IEventDocument>("Event", eventSchema);
