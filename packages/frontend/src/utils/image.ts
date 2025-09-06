export type ImageType = "content" | "thumb";

export const getImageUrl = (key: string, type: ImageType = "content"): string => {
  return `${import.meta.env.VITE_IMAGES_ENDPOINT}/${key}?type=${type}`;
};