import process from 'process';
import { readFileSync } from 'fs';
import { importLists } from './src/import-lists.lib';

const config = {
  ...require('./config.json'),
  logger: (...args: unknown[]) => console.log(...args)
}

async function main() {
  const csvPath = process.argv[2];
  const csvString = readFileSync(csvPath, 'utf8');
  await importLists(config, csvString);
}

main().catch((error) => {
  console.error("💥 Error:", error);
});