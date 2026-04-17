import type { ComponentPropsWithoutRef, ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import type { MDXComponents } from "mdx/types";
import editorialStyles from "@/app/(editorial)/editorial.module.css";

type ImageComponentProps = ComponentPropsWithoutRef<"img"> & {
  title?: string;
};

type FigureProps = {
  src: string;
  alt?: string;
  caption?: ReactNode;
  width?: number;
  height?: number;
  priority?: boolean;
};

function Caption({ children }: { children: ReactNode }) {
  return <figcaption className={editorialStyles.caption}>{children}</figcaption>;
}

function Figure({
  src,
  alt = "",
  caption,
  width = 1200,
  height = 900,
  priority = false,
}: FigureProps) {
  if (!src.trim()) {
    return null;
  }

  return (
    <figure className={editorialStyles.figure}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        sizes="(min-width: 1100px) 960px, (min-width: 720px) 88vw, 100vw"
        className={editorialStyles.figureImage}
      />
      {caption ? <Caption>{caption}</Caption> : null}
    </figure>
  );
}

function MdxImage({ alt = "", title, src = "", ...props }: ImageComponentProps) {
  if (typeof src !== "string" || !src) {
    return null;
  }

  return (
    <figure className={editorialStyles.figure}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        {...props}
        src={src}
        alt={alt}
        loading="lazy"
        className={editorialStyles.inlineImage}
      />
      {title ? <Caption>{title}</Caption> : null}
    </figure>
  );
}

function MdxLink({
  href = "",
  children,
  ...props
}: ComponentPropsWithoutRef<"a">) {
  if (typeof href === "string" && href.startsWith("/")) {
    return (
      <Link href={href} className={editorialStyles.link}>
        {children}
      </Link>
    );
  }

  return (
    <a
      {...props}
      href={href}
      className={editorialStyles.link}
      target={typeof href === "string" && href.startsWith("http") ? "_blank" : undefined}
      rel={typeof href === "string" && href.startsWith("http") ? "noreferrer" : undefined}
    >
      {children}
    </a>
  );
}

const components: MDXComponents = {
  a: MdxLink,
  img: MdxImage,
  h1: ({ children }) => <h1 className={editorialStyles.mdxH1}>{children}</h1>,
  h2: ({ children }) => <h2 className={editorialStyles.mdxH2}>{children}</h2>,
  p: ({ children }) => <p className={editorialStyles.mdxParagraph}>{children}</p>,
  figcaption: ({ children }) => <figcaption className={editorialStyles.caption}>{children}</figcaption>,
  Figure,
  Caption,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
