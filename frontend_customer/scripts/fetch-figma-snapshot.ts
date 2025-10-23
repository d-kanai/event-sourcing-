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

const token =
  process.env.FIGMA_ACCESS_TOKEN ?? process.env.FIGMA_PERSONAL_ACCESS_TOKEN;
const fileKey = process.env.FIGMA_FILE_KEY;

if (!token) {
  console.error(
    "FIGMA_ACCESS_TOKEN or FIGMA_PERSONAL_ACCESS_TOKEN must be provided.",
  );
  process.exit(1);
}

if (!fileKey) {
  console.error("FIGMA_FILE_KEY is required.");
  process.exit(1);
}

function buildHeaders(accessToken: string): HeadersInit {
  if (accessToken.startsWith("figd_")) {
    return {
      "X-Figma-Token": accessToken,
    };
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: buildHeaders(token),
  });

  if (!response.ok) {
    const problem = await response.text();
    throw new Error(
      `Request failed (${response.status} ${response.statusText}) for ${url}: ${problem}`,
    );
  }

  return (await response.json()) as T;
}

async function main() {
  const baseUrl = "https://api.figma.com/v1";

  const [fileDocument, fileStyles, fileComponents, fileVariables] =
    await Promise.allSettled([
      fetchJson(`${baseUrl}/files/${fileKey}`),
      fetchJson(`${baseUrl}/files/${fileKey}/styles`),
      fetchJson(`${baseUrl}/files/${fileKey}/components`),
      fetchJson(`${baseUrl}/files/${fileKey}/variables/local`).catch(
        (error) => ({
          error: (error as Error).message,
        }),
      ),
    ]);

  const snapshot = {
    fetchedAt: new Date().toISOString(),
    fileKey,
    results: {
      document: fileDocument,
      styles: fileStyles,
      components: fileComponents,
      variables: fileVariables,
    },
  };

  const outputDir = resolve(
    process.cwd(),
    "src/design-system/primitive/generated",
  );
  await mkdir(outputDir, { recursive: true });

  const outputFile = resolve(outputDir, "figma-file-snapshot.json");
  await writeFile(outputFile, JSON.stringify(snapshot, null, 2), "utf-8");

  console.log(`Saved snapshot to ${outputFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
