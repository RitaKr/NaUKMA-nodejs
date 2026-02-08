import app from "./app";
import { loadAll } from "./storage/fileStore";

const PORT = process.env.PORT ? Number(process.env.PORT) : 2000;

(async () => {
  await loadAll();

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
})();
