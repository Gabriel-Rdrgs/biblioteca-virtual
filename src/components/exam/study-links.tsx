"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { readerHref, referencesForAxis } from "@/lib/data/study-references";

/**
 * Where to read about one eixo: the book, the section and the page, as a
 * link that opens the reader there.
 *
 * This is the other half of the promise the result makes. Telling someone
 * that teníase is weak is only useful next to the chapter that fixes it.
 */
export function StudyLinks({ axisId, className }: { axisId: string; className?: string }) {
  const references = referencesForAxis(axisId);
  if (references.length === 0) return null;

  return (
    <ul className={className}>
      {references.map((reference) => (
        <li key={`${reference.bookId}-${reference.page}`}>
          <Link
            href={readerHref(reference)}
            className="glass-strong hover:text-primary mt-1.5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition-colors"
          >
            <BookOpen className="size-3.5 shrink-0" aria-hidden="true" />
            <span>
              {reference.chapter ? (
                <span className="text-ink-faint">cap. {reference.chapter} · </span>
              ) : null}
              {reference.section}
              <span className="text-ink-faint"> · p. {reference.page}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
