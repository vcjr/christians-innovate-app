"use client";

import { useState, FormEvent } from "react";
import { BibleTextView, VerseOfTheDay } from "@youversion/platform-react-ui";
import { usePassage } from "@youversion/platform-react-hooks";

const DEFAULT_VERSION_ID = 3034; // NIV

// Minimal helper: normalize a few common book names to USFM codes
const BOOK_TO_USFM: Record<string, string> = {
  genesis: "GEN",
  exodus: "EXO",
  leviticus: "LEV",
  numbers: "NUM",
  deuteronomy: "DEU",
  joshua: "JOS",
  judges: "JDG",
  ruth: "RUT",
  "1 samuel": "1SA",
  "2 samuel": "2SA",
  "1 kings": "1KI",
  "2 kings": "2KI",
  "1 chronicles": "1CH",
  "2 chronicles": "2CH",
  ezra: "EZR",
  nehemiah: "NEH",
  esther: "EST",
  job: "JOB",
  psalms: "PSA",
  psalm: "PSA",
  proverbs: "PRO",
  ecclesiastes: "ECC",
  "song of solomon": "SNG",
  isaiah: "ISA",
  jeremiah: "JER",
  lamentations: "LAM",
  ezekiel: "EZK",
  daniel: "DAN",
  hosea: "HOS",
  joel: "JOL",
  amos: "AMO",
  obadiah: "OBA",
  jonah: "JON",
  micah: "MIC",
  nahum: "NAM",
  habakkuk: "HAB",
  zephaniah: "ZEP",
  haggai: "HAG",
  zechariah: "ZEC",
  malachi: "MAL",
  matthew: "MAT",
  mark: "MRK",
  luke: "LUK",
  john: "JHN",
  acts: "ACT",
  romans: "ROM",
  "1 corinthians": "1CO",
  "2 corinthians": "2CO",
  galatians: "GAL",
  ephesians: "EPH",
  philippians: "PHP",
  colossians: "COL",
  "1 thessalonians": "1TH",
  "2 thessalonians": "2TH",
  "1 timothy": "1TI",
  "2 timothy": "2TI",
  titus: "TIT",
  philemon: "PHM",
  hebrews: "HEB",
  james: "JAS",
  "1 peter": "1PE",
  "2 peter": "2PE",
  "1 john": "1JN",
  "2 john": "2JN",
  "3 john": "3JN",
  jude: "JUD",
  revelation: "REV",
};

function humanToUsfm(input: string): string {
  const raw = input.trim();
  if (!raw) return "";

  // If the user already typed a USFM code, pass through
  if (/^[1-3]?[A-Z]{3}\.[0-9]+(\.[0-9]+(-[0-9]+)?)?$/.test(raw)) {
    return raw;
  }

  // Basic parsing: "John 3:16" → "JHN.3.16"
  const match = raw.match(/^(?<book>[1-3]?\s*[A-Za-z ]+)\s+(?<chapter>\d+)(?::(?<verse>\d+))?/);
  if (!match || !match.groups) return raw;

  const bookKey = match.groups.book.toLowerCase().replace(/\s+/g, " ").trim();
  const chapter = match.groups.chapter;
  const verse = match.groups.verse ?? "1";

  const usfmBook = BOOK_TO_USFM[bookKey];
  if (!usfmBook) return raw;

  return `${usfmBook}.${chapter}.${verse}`;
}

interface BibleSdkTestClientProps {
  serverPassage: any | null;
  serverError: string | null;
}

export function BibleSdkTestClient({ serverPassage, serverError }: BibleSdkTestClientProps) {
  const [inputValue, setInputValue] = useState("JHN.3.16");
  const [usfm, setUsfm] = useState("JHN.3.16");

  const { passage, loading, error } = usePassage({
    versionId: DEFAULT_VERSION_ID,
    usfm,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const converted = humanToUsfm(inputValue);
    setUsfm(converted || "JHN.3.16");
  };

  return (
    <div className="space-y-8">
      {/* Section 1: platform-react-ui */}
      <section className="border rounded-lg p-4 bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Section 1 — platform-react-ui</h2>
        <p className="text-sm text-gray-600 mb-4">
          Prebuilt components from @youversion/platform-react-ui.
        </p>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">BibleTextView (JHN.3, versionId 3034)</h3>
            <BibleTextView reference="JHN.3" versionId={DEFAULT_VERSION_ID} />
          </div>
          <div>
            <h3 className="font-medium mb-2">VerseOfTheDay (versionId 3034)</h3>
            <VerseOfTheDay versionId={DEFAULT_VERSION_ID} />
          </div>
        </div>
      </section>

      {/* Section 2: platform-react-hooks */}
      <section className="border rounded-lg p-4 bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Section 2 — platform-react-hooks</h2>
        <p className="text-sm text-gray-600 mb-4">
          Hook-driven passage fetch. Type either a USFM reference (e.g. JHN.3.16) or a human-readable
          reference (e.g. John 3:16) and submit.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 border rounded px-3 py-2 text-sm"
            placeholder="JHN.3.16 or John 3:16"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            Fetch
          </button>
        </form>

        <div className="text-xs text-gray-500 mb-2">Resolved USFM: {usfm}</div>

        <div className="border rounded p-3 bg-gray-50 text-sm whitespace-pre-wrap break-words">
          {loading && <div>Loading…</div>}
          {error && <div className="text-red-600">Error: {error.message}</div>}
          {!loading && !error && passage && (
            <div>
              <div className="font-medium mb-1">Hook result (truncated HTML content):</div>
              <div
                className="prose max-w-none border rounded p-2 bg-white"
                dangerouslySetInnerHTML={{ __html: passage.content || "" }}
              />
            </div>
          )}
          {!loading && !error && !passage && <div>No passage loaded yet.</div>}
        </div>
      </section>

      {/* Section 3: platform-core (SSR result) */}
      <section className="border rounded-lg p-4 bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Section 3 — platform-core (SSR)</h2>
        <p className="text-sm text-gray-600 mb-4">
          Server-fetched passage using @youversion/platform-core (ApiClient + BibleClient).
        </p>

        {serverError && (
          <div className="mb-3 text-sm text-red-600">Server error: {serverError}</div>
        )}

        {serverPassage ? (
          <div className="space-y-3">
            <div className="text-xs text-gray-500">
              id: {serverPassage.id} | reference: {serverPassage.reference} | usfm: {serverPassage.usfm}
            </div>
            <div
              className="prose max-w-none border rounded p-2 bg-gray-50 text-sm"
              dangerouslySetInnerHTML={{ __html: serverPassage.content || "" }}
            />
            <details className="text-xs">
              <summary className="cursor-pointer text-blue-600">Raw JSON</summary>
              <pre className="mt-2 max-h-64 overflow-auto bg-black text-green-200 p-2 rounded">
                {JSON.stringify(serverPassage, null, 2)}
              </pre>
            </details>
          </div>
        ) : (
          <div className="text-sm text-gray-600">No server passage loaded.</div>
        )}
      </section>
    </div>
  );
}
