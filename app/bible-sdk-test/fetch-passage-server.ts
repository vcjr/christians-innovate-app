import { ApiClient, BibleClient } from "@youversion/platform-core";

const DEFAULT_VERSION_ID = 3034; // NIV on YouVersion
const DEFAULT_USFM_REFERENCE = "JHN.3.16";

export async function fetchSamplePassage() {
  const appKey = process.env.NEXT_PUBLIC_YOUVERSION_APP_KEY;

  if (!appKey) {
    return {
      error: "Missing NEXT_PUBLIC_YOUVERSION_APP_KEY. Set it in .env.local to test platform-core.",
      passage: null,
    } as const;
  }

  const apiClient = new ApiClient({
    appKey,
    apiHost: process.env.NEXT_PUBLIC_YOUVERSION_API_HOST ?? "api.youversion.com",
  });

  const bibleClient = new BibleClient(apiClient);

  try {
    const passage = await bibleClient.getPassage(DEFAULT_VERSION_ID, DEFAULT_USFM_REFERENCE);

    return {
      error: null,
      passage,
    } as const;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unknown error fetching passage",
      passage: null,
    } as const;
  }
}
