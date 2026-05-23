import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const orderStatus = v.union(
  v.literal("pending"),
  v.literal("confirmed"),
  v.literal("completed"),
  v.literal("cancelled"),
);

export default defineSchema({
  orders: defineTable({
    base: v.object({
      name: v.string(),
      price: v.number(),
      desc: v.string(),
    }),
    flavours: v.array(v.string()),
    head: v.object({
      name: v.string(),
      price: v.number(),
    }),
    addons: v.array(
      v.object({
        name: v.string(),
        price: v.number(),
        qty: v.number(),
      }),
    ),
    customer: v.object({
      name: v.string(),
      phone: v.string(),
      address: v.string(),
      deliveryTime: v.number(),
      notes: v.optional(v.string()),
    }),
    total: v.number(),
    status: orderStatus,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_status", ["status"]),
});
