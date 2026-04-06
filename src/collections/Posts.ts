import type { CollectionConfig } from "payload";
import { revalidatePath } from "next/cache";

export const Posts: CollectionConfig = {
  slug: "posts",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "author", "status", "publishedAt"],
  },
  access: {
    read: ({ req }) => {
      // Drafts only visible to authenticated users in admin
      if (req.user) return true;
      return { status: { equals: "published" } };
    },
  },
  versions: {
    drafts: { autosave: { interval: 2000 } },
  },
  fields: [
    { name: "title", type: "text", required: true },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: { position: "sidebar" },
    },
    {
      name: "status",
      type: "select",
      options: ["draft", "published"],
      defaultValue: "draft",
      admin: { position: "sidebar" },
    },
    {
      name: "publishedAt",
      type: "date",
      admin: { position: "sidebar", date: { displayFormat: "dd MMM yyyy" } },
    },
    {
      name: "author",
      type: "relationship",
      relationTo: "authors",
      admin: { position: "sidebar" },
    },
    {
      name: "tags",
      type: "relationship",
      relationTo: "tags",
      hasMany: true,
      admin: { position: "sidebar" },
    },
    {
      name: "coverImage",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "excerpt",
      type: "textarea",
      maxLength: 200,
    },
    {
      name: "content",
      type: "richText",
      // Uses @payloadcms/richtext-lexical — configured in payload.config.ts
    },
    // JSON-LD metadata
    {
      name: "seo",
      type: "group",
      fields: [
        { name: "metaTitle", type: "text" },
        { name: "metaDescription", type: "textarea", maxLength: 160 },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc }) => {
        // On-demand ISR revalidation whenever a post is saved in the CMS
        revalidatePath("/");
        revalidatePath(`/posts/${doc.slug}`);
      },
    ],
  },
};
