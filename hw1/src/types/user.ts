export type UserRole = "USER" | "ADMIN";

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string | null;
  role: UserRole;
  oauthProvider: string | null;
  oauthId: string | null;
}

export type SafeUser = Omit<User, "passwordHash" | "oauthProvider" | "oauthId">;
