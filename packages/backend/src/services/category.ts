import { Category } from "@prisma/client";
import { CategoryRepository } from "../repositories/category";
import { CreateCategoryInput, UpdateCategoryInput } from "../gqlTypes";
import { notFoundError, validationError } from "../errors";

export class CategoryService {
  constructor(private categoryRepo: CategoryRepository) {}

  async getCategory(id: number): Promise<Category> {
    const category = await this.categoryRepo.findById(id);
    if (!category) {
      throw notFoundError("Category", id.toString());
    }
    return category;
  }

  async getCategories(args?: { take?: number; skip?: number }): Promise<Category[]> {
    return this.categoryRepo.findMany({
      orderBy: { id: "desc" },
      take: args?.take,
      skip: args?.skip,
    });
  }

  async createCategory(input: CreateCategoryInput): Promise<Category> {
    if (!input.name?.trim()) {
      throw validationError("name", "Name is required");
    }

    return this.categoryRepo.create({
      name: input.name,
    });
  }

  async updateCategory(id: number, input: UpdateCategoryInput): Promise<Category> {
    const category = await this.categoryRepo.findById(id);
    if (!category) {
      throw notFoundError("Category", id.toString());
    }

    if (input.name !== undefined && input.name !== null && !input.name.trim()) {
      throw validationError("name", "Name cannot be empty");
    }

    return this.categoryRepo.update(id, {
      name: input.name || undefined,
    });
  }

  async deleteCategory(id: number): Promise<Category> {
    const category = await this.categoryRepo.findById(id);
    if (!category) {
      throw notFoundError("Category", id.toString());
    }

    return this.categoryRepo.delete(id);
  }
}