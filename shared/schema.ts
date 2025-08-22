import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const visitors = pgTable("visitors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  company: text("company"),
  hostName: text("host_name").notNull(),
  visitReason: text("visit_reason").notNull(),
  photoData: text("photo_data"), // base64 encoded photo
  signInTime: timestamp("sign_in_time").notNull().defaultNow(),
  signOutTime: timestamp("sign_out_time"),
  isSignedOut: boolean("is_signed_out").notNull().default(false),
  emailSent: boolean("email_sent").notNull().default(false),
});

export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  userId: text("user_id"),
  details: json("details"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertVisitorSchema = createInsertSchema(visitors).omit({
  id: true,
  signInTime: true,
  signOutTime: true,
  isSignedOut: true,
  emailSent: true,
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});

export const signInVisitorSchema = insertVisitorSchema.extend({
  photoData: z.string().optional(),
});

export const signOutVisitorSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export const adminLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type Visitor = typeof visitors.$inferSelect;
export type InsertVisitor = z.infer<typeof insertVisitorSchema>;
export type SignInVisitor = z.infer<typeof signInVisitorSchema>;
export type SignOutVisitor = z.infer<typeof signOutVisitorSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminLogin = z.infer<typeof adminLoginSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
