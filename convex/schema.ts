import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";
import { z } from "zod";
import { Table } from "convex-helpers/server";
import { zid, zodToConvexFields } from "convex-helpers/server/zod";

//// Zod validation helpers ////
const required = { required_error: "Required" };
export const slugRegEx = /^(\w+)((-\w+)+)?$/;
export const zodSlug = z
  .string(required)
  .regex(
    slugRegEx,
    "Slug can only contain letters, numbers, hyphens or underscores"
  );
// Accept empty strings in addition to undefined for form validation
export const zodOptionalUrl = z.optional(
  z.union([z.literal(""), z.string().url()])
);


//// Content & Validation ////
export const postsZod = {
  title: z
    .string(required)
    .min(2)
    .max(60),
  slug: zodSlug,
  summary: z.optional(z.string().min(10, '10 characters min').max(200, '200 characters max')),
  content: z.string(),
  imageUrl: zodOptionalUrl,
  authorId: zid("users"),
  published: z.boolean(), //TODO make this a timestamp?
  postId: zodSlug // Unchanging copy of original slug, for versioning
}
export const posts = Table('posts', zodToConvexFields(postsZod))

export const usersZod = {
  image: zodOptionalUrl,
  url: zodOptionalUrl,
  tagline: z.optional(z.string().max(100, '100 characters max')),
  bio: z.optional(z.string().max(500, '500 characters max')),
  userId: z.optional(zid('users')),
  name: z.optional(z.string()),
  email: z.optional(z.string().email()),
  emailVerificationTime: z.optional(z.number()),
  phone: z.optional(z.string()),
  phoneVerificationTime: z.optional(z.number()),
  isAnonymous: z.optional(z.boolean()),
}
export const users = Table('users', zodToConvexFields(usersZod));

//// Convex DB ////
export default defineSchema({
  ...authTables,
  users: users.table,
  posts: posts.table
    .index("by_slug", ["slug"])
    .index("by_slug_published", ["slug", "published"])
    .index("by_postId", ["postId"])
    .index("by_postId_published", ["postId", "published"]) // to get by postId
    .index("by_published", ["published"]) // to get latest posts
    .index("by_authorId", ["authorId"]),
});
