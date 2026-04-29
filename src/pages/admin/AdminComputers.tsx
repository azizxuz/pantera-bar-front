import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, RotateCw, Copy, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import type { Computer } from "@/lib/types";

const AdminComputers = () => {
  const { t } = useTranslation();
  const computers = useStore((s) => s.computers);
  const addComputer = useStore((s) => s.addComputer);
  const rotateToken = useStore((s) => s.rotateToken);
  const toggleComputer = useStore((s) => s.toggleComputer);
  const deleteComputer = useStore((s) => s.deleteComputer);
  const [search, setSearch] = useState("");
  const [openTokens, setOpenTokens] = useState<Record<string, boolean>>({});
  const [details, setDetails] = useState<Computer | null>(null);

  const filtered = computers
    .filter((c) => !search || c.number.toString().includes(search))
    .sort((a, b) => a.number - b.number);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("admin.computers.tokenCopied"));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{t("admin.computers.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("admin.computers.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder={t("common.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-32 sm:w-48"
          />
          <Button onClick={() => { addComputer(); toast.success(t("admin.computers.new")); }} className="bg-gradient-primary text-primary-foreground shadow-glow">
            <Plus className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">{t("admin.computers.new")}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filtered.map((c) => {
          const visible = openTokens[c.id];
          return (
            <Card key={c.id} className="glass p-4 transition-smooth hover:border-primary/40">
              <div className="flex items-center justify-between mb-3">
                <div className="font-display text-2xl font-bold text-gradient-primary">#{c.number}</div>
                <Badge variant="outline" className={c.enabled ? "bg-success/15 text-success border-success/30" : "bg-muted text-muted-foreground"}>
                  {c.enabled ? t("admin.computers.enabled") : t("admin.computers.disabled")}
                </Badge>
              </div>
              <div className="text-[11px] text-muted-foreground mb-2 font-mono break-all bg-secondary/40 rounded p-2">
                {visible ? c.token : c.token.slice(0, 8) + "•".repeat(16)}
              </div>
              <div className="flex items-center justify-between mb-3">
                <Switch checked={c.enabled} onCheckedChange={() => toggleComputer(c.id)} />
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setOpenTokens((o) => ({ ...o, [c.id]: !visible }))}>
                  {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="outline" className="h-8 flex-1" onClick={() => copy(c.token)} title={t("common.copy")}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="outline" className="h-8 flex-1" onClick={() => { rotateToken(c.id); toast.success(t("admin.computers.rotate")); }} title={t("admin.computers.rotate")}>
                  <RotateCw className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="outline" className="h-8 hover:bg-destructive/10 hover:border-destructive/40 hover:text-destructive" onClick={() => deleteComputer(c.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminComputers;
