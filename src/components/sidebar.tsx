/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChevronDown, CircleHelp, Cog, FileQuestion, IterationCcw, LayoutDashboard, LifeBuoy, MessageCircle } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useInstance } from "@/contexts/InstanceContext";

import { cn } from "@/lib/utils";

import { Button } from "./ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";

function Sidebar() {
  const { t } = useTranslation();

  const Menus = useMemo(
    () => [
      {
        id: "dashboard",
        title: t("sidebar.dashboard"),
        icon: LayoutDashboard,
        path: ({ instanceId }: { instanceId?: string }) => (instanceId ? `/manager/instance/${instanceId}/dashboard` : "/manager"),
      },
      {
        navLabel: true,
        title: t("sidebar.management"),
        icon: Cog,
        children: [
          {
            id: "contacts",
            title: t("sidebar.contacts"),
            path: "/manager/contacts",
          },
          {
            id: "broadcast",
            title: t("sidebar.broadcast"),
            path: "/manager/broadcast",
          },
          {
            id: "aiSettings",
            title: t("sidebar.aiSettings"),
            path: "/manager/ai-settings",
          },
          {
            id: "apiKeys",
            title: t("sidebar.apiKeys"),
            path: "/manager/api-keys",
          },
        ],
      },
      {
        navLabel: true,
        title: t("sidebar.configurations"),
        icon: Cog,
        children: [
          {
            id: "settings",
            title: t("sidebar.settings"),
            path: ({ instanceId }: { instanceId?: string }) => `/manager/instance/${instanceId}/settings`,
          },
          {
            id: "proxy",
            title: t("sidebar.proxy"),
            path: ({ instanceId }: { instanceId?: string }) => `/manager/instance/${instanceId}/proxy`,
          },
        ],
      },
      {
        title: t("sidebar.events"),
        icon: IterationCcw,
        children: [
          {
            id: "webhook",
            title: t("sidebar.webhook"),
            path: ({ instanceId }: { instanceId?: string }) => `/manager/instance/${instanceId}/webhook`,
          },
          {
            id: "websocket",
            title: t("sidebar.websocket"),
            path: ({ instanceId }: { instanceId?: string }) => `/manager/instance/${instanceId}/websocket`,
          },
          {
            id: "rabbitmq",
            title: t("sidebar.rabbitmq"),
            path: ({ instanceId }: { instanceId?: string }) => `/manager/instance/${instanceId}/rabbitmq`,
          },
        ],
      },
      {
        id: "documentation",
        title: t("sidebar.documentation"),
        icon: FileQuestion,
        link: "https://doc.evolution-api.com",
        divider: true,
      },
      {
        id: "postman",
        title: t("sidebar.postman"),
        icon: CircleHelp,
        link: "https://evolution-api.com/postman",
      },
      {
        id: "discord",
        title: t("sidebar.discord"),
        icon: MessageCircle,
        link: "https://evolution-api.com/discord",
      },
      {
        id: "support-premium",
        title: t("sidebar.supportPremium"),
        icon: LifeBuoy,
        link: "https://evolution-api.com/suporte-pro",
      },
    ],
    [t],
  );

  const navigate = useNavigate();
  const { pathname } = useLocation();

  const { instance } = useInstance();

  const resolvePath = (path: string | ((args: { instanceId?: string }) => string) | undefined) => {
    if (!path) return undefined;
    return typeof path === "function" ? path({ instanceId: instance?.id }) : path;
  };

  const handleNavigate = (menu?: any) => {
    if (!menu) return;

    const nextPath = resolvePath(menu.path);
    if (nextPath) navigate(nextPath);
    if (menu.link) window.open(menu.link, "_blank");
  };

  const links = useMemo(
    () =>
      Menus.map((menu) => ({
        ...menu,
        children:
          "children" in menu
            ? menu.children?.map((child) => ({
                ...child,
                resolvedPath: resolvePath(child.path),
                isActive: "path" in child ? pathname === resolvePath(child.path) : false,
              }))
            : undefined,
        resolvedPath: "path" in menu ? resolvePath(menu.path) : undefined,
        isActive: "path" in menu && menu.path ? pathname === resolvePath(menu.path) : false,
      })).map((menu) => ({
        ...menu,
        isActive: menu.isActive || ("children" in menu && menu.children?.some((child) => child.isActive)),
      })),
    [Menus, instance?.id, pathname],
  );

  return (
    <div className="flex h-full w-full flex-col border-r border-border">
      <div className="px-3 py-4 border-b border-border">
        <div className="text-sm font-bold text-primary">FMX Evolution</div>
        <div className="text-xs text-muted-foreground">Multi-tenant SaaS</div>
      </div>
      <ul className="flex h-full w-full flex-col gap-2 px-2">
        {links.map((menu) => (
          <li key={menu.title} className={"divider" in menu ? "mt-auto" : undefined}>
          {menu.children ? (
            <Collapsible defaultOpen={menu.isActive}>
              <CollapsibleTrigger asChild>
                <Button className={cn("flex w-full items-center justify-start gap-2")} variant={menu.isActive ? "secondary" : "link"}>
                  {menu.icon && <menu.icon size="15" />}
                  <span>{menu.title}</span>
                  <ChevronDown size="15" className="ml-auto" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul className="my-4 ml-6 flex flex-col gap-2 text-sm">
                  {menu.children.map((child) => (
                    <li key={child.id}>
                      <button onClick={() => handleNavigate(child)} className={cn(child.isActive ? "text-foreground" : "text-muted-foreground")}>
                        <span className="nav-label">{child.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <Button className={cn("relative flex w-full items-center justify-start gap-2", menu.isActive && "pointer-events-none")} variant={menu.isActive ? "secondary" : "link"}>
              {"link" in menu && <a href={menu.link} target="_blank" rel="noreferrer" className="absolute inset-0 h-full w-full" />}
              {"resolvedPath" in menu && menu.resolvedPath && <Link to={menu.resolvedPath} className="absolute inset-0 h-full w-full" />}
              {menu.icon && <menu.icon size="15" />}
              <span>{menu.title}</span>
            </Button>
          )}
        </li>
      ))}
      </ul>
    </div>
  );
}

export { Sidebar };
