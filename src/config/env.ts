import "dotenv/config";

export const env = {
    port: Number(process.env.PORT) || 5000,
    mongoUri: process.env.MONGO_URI || "",
};