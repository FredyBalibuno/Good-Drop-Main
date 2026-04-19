import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStaffAuth } from "@/context/staff-auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ShieldAlert } from "lucide-react";

export default function StaffLoginPage() {
  const { signIn } = useStaffAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = signIn(email, password);
    if (ok) {
      navigate("/admin", { replace: true });
    } else {
      setError(true);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-20">
      <Card className="w-full max-w-sm rounded-2xl shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900">
            <ShieldAlert className="size-6 text-sky-700 dark:text-sky-300" />
          </div>
          <CardTitle className="text-xl font-semibold">Staff access</CardTitle>
          <p className="text-sm text-muted-foreground">Sign in with your staff credentials</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(false); }}
                placeholder="admin@goodwill.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                placeholder="••••••••"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-rose-600 dark:text-rose-400">Invalid email or password.</p>
            )}
            <Button type="submit" className="w-full rounded-full">
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
