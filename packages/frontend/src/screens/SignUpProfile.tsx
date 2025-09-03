import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { Field, Label, FieldGroup } from "@/components/ui/fieldset";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { profileSchema, type ProfileFormData } from "@/schemas/auth";

const CHECK_USER = gql`
  query CheckUser {
    me {
      id
      sub
      name
      email
    }
  }
`;

const SIGN_UP = gql`
  mutation SignUp($name: String!) {
    signUp(name: $name) {
      id
      sub
      name
      email
    }
  }
`;

export const SignUpProfile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
    },
  });

  // Check if user already exists in our database
  const { loading: checkingUser } = useQuery(CHECK_USER, {
    skip: !user || authLoading,
    onCompleted: (data) => {
      if (data.me) {
        // User already exists, redirect to home
        navigate("/");
      }
    },
    onError: () => {
      // User doesn't exist yet, stay on this page
    },
  });

  const [signUp, { loading: signingUp }] = useMutation(SIGN_UP, {
    onCompleted: () => {
      showToast("サインアップが完了しました", "success");
      navigate("/");
    },
    onError: (error) => {
      console.error("サインアップエラー:", error);
      setError("サインアップに失敗しました");
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setError(null);

    await signUp({
      variables: {
        name: data.name.trim(),
      },
    });
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  if (authLoading || checkingUser) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-gray-400">確認中...</div>
      </div>
    );
  }

  // Safety check
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background px-4 flex flex-col justify-center w-full sm:px-6 lg:px-8">
      <div className="w-xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-title">プロフィール設定</h1>
          <p className="mt-3 text-text">もう少しでサインアップが完了します。</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-gray-900 p-8 rounded-lg shadow-lg"
        >
          <FieldGroup>
            <Field>
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
                className="bg-gray-800 text-gray-400"
              />
            </Field>

            <Field>
              <Label htmlFor="name">お名前 *</Label>
              <Input
                id="name"
                type="text"
                {...register("name")}
                placeholder="山田 太郎"
                autoFocus
                invalid={!!errors.name}
              />
              {errors.name?.message && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.name.message}
                </p>
              )}
              {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
            </Field>
          </FieldGroup>

          <div className="mt-6">
            <Button
              type="submit"
              color="blue"
              className="w-full"
              disabled={signingUp}
            >
              {signingUp ? "登録中..." : "アカウントを作成"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
