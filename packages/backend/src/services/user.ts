import { User } from "@prisma/client";
import { UserRepository } from "../repositories/user";
import { notFoundError, validationError, conflictError } from "../errors";

export class UserService {
  constructor(private userRepo: UserRepository) {}

  async getUser(id: number): Promise<User> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw notFoundError("User", id.toString());
    }
    return user;
  }

  async getUserBySub(sub: string): Promise<User | null> {
    return this.userRepo.findBySub(sub);
  }

  async getUsers(args?: { take?: number; skip?: number }): Promise<User[]> {
    return this.userRepo.findMany({
      orderBy: { id: "desc" },
      take: args?.take,
      skip: args?.skip,
    });
  }

  async createUser(input: { email: string; name: string; sub: string }): Promise<User> {
    if (!input.email?.trim()) {
      throw validationError("email", "Email is required");
    }
    if (!input.name?.trim()) {
      throw validationError("name", "Name is required");
    }
    if (!input.sub?.trim()) {
      throw validationError("sub", "Sub is required");
    }

    const existingUserByEmail = await this.userRepo.findByEmail(input.email);
    if (existingUserByEmail) {
      throw conflictError("Email");
    }

    const existingUserBySub = await this.userRepo.findBySub(input.sub);
    if (existingUserBySub) {
      throw conflictError("User");
    }

    return this.userRepo.create({
      email: input.email,
      name: input.name,
      sub: input.sub,
    });
  }

  async updateUser(id: number, input: { name?: string | null; email?: string | null }): Promise<User> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw notFoundError("User", id.toString());
    }

    if (input.name !== undefined && input.name !== null && !input.name.trim()) {
      throw validationError("name", "Name cannot be empty");
    }

    if (input.email !== undefined && input.email !== null) {
      if (!input.email.trim()) {
        throw validationError("email", "Email cannot be empty");
      }

      const existingUser = await this.userRepo.findByEmail(input.email);
      if (existingUser && existingUser.id !== id) {
        throw conflictError("Email");
      }
    }

    return this.userRepo.update(id, {
      name: input.name || undefined,
      email: input.email || undefined,
    });
  }

  async deleteUser(id: number): Promise<User> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw notFoundError("User", id.toString());
    }

    return this.userRepo.delete(id);
  }
}