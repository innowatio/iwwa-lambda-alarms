import dotenv from "dotenv";

dotenv.load({silent: true});

export const MONGODB_URL = process.env.MONGODB_URL || "mongodb://localhost:27017/test";
export const LOG_LEVEL = process.env.LOG_LEVEL || "info";
export const ALARMS_COLLECTION_NAME = "alarms";
export const ALARMS_AGGREGATES_COLLECTION_NAME = "alarms-aggregates";
export const DAILY_AGGREGATES_COLLECTION_NAME = "readings-daily-aggregates";
export const CONSUMPTION_AGGREGATES_COLLECTION_NAME = "consumptions-yearly-aggregates";
export const NOTIFICATIONS_API_ENDPOINT = process.env.NOTIFICATIONS_API_ENDPOINT || "http://myapi.com/notifications";
