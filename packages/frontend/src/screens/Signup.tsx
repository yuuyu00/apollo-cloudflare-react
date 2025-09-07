import { useState } from "react";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { Field, Label } from "@/components/ui/fieldset";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { waitlistSchema, type WaitlistFormData } from "@/schemas/auth";

export const Signup = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { joinWaitlist } = useAuth();

  const form = useForm<WaitlistFormData>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: WaitlistFormData) => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const result = await joinWaitlist(data.email);

      if (result.status === "joined") {
        setSuccess(result.message);
        form.reset();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("予期しないエラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight">
          早期アクセスに登録
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          現在、サービスは限定公開中です。
          <br />
          メールアドレスを登録して、早期アクセスの招待をお待ちください。
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success ? (
          <div className="space-y-6">
            <div className="rounded-lg bg-gray-800 border border-gray-700 p-6 text-center">
              <div className="mb-3">
                <svg
                  className="mx-auto h-12 w-12 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                登録が完了しました
              </h3>
              <p className="text-sm text-gray-400 whitespace-pre-wrap">
                {success}
              </p>
            </div>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <Field>
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...form.register("email")}
                placeholder="you@example.com"
                disabled={loading}
                invalid={!!form.formState.errors.email}
              />
              {form.formState.errors.email?.message && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.email.message}
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
                {loading ? "登録中..." : "ウェイトリストに登録"}
              </Button>
            </div>
          </form>
        )}

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
