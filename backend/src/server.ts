// import { buildApp } from "./app";
// import { loadConfig } from "./config/env";

// async function start(): Promise<void> {
//   const config = loadConfig();
//   const app = await buildApp({ config });

//   const close = async (signal: NodeJS.Signals) => {
//     app.log.info({ signal }, "Shutting down NexBand API");
//     await app.close();
//     process.exit(0);
//   };

//   process.once("SIGINT", () => void close("SIGINT"));
//   process.once("SIGTERM", () => void close("SIGTERM"));

//   try {
//     await app.listen({ host: config.host, port: config.port });
//   } catch (error) {
//     app.log.error(error, "Unable to start NexBand API");
//     process.exit(1);
//   }
// }

// void start();
import "dotenv/config";
import { buildApp } from "./app";

const start = async () => {
  try {
    const app = await buildApp();

    await app.listen({
      port: Number(process.env.PORT) || 5000,
      host: "0.0.0.0",
    });

    console.log(
      `🚀 Server running at http://localhost:${process.env.PORT || 5000}`
    );
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

start();