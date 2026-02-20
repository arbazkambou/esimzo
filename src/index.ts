import { env } from "./lib/env";
import { startSyncScheduler } from "./lib/scheduler";
import app from "./app";

const start = async () => {
  try {
    app.listen(env.PORT, () => {
      console.log(`🚀 Server running on http://localhost:${env.PORT}`);
      console.log(`📝 Environment: ${env.NODE_ENV}`);

      // Start automated sync (2x/day by default)
      startSyncScheduler();
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

start();
