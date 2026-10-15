import { connect, initialize, parseArgs, runCli } from "./mysql-utils.mjs";

await runCli(async () => {
  parseArgs();
  const connection = await connect();
  try {
    await initialize(connection);
    console.log("MySQL schema initialized (existing tables and data were not replaced).");
  } finally {
    await connection.end();
  }
});
