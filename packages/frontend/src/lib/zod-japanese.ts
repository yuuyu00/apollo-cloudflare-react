import { z, ZodErrorMap } from "zod";

export const customJapaneseErrorMap: ZodErrorMap = (issue, ctx) => {
  if (issue.code === z.ZodIssueCode.invalid_type) {
    if (issue.expected === "string") {
      return { message: "文字列を入力してください" };
    }
    if (issue.expected === "number") {
      return { message: "数値を入力してください" };
    }
    if (issue.expected === "boolean") {
      return { message: "真偽値を選択してください" };
    }
    if (issue.expected === "array") {
      return { message: "配列を入力してください" };
    }
    if (issue.expected === "object") {
      return { message: "オブジェクトを入力してください" };
    }
  }

  if (issue.code === z.ZodIssueCode.too_small) {
    if (issue.type === "string") {
      if (issue.minimum === 1) {
        return { message: "必須項目です" };
      }
      return { message: `${issue.minimum}文字以上で入力してください` };
    }
    if (issue.type === "number") {
      return { message: `${issue.minimum}以上の値を入力してください` };
    }
    if (issue.type === "array") {
      if (issue.minimum === 1) {
        return { message: "1つ以上選択してください" };
      }
      return { message: `${issue.minimum}個以上選択してください` };
    }
  }

  if (issue.code === z.ZodIssueCode.too_big) {
    if (issue.type === "string") {
      return { message: `${issue.maximum}文字以内で入力してください` };
    }
    if (issue.type === "number") {
      return { message: `${issue.maximum}以下の値を入力してください` };
    }
    if (issue.type === "array") {
      return { message: `${issue.maximum}個以内で選択してください` };
    }
  }

  if (issue.code === z.ZodIssueCode.invalid_string) {
    if (issue.validation === "email") {
      return { message: "メールアドレスを入力してください" };
    }
    if (issue.validation === "url") {
      return { message: "有効なURLを入力してください" };
    }
    if (issue.validation === "regex") {
      return { message: "入力形式が正しくありません" };
    }
  }

  if (issue.code === z.ZodIssueCode.custom) {
    return { message: issue.message || "入力値が正しくありません" };
  }

  return { message: ctx.defaultError };
};

export const setupZodJapaneseErrorMap = () => {
  z.setErrorMap(customJapaneseErrorMap);
};
