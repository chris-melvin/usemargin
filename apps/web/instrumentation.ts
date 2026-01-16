export async function register() {
  // Only run on server
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { PostHog } = await import("posthog-node");

    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (posthogKey && posthogHost) {
      const client = new PostHog(posthogKey, {
        host: posthogHost,
        flushAt: 1,
        flushInterval: 0,
      });

      // Graceful shutdown on process exit
      process.on("SIGINT", async () => {
        await client.shutdown();
      });

      process.on("SIGTERM", async () => {
        await client.shutdown();
      });

      // Make available globally if needed
      if (typeof global !== "undefined") {
        (global as any).posthogClient = client;
      }
    }
  }
}
