"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Checkbox from "../../../components/ui/checkbox";
import { users } from "@/constants/users";
import { Eye, EyeOff } from "lucide-react";

export default function AccountLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const user = users.find((u) => u.email === email && u.password === password);
    if (user) {
      if (remember) {
        localStorage.setItem("user", JSON.stringify({ email: user.email }));
      } else {
        sessionStorage.setItem("user", JSON.stringify({ email: user.email }));
      }
      setSuccess(true);
      setTimeout(() => {
        router.push("/account");
      }, 1000);
    } else {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>Please enter your credentials below</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Demo Credentials */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Demo Credentials</h3>
            <div className="text-xs text-blue-700 space-y-1">
              <p><strong>Email:</strong> demo@test.com | <strong>Password:</strong> 123456</p>
              <p><strong>Email:</strong> john1@gmail.com | <strong>Password:</strong> 123456</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-600 text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm">Login successful!</p>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <Input
                type="email"
                placeholder="john1@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <Checkbox
                id="remember"
                checked={remember}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const { checked } = e.currentTarget;
                  setRemember(checked);
                }}
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                Remember Me
              </label>
            </div>
            <Button
              type="submit"
              className="w-40 mx-auto flex justify-center bg-orange-600 hover:bg-orange-700 cursor-pointer"
              disabled={success}
            >
              Login
            </Button>
          </form>

          <p className="text-xs text-gray-500 mt-4 text-center">
            By logging in to your account you&apos;re agreeing to our{' '}
            <a href="#" className="underline">
              Terms &amp; Conditions
            </a>,{' '}
            <a href="#" className="underline">
              Privacy Policy
            </a>{' '}
            and{' '}
            <a href="#" className="underline">
              Data Use Policy
            </a>.
          </p>

          <div className="flex justify-between mt-4 text-sm">
            <a href="#" className="text-orange-600 hover:underline">
              Forgot Password?
            </a>
            <Link href="/account/register" className="text-orange-600 hover:underline">
              Create an account
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
