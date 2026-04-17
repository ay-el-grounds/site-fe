import "server-only";

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { ComponentType } from "react";

export const editorialSections = ["essays", "interviews", "photo"] as const;
export const editorialKinds = ["essay", "interview", "photo"] as const;

export type EditorialSection = (typeof editorialSections)[number];
export type EditorialKind = (typeof editorialKinds)[number];
export type EditorialStatus = "published" | "draft";

export type EditorialEntry = {
  slug: string;
  section: EditorialSection;
  type: EditorialKind;
  title: string;
  description?: string;
  publishedAt: string;
  publishedAtTimestamp: number;
  status: EditorialStatus;
  excerpt?: string;
  url: string;
};

type GetEditorialEntryOptions = {
  includeDrafts?: boolean;
};

type EditorialModule = {
  default: ComponentType;
};

type ReadResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

const contentRoot = path.join(process.cwd(), "content");

const sectionToKind: Record<EditorialSection, EditorialKind> = {
  essays: "essay",
  interviews: "interview",
  photo: "photo",
};

const editorialImporters: Record<
  EditorialSection,
  (slug: string) => Promise<EditorialModule>
> = {
  essays: (slug) => import(`../../content/essays/${slug}.mdx`),
  interviews: (slug) => import(`../../content/interviews/${slug}.mdx`),
  photo: (slug) => import(`../../content/photo/${slug}.mdx`),
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isEditorialType(value: string): value is EditorialSection {
  return editorialSections.includes(value as EditorialSection);
}

export function isEditorialKind(value: string): value is EditorialKind {
  return editorialKinds.includes(value as EditorialKind);
}

export function getEditorialTypes() {
  return [...editorialSections];
}

function getTypeDirectory(section: EditorialSection) {
  return path.join(contentRoot, section);
}

function getEditorialPath(section: EditorialSection, slug: string) {
  return path.join(getTypeDirectory(section), `${slug}.mdx`);
}

function readDirectory(section: EditorialSection): ReadResult<string[]> {
  const typeDirectory = getTypeDirectory(section);

  if (!fs.existsSync(typeDirectory)) {
    return {
      ok: false,
      error: `Content folder does not exist for section "${section}" at ${typeDirectory}.`,
    };
  }

  try {
    return {
      ok: true,
      value: fs.readdirSync(typeDirectory),
    };
  } catch (error) {
    return {
      ok: false,
      error: `Unable to read content folder for section "${section}": ${String(error)}.`,
    };
  }
}

function readSource(section: EditorialSection, slug: string): ReadResult<string> {
  const filePath = getEditorialPath(section, slug);

  if (!fs.existsSync(filePath)) {
    return {
      ok: false,
      error: `Content entry does not exist for "${section}/${slug}" at ${filePath}.`,
    };
  }

  try {
    return {
      ok: true,
      value: fs.readFileSync(filePath, "utf8"),
    };
  } catch (error) {
    return {
      ok: false,
      error: `Unable to read content entry "${section}/${slug}": ${String(error)}.`,
    };
  }
}

function stripMdx(markup: string) {
  return markup
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+\]\([^)]+\)/g, " ")
    .replace(/[#>*_`-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function createExcerpt(content: string) {
  const excerpt = stripMdx(content).slice(0, 180).trim();

  if (!excerpt) {
    return undefined;
  }

  return excerpt.length === 180 ? `${excerpt}...` : excerpt;
}

function getValidDate(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  const timestamp = new Date(normalized).getTime();

  if (Number.isNaN(timestamp)) {
    return null;
  }

  return {
    original: normalized,
    timestamp,
  };
}

function normalizeEntry(
  slug: string,
  section: EditorialSection,
  source: string
): EditorialEntry | null {
  const { data, content } = matter(source);

  if (!isRecord(data)) {
    return null;
  }

  const title = typeof data.title === "string" ? data.title.trim() : "";
  const description =
    typeof data.description === "string" ? data.description.trim() : undefined;
  const status: EditorialStatus =
    data.status === "published" ? "published" : "draft";
  const publishedAt = getValidDate(data.publishedAt);
  const requestedType =
    typeof data.type === "string" ? data.type.trim() : sectionToKind[section];

  if (!title || !publishedAt || !isEditorialKind(requestedType)) {
    return null;
  }

  if (requestedType !== sectionToKind[section]) {
    return null;
  }

  return {
    slug,
    section,
    type: requestedType,
    title,
    description,
    publishedAt: publishedAt.original,
    publishedAtTimestamp: publishedAt.timestamp,
    status,
    excerpt: createExcerpt(content),
    url: `/${section}/${slug}`,
  };
}

function readEntry(section: EditorialSection, slug: string) {
  const sourceResult = readSource(section, slug);

  if (!sourceResult.ok) {
    return null;
  }

  return normalizeEntry(slug, section, sourceResult.value);
}

function sortEditorialEntries(left: EditorialEntry, right: EditorialEntry) {
  const byDate = right.publishedAtTimestamp - left.publishedAtTimestamp;

  if (byDate !== 0) {
    return byDate;
  }

  const bySection = left.section.localeCompare(right.section);

  if (bySection !== 0) {
    return bySection;
  }

  return left.slug.localeCompare(right.slug);
}

export function getEditorialSlugs(section: EditorialSection) {
  const directoryResult = readDirectory(section);

  if (!directoryResult.ok) {
    return [];
  }

  return directoryResult.value
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""))
    .sort();
}

export function getEditorialEntry(
  section: string,
  slug: string,
  options?: GetEditorialEntryOptions
) {
  if (!isEditorialType(section)) {
    return null;
  }

  const entry = readEntry(section, slug);

  if (!entry) {
    return null;
  }

  if (!options?.includeDrafts && entry.status !== "published") {
    return null;
  }

  return entry;
}

async function importEditorialModule(section: EditorialSection, slug: string) {
  return editorialImporters[section](slug);
}

export async function getEditorialModule(section: EditorialSection, slug: string) {
  const sourceResult = readSource(section, slug);

  if (!sourceResult.ok) {
    return null;
  }

  try {
    return await importEditorialModule(section, slug);
  } catch {
    return null;
  }
}

export function getEditorialIndex(section?: EditorialSection) {
  const sections = section ? [section] : getEditorialTypes();

  return sections
    .flatMap((entrySection) =>
      getEditorialSlugs(entrySection)
        .map((slug) => readEntry(entrySection, slug))
        .filter((entry): entry is EditorialEntry => Boolean(entry))
    )
    .filter((entry) => entry.status === "published")
    .sort(sortEditorialEntries);
}
