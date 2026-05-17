import "./env";

export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const USE_MOCK_DB = process.env.USE_MOCK_DB === "true";
