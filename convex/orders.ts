import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { orderStatus } from "./schema";
import { assertAdmin, isValidAdminToken } from "./lib/auth";
import {
  ADDONS,
  ALL_FLAVOURS,
  BASES,
  HEADS,
} from "../src/lib/catalog";

const orderInput = {
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
};

export const createOrder = mutation({
  args: orderInput,
  handler: async (ctx, args) => {
    const base = BASES.find((b) => b.name === args.base.name);
    if (!base) throw new ConvexError("Invalid base selection");

    const head = HEADS.find((h) => h.name === args.head.name);
    if (!head) throw new ConvexError("Invalid head selection");

    const maxFlavours = base.name.startsWith("Mixed") ? 3 : 1;
    if (args.flavours.length === 0) {
      throw new ConvexError("Select at least one flavour");
    }
    if (args.flavours.length > maxFlavours) {
      throw new ConvexError(`Too many flavours for ${base.name}`);
    }
    for (const f of args.flavours) {
      if (!ALL_FLAVOURS.has(f)) {
        throw new ConvexError(`Unknown flavour: ${f}`);
      }
    }

    const normalisedAddons = args.addons.map((a) => {
      const known = ADDONS.find((x) => x.name === a.name);
      if (!known) throw new ConvexError(`Unknown add-on: ${a.name}`);
      const qty = Math.floor(a.qty);
      if (!Number.isFinite(qty) || qty <= 0) {
        throw new ConvexError(`Invalid quantity for ${a.name}`);
      }
      return { name: known.name, price: known.price, qty };
    });

    const name = args.customer.name.trim();
    const phone = args.customer.phone.trim();
    const address = args.customer.address.trim();
    if (!name || !phone || !address) {
      throw new ConvexError("Name, phone and address are required");
    }
    if (!Number.isFinite(args.customer.deliveryTime)) {
      throw new ConvexError("Invalid delivery time");
    }

    const addonsTotal = normalisedAddons.reduce(
      (sum, a) => sum + a.price * a.qty,
      0,
    );
    const total = base.price + head.price + addonsTotal;

    const now = Date.now();
    const orderId = await ctx.db.insert("orders", {
      base: { name: base.name, price: base.price, desc: base.desc },
      flavours: args.flavours,
      head: { name: head.name, price: head.price },
      addons: normalisedAddons,
      customer: {
        name,
        phone,
        address,
        deliveryTime: args.customer.deliveryTime,
        notes: args.customer.notes?.trim() || undefined,
      },
      total,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    return { orderId, total };
  },
});

export const validateAdminToken = query({
  args: { token: v.string() },
  handler: async (_ctx, { token }) => {
    return { ok: isValidAdminToken(token) };
  },
});

export const listOrders = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    assertAdmin(token);
    return await ctx.db
      .query("orders")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();
  },
});

export const updateOrderStatus = mutation({
  args: {
    token: v.string(),
    orderId: v.id("orders"),
    status: orderStatus,
  },
  handler: async (ctx, { token, orderId, status }) => {
    assertAdmin(token);
    await ctx.db.patch(orderId, { status, updatedAt: Date.now() });
  },
});

export const updateOrder = mutation({
  args: {
    token: v.string(),
    orderId: v.id("orders"),
    customer: v.optional(
      v.object({
        name: v.string(),
        phone: v.string(),
        address: v.string(),
        deliveryTime: v.number(),
        notes: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, { token, orderId, customer }) => {
    assertAdmin(token);
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (customer) patch.customer = customer;
    await ctx.db.patch(orderId, patch);
  },
});
