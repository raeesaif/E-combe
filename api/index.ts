import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../src/app';
import { connectDB } from '../src/config/db';

let dbConnection: Promise<void> | null = null;

const ensureDbConnected = (): Promise<void> => {
  if (!dbConnection) {
    dbConnection = connectDB().catch((error) => {
      dbConnection = null;
      throw error;
    });
  }

  return dbConnection;
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  await ensureDbConnected();
  app(req, res);
}
