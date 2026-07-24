import * as Sentry from "@sentry/react";
import { useState } from "react";
import NavigationBar from "@/components/NavigationBar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const About = () => {
  const [shouldCrash, setShouldCrash] = useState(false);

  // When toggled on, this render throws — an unhandled React render error that
  // Sentry's global handler (and ErrorBoundary) will capture and report.
  if (shouldCrash) {
    throw new Error("Sentry test: About page render crash");
  }

  const throwUncaughtError = () => {
    // Thrown outside of React's render/event batching so it surfaces as an
    // unhandled exception captured by Sentry's global error handler.
    setTimeout(() => {
      throw new Error("Sentry test: uncaught async error from About page");
    }, 0);
    toast.info("Threw an uncaught error — check Sentry");
  };

  const captureHandledError = () => {
    try {
      throw new Error("Sentry test: manually captured error from About page");
    } catch (error) {
      Sentry.captureException(error);
      toast.success("Sent a captured exception to Sentry");
    }
  };

  const captureMessage = () => {
    Sentry.captureMessage("Sentry test: hello from the About page", "info");
    toast.success("Sent a message event to Sentry");
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />

      <main className="px-[var(--page-padding)] py-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-display font-medium text-foreground mb-4">
            About Marketplace
          </h1>
          <p className="text-body text-foreground mb-4">
            Marketplace is your trusted platform for buying and selling authentic pre-owned products.
          </p>
          <p className="text-body text-foreground mb-8">
            We connect sellers with buyers in a safe, secure environment where quality and authenticity are guaranteed.
          </p>

          <div className="border-t border-border pt-6">
            <h2 className="text-lg font-medium text-foreground mb-1">
              Sentry test panel
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Use these controls to verify error monitoring is wired up.
            </p>
            <div className="flex flex-col gap-3">
              <Button variant="destructive" onClick={() => setShouldCrash(true)}>
                Throw render error (crash page)
              </Button>
              <Button variant="destructive" onClick={throwUncaughtError}>
                Throw uncaught async error
              </Button>
              <Button
                className="bg-blue-600 text-white hover:bg-blue-700"
                onClick={captureHandledError}
              >
                Capture handled exception
              </Button>
              <Button
                className="bg-green-600 text-white hover:bg-green-700"
                onClick={captureMessage}
              >
                Send message event
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;
