import { Outlet, NavLink, Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useStore } from "@/lib/store";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Package, Monitor, BarChart3, LogOut, Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";

function AdminSidebar() {
  const { t } = useTranslation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const items = [
    { to: "/admin/orders", label: t("admin.nav.orders"), icon: LayoutDashboard },
    { to: "/admin/products", label: t("admin.nav.products"), icon: Package },
    { to: "/admin/computers", label: t("admin.nav.computers"), icon: Monitor },
    { to: "/admin/reports", label: t("admin.nav.reports"), icon: BarChart3 },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className={cn("flex items-center gap-2 px-3 py-4", collapsed && "justify-center px-2")}>
          <div className="h-9 w-9 rounded-lg bg-gradient-primary grid place-items-center shadow-glow shrink-0">
            <Gamepad2 className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-display font-bold leading-none truncate">{t("common.appName")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t("common.admin")}</p>
            </div>
          )}
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => (
                <SidebarMenuItem key={it.to}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={it.to}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-md px-2 py-2 text-sidebar-foreground transition-smooth",
                          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          isActive &&
                            "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary font-medium shadow-[inset_0_0_20px_hsl(var(--primary)/0.15)]",
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <it.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                          {!collapsed && <span>{it.label}</span>}
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

const AdminLayout = () => {
  const { t } = useTranslation();
  const isAuthed = useStore((s) => s.isAuthed);
  const signOut = useStore((s) => s.signOut);
  const nav = useNavigate();

  if (!isAuthed) return <Navigate to="/admin/login" replace />;

  const onSignOut = () => {
    signOut();
    nav("/admin/login");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border bg-card/40 backdrop-blur sticky top-0 z-30 flex items-center px-3 gap-2">
            <SidebarTrigger />
            <div className="flex-1" />
            <LanguageSwitcher />
            <Button variant="outline" size="sm" onClick={onSignOut}>
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t("admin.signOut")}</span>
            </Button>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
