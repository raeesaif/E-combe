import "dotenv/config";

export const env = {
    port: Number(process.env.PORT) || 5000,
    mongoUri: process.env.MONGO_URI || "",
    clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
};