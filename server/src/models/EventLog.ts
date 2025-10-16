import { Schema, model } from "mongoose";
import type { IEventLogDocument } from "../types/index.js";

const eventLogSchema = new Schema<IEventLogDocument>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ["created", "updated", "deleted"],
      required: true,
    },
    previousValues: {
      type: Schema.Types.Mixed,
    },
    newValues: {
      type: Schema.Types.Mixed,
    },
    updatedBy: {
      type: String,
      default: "admin",
    },
  },
  {
    timestamps: true,
  },
);

eventLogSchema.index({ eventId: 1, createdAt: -1 });

export default model<IEventLogDocument>("EventLog", eventLogSchema);
