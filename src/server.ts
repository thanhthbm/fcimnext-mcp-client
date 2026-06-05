import { app } from "./app.js";
import { connectDatabase } from "./config/database.js";

const port = Number(process.env.PORT) || 8000;

async function bootstrap() {
  try {
    await connectDatabase();

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

bootstrap();
