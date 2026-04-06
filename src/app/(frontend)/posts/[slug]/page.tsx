import { notFound } from "next/navigation";
import { getPayloadClient } from "@/lib/payload";
import type { Post } from "@/payload-types";
import type { Metadata } from "next";
import { format } from "date-fns";
import JsonLd from "@/components/JsonLd";
import RichText from "@/components/RichText";

// ISR — revalidate via webhook, not on a timer
export const revalidate = false;
export const dynamic = "force-static";

export async function generateStaticParams() {
  const payload = await getPayloadClient();
  const posts = await payload.find({
    collection: "posts",
    where: { status: { equals: "published" } },
    select: { slug: true },
    limit: 1000,
  });
  return posts.docs.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "posts",
    where: { slug: { equals: slug } },
    limit: 1,
  });
  const post = docs[0] as Post | undefined;
  if (!post) return {};
  return {
    title: post.seo?.metaTitle ?? post.title,
    description: post.seo?.metaDescription ?? post.excerpt,
    openGraph: { type: "article", title: post.title },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "posts",
    where: { slug: { equals: slug }, status: { equals: "published" } },
    depth: 2,
    limit: 1,
  });

  const post = docs[0] as Post | undefined;
  if (!post) notFound();

  const author = typeof post.author === "object" ? post.author : null;

  return (
    <>
      <JsonLd
        type="Article"
        data={{
          headline: post.title,
          datePublished: post.publishedAt,
          author: author ? { "@type": "Person", name: author.name } : undefined,
        }}
      />
      <article className="max-w-2xl mx-auto px-6 py-16">
        <header className="mb-10">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">{post.title}</h1>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            {author && <span>{author.name}</span>}
            {post.publishedAt && (
              <span>{format(new Date(post.publishedAt), "dd MMM yyyy")}</span>
            )}
          </div>
        </header>
        <RichText content={post.content} />
      </article>
    </>
  );
}
