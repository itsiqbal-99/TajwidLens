import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { CONFIG, AppConfig } from "./config/config";
import { setup } from "./common/setup";
async function main() {
  const app = await NestFactory.create(AppModule, {
    logger: ["log", "warn"],
    bodyParser: true,
  });
  const config = app.get<AppConfig>(CONFIG);
  setup(app, config);
  app.enableShutdownHooks();
  await app.listen(config.port);
}
main().catch(() => {
  console.error(
    "API startup failed. Check environment and database availability.",
  );
  process.exitCode = 1;
});
