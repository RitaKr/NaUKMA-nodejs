import { randomUUID } from "crypto";
import { users } from "../storage/memory";
import { saveUsers } from "../storage/fileStore";
import { HttpError } from "./errors";
import { User } from "../types/user";

export class UserService {
  list(): User[] {
    return Array.from(users.values());
  }

  get(id: string): User {
    const user = users.get(id);
    if (!user) {
      throw new HttpError(404, "User not found");
    }
    return user;
  }

  create(input: Omit<User, "id">): User {
    const existingEmail = Array.from(users.values()).find(
      (user) => user.email.toLowerCase() === input.email.toLowerCase()
    );
    if (existingEmail) {
      throw new HttpError(400, "Email already exists");
    }

    const id = randomUUID();
    const user: User = {
      id,
      name: input.name,
      email: input.email
    };
    users.set(id, user);
    saveUsers();
    return user;
  }
}
