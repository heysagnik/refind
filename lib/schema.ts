import { pgTable, uuid, text, timestamp, boolean, uniqueIndex, geometry, jsonb } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().default(""),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: uuid("id").primaryKey().defaultRandom(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: uuid("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: uuid("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: uuid("id").primaryKey().defaultRandom(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull().default(""),
  whatsappNumber: text("whatsapp_number").notNull().default(""),
  docType: text("doc_type").notNull().default(""),
  docLastFour: text("doc_last_four").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const items = pgTable("items", {
  id: uuid("id").primaryKey().defaultRandom(),
  finderId: uuid("finder_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  imageUrls: jsonb("image_urls").$type<string[]>().notNull().default([]),
  locationName: text("location_name").notNull().default(""),
  fuzzedLocation: geometry("fuzzed_location", { type: "point", srid: 4326 }).notNull(),
  rawLocation: geometry("raw_location", { type: "point", srid: 4326 }).notNull(),
  question1: text("question_1").notNull(),
  question2: text("question_2").notNull(),
  answer1Hash: text("answer_1_hash").notNull(),
  answer2Hash: text("answer_2_hash").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const claims = pgTable("claims", {
  id: uuid("id").primaryKey().defaultRandom(),
  itemId: uuid("item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
  claimerId: uuid("claimer_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  answer1: text("answer_1").notNull().default(""),
  answer2: text("answer_2").notNull().default(""),
  status: text("status").notNull().default("pending_review"),
  finderConfirmed: boolean("finder_confirmed").notNull().default(false),
  claimerConfirmed: boolean("claimer_confirmed").notNull().default(false),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniquePerClaimer: uniqueIndex("claims_item_claimer_idx").on(t.itemId, t.claimerId),
}));

export const categoryQuestions = pgTable("category_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: text("category").notNull(),
  questionText: text("question_text").notNull(),
  active: boolean("active").notNull().default(true),
});