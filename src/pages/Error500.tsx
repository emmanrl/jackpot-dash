import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ServerCrash, Home, RefreshCw } from "lucide-react";

const Error500 = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6 px-4">
        <div className="flex justify-center">
          <ServerCrash className="h-24 w-24 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-destructive">500</h1>
          <h2 className="text-2xl font-semibold text-foreground">Internal Server Error</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Something went wrong on our end. Our team has been notified and we're working to fix it.
          </p>
        </div>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button asChild variant="default">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload Page
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Error500;
