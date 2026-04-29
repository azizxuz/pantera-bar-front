import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Gamepad2, Monitor, BarChart3, Zap, ShieldCheck } from "lucide-react";

const Landing = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent/20 blur-[120px] pointer-events-none" />

      <header className="relative z-10 container flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
            <Gamepad2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">{t("common.appName")}</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/login">{t("common.admin")}</Link>
          </Button>
        </div>
      </header>

      <main className="relative z-10 container pt-12 pb-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium text-primary mb-6 animate-slide-in">
            <Zap className="h-3.5 w-3.5" />
            {t("landing.badge")}
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6 animate-slide-in">
            <span className="text-gradient-primary">{t("landing.title")}</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-in">
            {t("landing.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-slide-in">
            <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow hover:shadow-glow hover:scale-[1.02] transition-bounce h-12 px-8">
              <Link to="/client">
                <Monitor className="mr-2 h-5 w-5" />
                {t("landing.clientCta")}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-8 border-accent/40 hover:border-accent hover:bg-accent/10">
              <Link to="/admin/login">
                <ShieldCheck className="mr-2 h-5 w-5" />
                {t("landing.adminCta")}
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mt-24 max-w-5xl mx-auto">
          {[
            { icon: Zap, title: t("landing.feature1Title"), desc: t("landing.feature1Desc"), color: "primary" },
            { icon: Monitor, title: t("landing.feature2Title"), desc: t("landing.feature2Desc"), color: "accent" },
            { icon: BarChart3, title: t("landing.feature3Title"), desc: t("landing.feature3Desc"), color: "primary" },
          ].map((f, i) => (
            <div key={i} className="glass rounded-2xl p-6 transition-smooth hover:border-primary/40 hover:-translate-y-1">
              <div className={`h-11 w-11 rounded-xl grid place-items-center mb-4 ${f.color === "primary" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"}`}>
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Landing;
