#!/usr/bin/env tsx

import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";

const localEnvPath = resolve(process.cwd(), ".env.local");

if (existsSync(localEnvPath)) {
  loadEnv({ path: localEnvPath });
} else {
  loadEnv();
}

type FigmaVariableMeta = {
  key: string;
  name: string;
  description: string;
  resolvedType: string;
  variableCollectionId: string;
  valuesByMode: Record<string, unknown>;
};

async function main() {
const oauthToken = process.env.FIGMA_ACCESS_TOKEN;
const personalToken = process.env.FIGMA_PERSONAL_ACCESS_TOKEN;
const fileKey = process.env.FIGMA_FILE_KEY;
const collectionId = process.env.FIGMA_VARIABLE_COLLECTION_ID;

if (!fileKey) {
  console.error("FIGMA_FILE_KEY environment variable is required.");
  process.exit(1);
}

if (!oauthToken && !personalToken) {
  console.error(
    "Provide either FIGMA_ACCESS_TOKEN (OAuth token) or FIGMA_PERSONAL_ACCESS_TOKEN.",
  );
  process.exit(1);
}

  const response = await fetch(
    `https://api.figma.com/v1/files/${fileKey}/variables/local`,
    {
      headers: oauthToken
        ? {
            Authorization: `Bearer ${oauthToken}`,
          }
        : {
            "X-Figma-Token": personalToken ?? "",
          },
    },
  );

  if (!response.ok) {
    console.error(
      `Failed to fetch variables from Figma: ${response.status} ${response.statusText}`,
    );
    const errorBody = await response.text();
    console.error(errorBody);
    process.exit(1);
  }

  const payload = await response.json();
  let variables: FigmaVariableMeta[] = payload.meta?.variables ?? [];

  if (collectionId) {
    variables = variables.filter(
      (variable: FigmaVariableMeta) =>
        variable.variableCollectionId === collectionId,
    );
  }

  const outputDir = resolve(
    process.cwd(),
    "src/design-system/primitive/generated",
  );
  const outputFile = resolve(outputDir, "figma-variables.json");

  await mkdir(outputDir, { recursive: true });
  await writeFile(
    outputFile,
    JSON.stringify(
      {
        fetchedAt: new Date().toISOString(),
        fileKey,
        collectionId,
        count: variables.length,
        variables,
      },
      null,
      2,
    ),
    "utf-8",
  );

  console.log(
    `Saved ${variables.length} variables into ${outputFile}. Map these to primitive tokens in TypeScript to keep the design system in sync.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
