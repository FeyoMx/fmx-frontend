import { Copy, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { copyToClipboard } from "@/utils/copy-to-clipboard";

import { Button } from "./ui/button";

export function InstanceToken({ token, className }: { token?: string | null; className?: string }) {
  const [visible, setVisible] = useState(false);
  const hasToken = Boolean(token);
  const hiddenValue = hasToken ? token?.replace(/\w/g, "*") : "Not available from current backend";
  const visibleValue = hasToken ? token : "Not available from current backend";

  return (
    <div className={cn("flex items-center gap-3 truncate rounded-sm bg-primary/20 px-2 py-1", className)}>
      <pre className="block truncate text-xs">{visible ? visibleValue : hiddenValue}</pre>
      <Button
        variant="ghost"
        size="icon"
        disabled={!hasToken}
        onClick={() => {
          if (token) {
            copyToClipboard(token);
          }
        }}>
        <Copy size="15" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        disabled={!hasToken}
        onClick={() => {
          setVisible((old) => !old);
        }}>
        {visible ? <EyeOff size="15" /> : <Eye size="15" />}
      </Button>
    </div>
  );
}
