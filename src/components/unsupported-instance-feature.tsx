import { Link, useLocation, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const formatFeatureName = (path: string) =>
  path
    .split("/")
    .filter(Boolean)
    .pop()
    ?.replace(/[-:]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (match) => match.toUpperCase()) ?? "This feature";

function UnsupportedInstanceFeature() {
  const { instanceId } = useParams<{ instanceId: string }>();
  const location = useLocation();
  const featureName = formatFeatureName(location.pathname);
  const safePath = instanceId ? `/manager/instance/${instanceId}/dashboard` : "/manager";

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Not available yet</CardTitle>
          <CardDescription>
            {featureName} still depends on legacy backend endpoints that are not registered in the current API.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This route is intentionally kept as a guarded placeholder so old bookmarks and deep links do not fail with a broken page.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to={safePath}>Go to instance dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/manager">Go to manager home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export { UnsupportedInstanceFeature };
