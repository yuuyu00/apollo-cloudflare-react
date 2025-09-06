import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { Field, Label } from "@/components/ui/fieldset";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  signupSchema,
  verificationSchema,
  type SignupFormData,
  type VerificationFormData,
} from "@/schemas/auth";

export const Signup = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"signup" | "verify">("signup");
  const [savedEmail, setSavedEmail] = useState("");
  const { signUp, verifyEmail } = useAuth();
  const navigate = useNavigate();

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const verificationForm = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: "",
    },
  });

  const onSignupSubmit = async (data: SignupFormData) => {
    setError(null);
    setLoading(true);

    try {
      const result = await signUp(data.email, data.password);

      if (result.status === "complete") {
        navigate("/");
      } else if (result.status === "needs_verification") {
        setSavedEmail(data.email);
        setStep("verify");
        setError(null);
      } else {
        setError("登録処理で問題が発生しました");
      }
    } catch (err) {
      if (err instanceof Error) {
        if (
          err.message.includes("already exists") ||
          err.message.includes("already been taken")
        ) {
          setError("このメールアドレスは既に登録されています");
        } else if (err.message.includes("invalid")) {
          setError("有効なメールアドレスを入力してください");
        } else if (err.message.includes("password")) {
          setError(
            "パスワードは8文字以上で、大文字・小文字・数字を含む必要があります"
          );
        } else {
          setError(err.message);
        }
      } else {
        setError("登録に失敗しました");
      }
    } finally {
      setLoading(false);
    }
  };

  const onVerificationSubmit = async (data: VerificationFormData) => {
    setError(null);
    setLoading(true);

    try {
      await verifyEmail(data.code);
      navigate("/");
    } catch (err) {
      if (err instanceof Error) {
        if (
          err.message.includes("incorrect") ||
          err.message.includes("invalid")
        ) {
          setError("認証コードが正しくありません");
        } else if (err.message.includes("expired")) {
          setError("認証コードの有効期限が切れています");
        } else {
          setError(err.message);
        }
      } else {
        setError("認証に失敗しました");
      }
    } finally {
      setLoading(false);
    }
  };

  // 認証コード入力画面
  if (step === "verify") {
    return (
      <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight">
            メールアドレスを確認
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {savedEmail} に送信された6桁の認証コードを入力してください
          </p>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form
            className="space-y-6"
            onSubmit={verificationForm.handleSubmit(onVerificationSubmit)}
          >
            <Field>
              <Label htmlFor="code">認証コード</Label>
              <Input
                id="code"
                type="text"
                maxLength={6}
                {...verificationForm.register("code")}
                placeholder="123456"
                className="text-center text-2xl tracking-widest"
                invalid={!!verificationForm.formState.errors.code}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  verificationForm.setValue("code", value);
                }}
              />
              {verificationForm.formState.errors.code?.message && (
                <p className="mt-1 text-sm text-red-500">
                  {verificationForm.formState.errors.code.message}
                </p>
              )}
            </Field>

            <div>
              <Button
                type="submit"
                color="blue"
                className="w-full"
                disabled={
                  loading ||
                  !verificationForm.watch("code") ||
                  verificationForm.watch("code").length !== 6
                }
              >
                {loading ? "確認中..." : "確認"}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <Button
              type="button"
              plain
              className="w-full"
              onClick={() => {
                setStep("signup");
                verificationForm.reset();
                setError(null);
              }}
            >
              戻る
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // サインアップ画面
  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight">
          新規アカウント登録
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form
          className="space-y-6"
          onSubmit={signupForm.handleSubmit(onSignupSubmit)}
        >
          <Field>
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...signupForm.register("email")}
              placeholder="you@example.com"
              disabled={loading}
              invalid={!!signupForm.formState.errors.email}
            />
            {signupForm.formState.errors.email?.message && (
              <p className="mt-1 text-sm text-red-500">
                {signupForm.formState.errors.email.message}
              </p>
            )}
          </Field>

          <Field>
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...signupForm.register("password")}
              placeholder="••••••••"
              disabled={loading}
              invalid={!!signupForm.formState.errors.password}
            />
            {signupForm.formState.errors.password?.message && (
              <p className="mt-1 text-sm text-red-500">
                {signupForm.formState.errors.password.message}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-600">
              6文字以上で入力してください
            </p>
          </Field>

          <Field>
            <Label htmlFor="confirmPassword">パスワード（確認）</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...signupForm.register("confirmPassword")}
              placeholder="••••••••"
              disabled={loading}
              invalid={!!signupForm.formState.errors.confirmPassword}
            />
            {signupForm.formState.errors.confirmPassword?.message && (
              <p className="mt-1 text-sm text-red-500">
                {signupForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </Field>

          <div>
            <Button
              type="submit"
              color="blue"
              className="w-full"
              disabled={loading}
            >
              {loading ? "登録中..." : "新規登録"}
            </Button>
          </div>

          {/* Clerk CAPTCHA用の要素 */}
          <div id="clerk-captcha" />
        </form>

        <p className="mt-10 text-center text-sm text-gray-500">
          既にアカウントをお持ちの場合{" "}
          <Link
            to="/login"
            className="font-semibold leading-6 text-blue-600 hover:text-blue-500"
          >
            ログインはこちら
          </Link>
        </p>
      </div>
    </div>
  );
};
