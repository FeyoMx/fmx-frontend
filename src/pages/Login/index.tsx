import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useState } from "react";
import { toast } from "react-toastify";
import logo from "/assets/images/fmxaiflowslogo2.png";

import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormInput } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { login } from "@/lib/queries/auth/login";
import { saveAuthTokens, saveUserData } from "@/lib/auth";
import { useTenant } from "@/contexts/TenantContext";
import { getApiErrorMessage } from "@/lib/queries/errors";

const loginSchema = z.object({
  email: z.string({ required_error: "Email is required" }).email("Invalid email"),
  password: z.string({ required_error: "Password is required" }).min(6, "Password must be at least 6 characters"),
  tenant_slug: z.string().default("fmx"),
});
type LoginSchema = z.infer<typeof loginSchema>;

function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setTenant, setUser, setToken } = useTenant();
  const [isLoading, setIsLoading] = useState(false);

  const loginForm = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      tenant_slug: "fmx",
    },
  });

  const handleLogin: SubmitHandler<LoginSchema> = async (data) => {
    setIsLoading(true);
    try {
      const response = await login({
        email: data.email,
        password: data.password,
        tenant_slug: data.tenant_slug,
      });

      // Save authentication data
      saveAuthTokens(response.access_token, response.refresh_token, response.tenant_id, response.user_id, response.role);
      saveUserData({
        id: response.user_id,
        email: data.email,
        name: data.email.split('@')[0], // Use email prefix as name
        role: response.role,
        tenantId: response.tenant_id,
        apiKey: false, // Default value
      });

      // Update context - we'll get full user data from /auth/me later
      setToken(response.access_token);
      setUser({
        id: response.user_id,
        email: data.email,
        name: data.email.split('@')[0],
        role: response.role,
        tenantId: response.tenant_id,
        apiKey: false,
      });
      setTenant({
        id: response.tenant_id,
        name: "FMX Tenant", // Default name, will be updated from /auth/me
        plan: "pro",
        instancesCount: 0,
        messagesCount: 0,
        aiUsage: { tokensUsed: 0, tokensLimit: 10000 },
      });

      toast.success(t("login.message.success") || "Login successful");
      navigate("/manager/");
    } catch (error: any) {
      const errorMessage = getApiErrorMessage(error, "Login failed");
      toast.error(t("login.message.invalidCredentials") || errorMessage);
      loginForm.setError("password", {
        type: "manual",
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center justify-center pt-2">
        <img className="h-10" src={logo} alt="FMX AI logo" />
      </div>
      <div className="flex flex-1 items-center justify-center p-8">
        <Card className="b-none w-[350px] shadow-none">
          <CardHeader>
            <CardTitle className="text-center">FMX Evolution</CardTitle>
            <CardDescription className="text-center">{t("login.description")}</CardDescription>
          </CardHeader>
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(handleLogin)}>
              <CardContent>
                <div className="grid w-full items-center gap-4">
                  <FormInput required name="email" label={t("login.form.email") || "Email"}>
                    <Input type="email" disabled={isLoading} />
                  </FormInput>
                  <FormInput required name="password" label={t("login.form.password") || "Password"}>
                    <Input type="password" disabled={isLoading} />
                  </FormInput>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading ? t("login.button.loading") || "Logging in..." : t("login.button.login")}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
      <Footer />
    </div>
  );
}

export default Login;
