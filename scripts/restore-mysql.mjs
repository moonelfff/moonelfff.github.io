import { rm } from "node:fs/promises";
import {
  connect, copyMedia, fail, isInside, loadSnapshot, makeStage, mediaRoot, parseArgs,
  prepareReplacement, replaceData, runCli,
} from "./mysql-utils.mjs";
import path from "node:path";

await runCli(async () => {
  const args = parseArgs(["--input", "--confirm", "--pre-backup"], ["--force"]);
  if (!process.env.MYSQL_DATABASE || args["--confirm"] !== process.env.MYSQL_DATABASE) {
    fail("Restore requires --confirm <MYSQL_DATABASE>, even for an empty destination.");
  }
  const root = await mediaRoot();
  const input = await loadSnapshot(args["--input"]);
  if (isInside(root, path.resolve(args["--input"]))) fail("Snapshot input must be outside MEDIA_ROOT.");
  const connection = await connect();
  let stage;
  try {
    console.log("Stop application writes before restore. Existing data requires --force and --pre-backup <new-directory>.");
    await prepareReplacement(connection, root, { force: args["--force"], preBackup: args["--pre-backup"] });
    stage = await makeStage(root);
    await copyMedia(input.media, stage, input.files);
    await replaceData(connection, root, stage, input.tables, input.files, { force: args["--force"] });
    console.log("Restore completed: all rows and media verified before commit.");
  } finally {
    if (stage) await rm(stage, { recursive: true, force: true });
    await connection.end();
  }
});
