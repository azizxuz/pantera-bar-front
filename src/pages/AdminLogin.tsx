import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const AdminLogin = () => {
  const { t } = useTranslation();
  const nav = useNavigate();
  const signIn = useStore((s) => s.signIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const ok = await signIn(email, password);
      if (ok) nav("/admin/orders");
      else toast.error(t("admin.wrong"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-hero p-4 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/15 blur-[140px]" />

      <div className="relative w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> {t("common.back")}
        </Link>
        <Card className="glass p-8 shadow-elevated">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
                <ShieldCheck className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold leading-tight">
                  {t("admin.login")}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {t("common.appName")}
                </p>
              </div>
            </div>
            <LanguageSwitcher compact />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("admin.email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("admin.password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={busy}
              className="w-full bg-gradient-primary text-primary-foreground shadow-glow h-11"
            >
              {t("admin.signIn")}
            </Button>
            <p className="text-xs text-center text-muted-foreground pt-2">
              {t("admin.demoHint")}
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
