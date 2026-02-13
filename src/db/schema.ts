import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  boolean,
  real,
  date,
  integer,
  pgEnum,
  primaryKey,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "superadmin"]);
export const unitTypeEnum = pgEnum("unit_type", ["grams", "units"]);
export const momentEnum = pgEnum("moment", ["start", "end"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("user"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verificationTokens = pgTable("verification_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  name: varchar("name", { length: 255 }),
  sex: varchar("sex", { length: 20 }), // 'male' | 'female'
  birthDate: date("birth_date"),
  heightCm: real("height_cm"),
  targetWeightKg: real("target_weight_kg"),
  targetDate: date("target_date"),
  calorieGoal: integer("calorie_goal").default(1700),
  proteinGoal: integer("protein_goal").default(180),
  fatGoal: integer("fat_goal"),
  carbGoal: integer("carb_goal"),
  neatFactor: real("neat_factor").default(1.15),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const foods = pgTable("foods", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  kcalPer100g: real("kcal_per_100g").notNull(),
  proteinPer100g: real("protein_per_100g").notNull().default(0),
  fatPer100g: real("fat_per_100g").notNull().default(0),
  carbsPer100g: real("carbs_per_100g").notNull().default(0),
  unitType: unitTypeEnum("unit_type").notNull().default("grams"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  met: real("met").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const days = pgTable("days", {
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  snapshotKcalIn: integer("snapshot_kcal_in"),
  snapshotKcalOut: integer("snapshot_kcal_out"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.date] }),
}));

export const foodLogs = pgTable("food_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  dayDate: date("day_date").notNull(),
  foodId: uuid("food_id").references(() => foods.id, { onDelete: "cascade" }),
  quantityGrams: real("quantity_grams"),
  quantityUnits: real("quantity_units"),
  meal: varchar("meal", { length: 20 }).default("comida"),
  customName: varchar("custom_name", { length: 255 }),
  customKcal: real("custom_kcal"),
  customProtein: real("custom_protein"),
  customFat: real("custom_fat"),
  customCarbs: real("custom_carbs"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  dayDate: date("day_date").notNull(),
  activityId: uuid("activity_id").references(() => activities.id, { onDelete: "set null" }),
  durationMinutes: real("duration_minutes"),
  manualKcal: real("manual_kcal"),
  wahooCorrection: boolean("wahoo_correction").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const weightLogs = pgTable("weight_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  weightKg: real("weight_kg").notNull(),
  waistCm: real("waist_cm"),
  moment: momentEnum("moment").notNull().default("start"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type Food = typeof foods.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Day = typeof days.$inferSelect;
export type FoodLog = typeof foodLogs.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferInsert;
export type WeightLog = typeof weightLogs.$inferSelect;
