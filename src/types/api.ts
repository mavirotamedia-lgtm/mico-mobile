export type UserRole = "USER" | "ADMIN";

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export type AuthResult = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
};

export type BoatType = "SAILBOAT" | "MOTORBOAT" | "YACHT" | "OTHER";

export type Boat = {
  id: string;
  ownerId: string;
  name: string;
  type: BoatType;
  brand: string | null;
  model: string | null;
  buildYear: number | null;
  lengthMeters: number | null;
  engineType: string | null;
  homePort: string | null;
  registrationNumber: string | null;
  image: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateBoatInput = {
  name: string;
  type?: BoatType;
  brand?: string;
  model?: string;
  buildYear?: number;
  lengthMeters?: number;
  engineType?: string;
  homePort?: string;
  registrationNumber?: string;
  image?: string;
};

export type MaintenanceCategory = "ENGINE" | "HULL" | "ELECTRICAL" | "SAFETY" | "OTHER";

export type MaintenanceRecord = {
  id: string;
  boatId: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  performedAt: string;
  cost: number | null;
  nextDueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateMaintenanceInput = {
  title: string;
  description: string;
  category?: MaintenanceCategory;
  performedAt: string;
  cost?: number;
  nextDueDate?: string;
};

export type ApiErrorBody = {
  error: { message: string; details?: unknown };
};
