import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Field, Label } from "@/components/ui/fieldset";

export interface UploadedImage {
  file: File;
  preview: string;
  key?: string;
  size?: number;
  type?: string;
}

interface ImageUploadProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxSize?: number; // in MB
  maxCount?: number;
  disabled?: boolean;
}

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

export const ImageUpload = ({
  images,
  onChange,
  maxSize = 1, // 1MB default
  maxCount = 10,
  disabled = false,
}: ImageUploadProps) => {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "JPG、JPEG、PNGのみアップロード可能です";
    }

    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `ファイルサイズは${maxSize}MB以下にしてください`;
    }

    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const currentCount = images.length;

    if (currentCount + files.length > maxCount) {
      setError(`画像は最大${maxCount}枚までです`);
      return;
    }

    const newImages: UploadedImage[] = [];

    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      const preview = URL.createObjectURL(file);
      newImages.push({ file, preview });
    }

    setError(null);
    onChange([...images, ...newImages]);

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    const removed = newImages.splice(index, 1)[0];

    // Clean up object URL
    URL.revokeObjectURL(removed.preview);

    onChange(newImages);
    setError(null);
  };

  return (
    <Field>
      <Label>画像</Label>

      <div className="space-y-4">
        {/* File input */}
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            multiple
            onChange={handleFileSelect}
            disabled={disabled || images.length >= maxCount}
            className="hidden"
          />
        </div>
        {/* Error message */}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {/* Image previews */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div
                key={index}
                className="relative group aspect-square bg-gray-800 rounded-lg overflow-hidden"
              >
                <img
                  src={image.preview}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  disabled={disabled}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-700 disabled:opacity-50"
                  aria-label="削除"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || images.length >= maxCount}
        >
          画像を選択
        </Button>
      </div>
    </Field>
  );
};
