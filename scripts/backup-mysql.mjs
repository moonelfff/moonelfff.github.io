import { connect, fail, mediaRoot, parseArgs, runCli, snapshot } from "./mysql-utils.mjs";

await runCli(async () => {
  const args = parseArgs(["--output"]);
  if (!args["--output"]) fail("Usage: node --env-file=.env.local scripts/backup-mysql.mjs --output <new-directory>");
  const root = await mediaRoot();
  const connection = await connect();
  try {
    console.log("Run maintenance commands with application writes stopped. Snapshots are unencrypted: store them privately.");
    await snapshot(connection, root, args["--output"]);
    console.log("MySQL rows and media saved with SHA-256 integrity manifest. No environment files were included.");
  } finally {
    await connection.end();
  }
});
