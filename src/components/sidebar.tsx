/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChevronDown, CircleHelp, Cog, FileQuestion, IterationCcw, LayoutDashboard, LifeBuoy, MessageCircle, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import { useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { InstanceContext } from "@/contexts/InstanceContext";
import { cn } from "@/lib/utils";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";

function Sidebar() {
  const { t } = useTranslation();
  const instanceContext = useContext(InstanceContext);
  const instance = instanceContext?.instance ?? null;

  const menus = useMemo(
    () => [
      {
        section: "Primary",
        items: [
          {
            id: "dashboard",
            title: t("sidebar.dashboard"),
            icon: LayoutDashboard,
            highlight: "Supported",
            path: ({ instanceId }: { instanceId?: string }) => (instanceId ? `/manager/instance/${instanceId}/dashboard` : "/manager"),
          },
          {
            id: "contacts",
            title: t("sidebar.contacts"),
            icon: ShieldCheck,
            highlight: "Supported",
            path: "/manager/contacts",
          },
          {
            id: "broadcast",
            title: t("sidebar.broadcast"),
            icon: IterationCcw,
            highlight: "Queue view",
            path: "/manager/broadcast",
          },
          {
            id: "aiSettings",
            title: t("sidebar.aiSettings"),
            icon: Sparkles,
            highlight: "Tenant defaults",
            path: "/manager/ai-settings",
          },
        ],
      },
      {
        section: "Instance",
        items: [
          {
            title: "Conversations",
            icon: MessageCircle,
            children: [
              {
                id: "chats",
                title: t("sidebar.chats"),
                path: ({ instanceId }: { instanceId?: string }) => (instanceId ? `/manager/instance/${instanceId}/chat` : undefined),
              },
            ],
          },
          {
            title: "Runtime & setup",
            icon: Wrench,
            children: [
              {
                id: "settings",
                title: t("sidebar.settings"),
                path: ({ instanceId }: { instanceId?: string }) => (instanceId ? `/manager/instance/${instanceId}/settings` : undefined),
              },
              {
                id: "proxy",
                title: t("sidebar.proxy"),
                path: ({ instanceId }: { instanceId?: string }) => (instanceId ? `/manager/instance/${instanceId}/proxy` : undefined),
              },
              {
                id: "webhook",
                title: t("sidebar.webhook"),
                path: ({ instanceId }: { instanceId?: string }) => (instanceId ? `/manager/instance/${instanceId}/webhook` : undefined),
              },
              {
                id: "websocket",
                title: t("sidebar.websocket"),
                path: ({ instanceId }: { instanceId?: string }) => (instanceId ? `/manager/instance/${instanceId}/websocket` : undefined),
              },
              {
                id: "rabbitmq",
                title: t("sidebar.rabbitmq"),
                path: ({ instanceId }: { instanceId?: string }) => (instanceId ? `/manager/instance/${instanceId}/rabbitmq` : undefined),
              },
            ],
          },
        ],
      },
      {
        section: "Reference",
        items: [
          {
            id: "apiKeys",
            title: t("sidebar.apiKeys"),
            icon: Cog,
            highlight: "Info only",
            path: "/manager/api-keys",
          },
          {
            id: "documentation",
            title: t("sidebar.documentation"),
            icon: FileQuestion,
            link: "https://doc.evolution-api.com",
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
      },
    ],
    [t],
  );

  const navigate = useNavigate();
  const { pathname } = useLocation();

  const resolvePath = (path: string | ((args: { instanceId?: string }) => string | undefined) | undefined) => {
    if (!path) return undefined;
    return typeof path === "function" ? path({ instanceId: instance?.id }) : path;
  };

  const handleNavigate = (menu?: any) => {
    if (!menu) return;

    const nextPath = resolvePath(menu.path);
    if (nextPath) navigate(nextPath);
    if (menu.link) window.open(menu.link, "_blank");
  };

  const sections = useMemo(
    () =>
      menus.map((section) => ({
        ...section,
        items: section.items.map((item) => ({
          ...item,
          children:
            "children" in item
              ? item.children?.map((child) => ({
                  ...child,
                  resolvedPath: resolvePath(child.path),
                  isActive: pathname === resolvePath(child.path),
                }))
              : undefined,
          resolvedPath: "path" in item ? resolvePath(item.path) : undefined,
          isActive:
            ("path" in item && !!item.path && pathname === resolvePath(item.path)) ||
            ("children" in item && item.children?.some((child) => pathname === resolvePath(child.path))),
        })),
      })),
    [menus, pathname, instance?.id],
  );

  return (
    <div className="flex h-full w-full flex-col border-r border-border bg-background">
      <div className="border-b border-border px-4 py-4">
        <div className="text-sm font-bold text-primary">FMX Evolution</div>
        <div className="text-xs text-muted-foreground">Operator workspace</div>
      </div>

      <div className="flex h-full flex-col gap-5 px-3 py-4">
        {sections.map((section) => (
          <div key={section.section} className="space-y-2">
            <div className="px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{section.section}</div>
            <ul className="flex flex-col gap-1">
              {section.items.map((item) => (
                <li key={("id" in item && item.id) ? item.id : item.title}>
                  {item.children ? (
                    <Collapsible defaultOpen={item.isActive}>
                      <CollapsibleTrigger asChild>
                        <Button className="flex w-full items-center justify-start gap-2 rounded-xl" variant={item.isActive ? "secondary" : "ghost"}>
                          {item.icon && <item.icon size={15} />}
                          <span>{item.title}</span>
                          <ChevronDown size={15} className="ml-auto" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <ul className="mt-2 ml-5 flex flex-col gap-1 border-l pl-4 text-sm">
                          {item.children.map((child) => (
                            <li key={child.id}>
                              <button
                                onClick={() => handleNavigate(child)}
                                disabled={!child.resolvedPath && !("link" in child && child.link)}
                                className={cn(
                                  "flex w-full items-center justify-between rounded-lg px-2 py-2 text-left transition-colors",
                                  child.isActive ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                                  !child.resolvedPath && "cursor-not-allowed opacity-50",
                                )}>
                                <span>{child.title}</span>
                                {!child.resolvedPath ? <Badge variant="outline">Select instance</Badge> : null}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <Button className={cn("relative flex w-full items-center justify-start gap-2 rounded-xl", item.isActive && "pointer-events-none")} variant={item.isActive ? "secondary" : "ghost"}>
                      {"link" in item && <a href={item.link} target="_blank" rel="noreferrer" className="absolute inset-0 h-full w-full" />}
                      {"resolvedPath" in item && item.resolvedPath && <Link to={item.resolvedPath} className="absolute inset-0 h-full w-full" />}
                      {item.icon && <item.icon size={15} />}
                      <span>{item.title}</span>
                      {"highlight" in item && item.highlight ? <Badge variant="outline" className="ml-auto">{item.highlight}</Badge> : null}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export { Sidebar };
