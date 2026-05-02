import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth } from "@/lib/firebaseAdmin";
import User from "@/models/User";

export class RequestAuthError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type AuthenticatedMongoUser = {
  _id: { toString(): string };
  firebaseId?: string;
  email?: string;
  role?: string;
};

export const getBearerToken = (req: Request) => {
  const header =
    req.headers.get("authorization") ?? req.headers.get("Authorization");

  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  const token = header.slice("Bearer ".length).trim();
  return token || null;
};

export const getGuestIdHeader = (req: Request) => {
  const guestId = req.headers.get("guest-id")?.trim() ?? "";
  return guestId || null;
};

export async function verifyRequestToken(req: Request): Promise<DecodedIdToken> {
  const token = getBearerToken(req);

  if (!token) {
    throw new RequestAuthError(401, "Unauthorized");
  }

  try {
    return await adminAuth().verifyIdToken(token);
  } catch {
    throw new RequestAuthError(401, "Unauthorized");
  }
}

export async function requireMongoUser(
  req: Request,
  select = "_id firebaseId email role"
): Promise<AuthenticatedMongoUser> {
  const decoded = await verifyRequestToken(req);
  const user = (await User.findOne({ firebaseId: decoded.uid })
    .select(select)
    .lean()) as AuthenticatedMongoUser | null;

  if (!user) {
    throw new RequestAuthError(404, "User not found");
  }

  return user;
}

export async function getOptionalMongoUser(
  req: Request,
  select = "_id firebaseId email role"
): Promise<AuthenticatedMongoUser | null> {
  const token = getBearerToken(req);

  if (!token) {
    return null;
  }

  return requireMongoUser(req, select);
}
