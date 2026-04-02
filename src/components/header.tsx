import { DoorOpen } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useFetchInstance } from "@/lib/queries/instance/fetchInstance";
import { performLogout } from "@/lib/auth";
import { useTenant } from "@/contexts/TenantContext";
import logo from "/assets/images/fmxaiflowslogo2.png";

import { LanguageToggle } from "./language-toggle";
import { ModeToggle } from "./mode-toggle";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader } from "./ui/dialog";

function Header({ instanceId }: { instanceId?: string }) {
  const { t } = useTranslation();
  const [logoutConfirmation, setLogoutConfirmation] = useState(false);
  const navigate = useNavigate();
  const { user } = useTenant();

  const handleClose = async () => {
    await performLogout();
    navigate("/manager/login");
  };

  const navigateToDashboard = () => {
    navigate("/manager/");
  };

  const { data: instance } = useFetchInstance({ instanceId });

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b">
      <Link to="/manager" onClick={navigateToDashboard} className="flex h-8 items-center gap-4">
        <img src={logo} alt="FMX AI Logo" className="h-full" />
        <span className="text-lg font-semibold text-primary">FMX Evolution</span>
      </Link>
      <div className="flex items-center gap-4">
        {instanceId && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={instance?.profilePicUrl || "/assets/images/evolution-logo.png"} alt={instance?.name} />
          </Avatar>
        )}
        {user && !instanceId && (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 bg-gray-600">
              <AvatarImage src="" alt={user.name || user.email} />
              <span className="flex items-center justify-center w-full h-full text-white text-xs">{(user.name || user.email).charAt(0).toUpperCase()}</span>
            </Avatar>
            <span className="text-sm font-medium">{user.name || user.email}</span>
          </div>
        )}
        <LanguageToggle />
        <ModeToggle />
        <Button onClick={() => setLogoutConfirmation(true)} variant="destructive" size="icon">
          <DoorOpen size="18" />
        </Button>
      </div>

      {logoutConfirmation && (
        <Dialog onOpenChange={setLogoutConfirmation} open={logoutConfirmation}>
          <DialogContent>
            <DialogClose />
            <DialogHeader>{t("header.logout.confirm") || "Are you sure you want to logout?"}</DialogHeader>
            <DialogFooter>
              <div className="flex items-center gap-4">
                <Button onClick={() => setLogoutConfirmation(false)} size="sm" variant="outline">
                  {t("common.cancel") || "Cancel"}
                </Button>
                <Button onClick={handleClose} variant="destructive">
                  {t("header.logout.button") || "Logout"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </header>
  );
}

export { Header };
