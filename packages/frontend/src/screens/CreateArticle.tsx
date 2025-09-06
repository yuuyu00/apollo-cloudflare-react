import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@clerk/clerk-react";
import { useToast } from "@/contexts/ToastContext";
import { Field, Label, FieldGroup } from "@/components/ui/fieldset";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUpload, type UploadedImage } from "@/components/ImageUpload";
import { uploadImage } from "@/utils/imageUpload";
import {
  createArticleSchema,
  type CreateArticleFormData,
} from "@/schemas/article";
import type { GetCategoriesQuery } from "@/generated-graphql/graphql";

const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
    }
  }
`;

const CREATE_ARTICLE = gql`
  mutation CreateArticle($input: CreateArticleInput!) {
    createArticle(input: $input) {
      id
      title
      content
      categories {
        id
        name
      }
      images {
        id
        key
        size
        type
      }
    }
  }
`;

interface ImageInput {
  key: string;
  size: number;
  type: string;
}

export const CreateArticle = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { getToken } = useAuth();
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CreateArticleFormData>({
    resolver: zodResolver(createArticleSchema),
    defaultValues: {
      title: "",
      content: "",
      categoryIds: [],
    },
  });

  const { data: categoriesData } = useQuery<GetCategoriesQuery>(GET_CATEGORIES);

  const [createArticle, { loading }] = useMutation(CREATE_ARTICLE, {
    onCompleted: () => {
      showToast("記事を投稿しました", "success");
      navigate("/");
    },
    onError: (error) => {
      console.error("Create article error:", error);
      showToast("記事の投稿に失敗しました", "error");
    },
  });

  useEffect(() => {
    setValue("categoryIds", selectedCategoryIds);
  }, [selectedCategoryIds, setValue]);

  useEffect(() => {
    // Cleanup preview URLs on unmount
    return () => {
      images.forEach((image) => URL.revokeObjectURL(image.preview));
    };
  }, []);

  const uploadImages = async (): Promise<ImageInput[]> => {
    const uploadedImages: ImageInput[] = [];

    for (const image of images) {
      try {
        const result = await uploadImage(
          image.file,
          import.meta.env.VITE_IMAGE_UPLOAD_URL,
          getToken
        );

        uploadedImages.push({
          key: result.key,
          size: result.size,
          type: result.type,
        });
      } catch (error) {
        console.error("Failed to upload image:", error);
        throw new Error(`画像のアップロードに失敗しました: ${image.file.name}`);
      }
    }

    return uploadedImages;
  };

  const onSubmit = async (data: CreateArticleFormData) => {
    setIsUploading(true);

    try {
      // Upload images first if any
      const uploadedImages: ImageInput[] =
        images.length > 0 ? await uploadImages() : [];

      // Create article with uploaded image references
      await createArticle({
        variables: {
          input: {
            title: data.title.trim(),
            content: data.content.trim(),
            categoryIds: data.categoryIds,
            images: uploadedImages,
          },
        },
      });
    } catch (error) {
      console.error("Submit error:", error);
      showToast(
        error instanceof Error ? error.message : "記事の投稿に失敗しました",
        "error"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const isSubmitting = loading || isUploading;

  return (
    <div className="min-h-screen bg-background px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-title">新規記事投稿</h1>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 bg-gray-900 p-8 rounded-lg shadow-lg"
        >
          <FieldGroup>
            <Field>
              <Label htmlFor="title">タイトル *</Label>
              <Input
                id="title"
                type="text"
                {...register("title")}
                placeholder="記事のタイトルを入力してください"
                invalid={!!errors.title}
              />
              {errors.title?.message && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.title.message}
                </p>
              )}
            </Field>

            <Field>
              <Label>カテゴリー</Label>
              <div className="flex flex-wrap gap-2">
                {categoriesData?.categories.map((category) => {
                  const isSelected = selectedCategoryIds.includes(category.id);
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedCategoryIds(
                            selectedCategoryIds.filter(
                              (id) => id !== category.id
                            )
                          );
                        } else {
                          setSelectedCategoryIds([
                            ...selectedCategoryIds,
                            category.id,
                          ]);
                        }
                      }}
                      className={`
                        px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                        ${
                          isSelected
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                        }
                      `}
                    >
                      {category.name}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-sm text-gray-400">
                カテゴリーをクリックして選択・解除できます
              </p>
            </Field>

            <Field>
              <Label htmlFor="content">本文 *</Label>
              <Textarea
                id="content"
                rows={10}
                {...register("content")}
                placeholder="記事の本文を入力してください"
                invalid={!!errors.content}
              />
              {errors.content?.message && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.content.message}
                </p>
              )}
            </Field>

            <ImageUpload
              images={images}
              onChange={setImages}
              maxSize={1}
              maxCount={10}
              disabled={isSubmitting}
            />
          </FieldGroup>

          <div className="flex items-center justify-between pt-6">
            <Button type="button" plain onClick={() => navigate("/")}>
              キャンセル
            </Button>
            <Button type="submit" color="blue" disabled={isSubmitting}>
              {isUploading
                ? "画像をアップロード中..."
                : loading
                  ? "記事を投稿中..."
                  : "記事を投稿"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
