import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormInput, FormSwitch } from "@/components/ui/form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Textarea } from "@/components/ui/textarea";

import { useInstance } from "@/contexts/InstanceContext";

import { useManageInstance } from "@/lib/queries/instance/manageInstance";
import { useFetchAdvancedSettings } from "@/lib/queries/instance/settingsFind";

import { AdvancedSettings } from "@/types/evolution.types";

const FormSchema = z.object({
  rejectCall: z.boolean(),
  msgRejectCall: z.string().optional(),
  ignoreGroups: z.boolean(),
  ignoreStatus: z.boolean(),
  alwaysOnline: z.boolean(),
  readMessages: z.boolean(),
});

function Settings() {
  const { t } = useTranslation();
  const [updating, setUpdating] = useState(false);

  const { instance } = useInstance();
  const { updateSettings } = useManageInstance();
  const { data: settings, isLoading: loading } = useFetchAdvancedSettings({
    instanceId: instance?.id,
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      rejectCall: false,
      msgRejectCall: "",
      ignoreGroups: false,
      ignoreStatus: false,
      alwaysOnline: false,
      readMessages: false,
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        rejectCall: settings.rejectCall,
        msgRejectCall: settings.msgRejectCall ?? "",
        ignoreGroups: settings.ignoreGroups ?? (settings as any).groupsIgnore ?? false,
        ignoreStatus: settings.ignoreStatus ?? (settings as any).readStatus ?? false,
        alwaysOnline: settings.alwaysOnline,
        readMessages: settings.readMessages,
      });
    }
  }, [form, settings]);

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    try {
      if (!instance || !instance.name) {
        throw new Error("instance not found");
      }

      setUpdating(true);
      const advancedSettingsData: AdvancedSettings = {
        rejectCall: data.rejectCall,
        msgRejectCall: data.msgRejectCall || "",
        ignoreGroups: data.ignoreGroups,
        ignoreStatus: data.ignoreStatus,
        alwaysOnline: data.alwaysOnline,
        readMessages: data.readMessages,
      };
      await updateSettings({
        instanceId: instance.id,
        data: advancedSettingsData,
      });
      toast.success(t("settings.toast.success"));
    } catch (error) {
      console.error(t("settings.toast.success"), error);
      toast.error(t("settings.toast.error"));
    } finally {
      setUpdating(false);
    }
  };

  const fields = [
    {
      name: "ignoreGroups",
      label: t("settings.form.groupsIgnore.label"),
      description: t("settings.form.groupsIgnore.description"),
    },
    {
      name: "ignoreStatus",
      label: t("settings.form.readStatus.label"),
      description: t("settings.form.readStatus.description"),
    },
    {
      name: "alwaysOnline",
      label: t("settings.form.alwaysOnline.label"),
      description: t("settings.form.alwaysOnline.description"),
    },
    {
      name: "readMessages",
      label: t("settings.form.readMessages.label"),
      description: t("settings.form.readMessages.description"),
    },
  ];

  const isRejectCall = form.watch("rejectCall");

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 divide-y">
              <div className="flex flex-col py-4 first:pt-0">
                <FormSwitch name="rejectCall" label={t("settings.form.rejectCall.label")} className="w-full justify-between" helper={t("settings.form.rejectCall.description")} />
                {isRejectCall && (
                  <div className="mt-3 max-w-2xl">
                    <FormInput name="msgRejectCall">
                      <Textarea placeholder={t("settings.form.msgCall.description")} />
                    </FormInput>
                  </div>
                )}
              </div>
              {fields.map((field) => (
                <div className="flex py-4" key={field.name}>
                  <FormSwitch name={field.name} label={field.label} className="w-full justify-between" helper={field.description} />
                </div>
              ))}
              <div className="flex justify-end pt-6">
                <Button type="submit" disabled={updating}>
                  {updating ? t("settings.button.saving") : t("settings.button.save")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </>
  );
}

export { Settings };
