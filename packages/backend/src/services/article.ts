import { Article } from "@prisma/client";
import { ArticleRepository } from "../repositories/article";
import { UserRepository } from "../repositories/user";
import { CategoryRepository } from "../repositories/category";
import { ImageArticleRepository } from "../repositories/image";
import { CreateArticleInput, UpdateArticleInput } from "../gqlTypes";
import { notFoundError, validationError, forbiddenError } from "../errors";

export class ArticleService {
  constructor(
    private articleRepo: ArticleRepository,
    private userRepo: UserRepository,
    private categoryRepo: CategoryRepository,
    private imageRepo: ImageArticleRepository
  ) {}

  async getArticle(id: number): Promise<Article> {
    const article = await this.articleRepo.findById(id);
    if (!article) {
      throw notFoundError("Article", id.toString());
    }
    return article;
  }

  async getArticles(args?: {
    take?: number;
    skip?: number;
  }): Promise<Article[]> {
    return this.articleRepo.findMany({
      orderBy: { id: "desc" },
      take: args?.take,
      skip: args?.skip,
    });
  }

  async getArticlesByAuthor(authorId: number): Promise<Article[]> {
    return this.articleRepo.findMany({
      where: { userId: authorId },
      orderBy: { id: "desc" },
    });
  }

  async createArticle(
    input: CreateArticleInput,
    userId: number
  ): Promise<Article> {
    if (!input.title?.trim()) {
      throw validationError("title", "Title is required");
    }
    if (!input.content?.trim()) {
      throw validationError("content", "Content is required");
    }

    if (input.categoryIds && input.categoryIds.length > 0) {
      const categories = await Promise.all(
        input.categoryIds.map((id) => this.categoryRepo.findById(id))
      );

      const notFoundIds = input.categoryIds.filter(
        (id, index) => !categories[index]
      );

      if (notFoundIds.length > 0) {
        throw notFoundError("Categories", notFoundIds.join(", "));
      }
    }

    const article = await this.articleRepo.create({
      title: input.title,
      content: input.content,
      user: {
        connect: { id: userId },
      },
      categories: input.categoryIds
        ? {
            connect: input.categoryIds.map((id) => ({ id })),
          }
        : undefined,
    });

    if (input.images && input.images.length > 0) {
      await this.imageRepo.createMany(
        input.images.map((image) => ({
          articleId: article.id,
          key: image.key,
          size: image.size,
          type: image.type,
        }))
      );
    }

    return article;
  }

  async updateArticle(
    id: number,
    input: UpdateArticleInput,
    userId: number
  ): Promise<Article> {
    const article = await this.articleRepo.findById(id);
    if (!article) {
      throw notFoundError("Article", id.toString());
    }

    if (article.userId !== userId) {
      throw forbiddenError("edit this article");
    }

    if (
      input.title !== undefined &&
      input.title !== null &&
      !input.title.trim()
    ) {
      throw validationError("title", "Title cannot be empty");
    }
    if (
      input.content !== undefined &&
      input.content !== null &&
      !input.content.trim()
    ) {
      throw validationError("content", "Content cannot be empty");
    }

    if (input.categoryIds !== undefined && input.categoryIds !== null) {
      if (input.categoryIds.length > 0) {
        const categories = await Promise.all(
          input.categoryIds.map((categoryId) =>
            this.categoryRepo.findById(categoryId)
          )
        );

        const notFoundIds = input.categoryIds.filter(
          (categoryId, index) => !categories[index]
        );

        if (notFoundIds.length > 0) {
          throw notFoundError("Categories", notFoundIds.join(", "));
        }
      }
    }

    return this.articleRepo.update(id, {
      title: input.title || undefined,
      content: input.content || undefined,
      categories:
        input.categoryIds !== undefined && input.categoryIds !== null
          ? {
              set: input.categoryIds.map((categoryId) => ({ id: categoryId })),
            }
          : undefined,
    });
  }

  async deleteArticle(id: number, userId: number): Promise<Article> {
    const article = await this.articleRepo.findById(id);
    if (!article) {
      throw notFoundError("Article", id.toString());
    }

    if (article.userId !== userId) {
      throw forbiddenError("delete this article");
    }

    return this.articleRepo.delete(id);
  }
}
