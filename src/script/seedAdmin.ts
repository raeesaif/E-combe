/**
 * One-time bootstrap script for creating the first admin account.
 *
 * Not exposed over HTTP on purpose: the public /auth/register endpoint
 * deliberately cannot create admin accounts (its role enum only allows
 * "customer" | "seller"), since it has no auth guard. This script is the
 * only way to create the very first privileged account; after that, a
 * protected "create staff" endpoint (using authMiddleware + restrictTo)
 * can create the rest.
 *
 * Usage:
 *   npm run seed:admin -- --email=admin@example.com --password=Secret123 --firstName=Super --lastName=Admin
 */
import 'dotenv/config';
import crypto from 'crypto';
import mongoose from 'mongoose';
import UserModel from '../modules/auth/user.model';
import { env } from '../config/env';

type Args = {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
};

const parseArgs = (argv: string[]): Args => {
  const args: Args = {};
  for (const raw of argv) {
    const match = /^--([^=]+)=(.*)$/.exec(raw);
    if (match) {
      const [, key, value] = match;
      (args as Record<string, string>)[key] = value;
    }
  }
  return args;
};

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const email = args.email?.trim().toLowerCase();
  const firstName = args.firstName?.trim();
  const lastName = args.lastName?.trim();

  if (!email || !firstName || !lastName) {
    console.error(
      'Usage: npm run seed:admin -- --email=you@example.com --password=Secret123 --firstName=First --lastName=Last'
    );
    process.exit(1);
  }

  const password = args.password ?? crypto.randomBytes(6).toString('hex');

  if (password.length < 6) {
    console.error('Password must be at least 6 characters.');
    process.exit(1);
  }

  await mongoose.connect(env.mongoUri);

  const existing = await UserModel.findOne({ email });
  if (existing) {
    console.error(`A user with email "${email}" already exists (role: ${existing.role}).`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const user = await UserModel.create({
    firstName,
    lastName,
    email,
    password,
    role: 'admin',
    isVerified: true,
  });

  console.log('Created admin account:');
  console.log(`  id:       ${user._id.toString()}`);
  console.log(`  email:    ${user.email}`);
  console.log(`  password: ${password}`);
  console.log('Store this password now — it is not saved anywhere in plaintext.');

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
