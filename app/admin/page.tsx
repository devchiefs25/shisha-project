"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { Loader2, Lock, LogOut, RefreshCw, Search, ShieldAlert } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/catalog";

const TOKEN_KEY = "alsahra.adminToken";
const PAGE_SIZE = 10;

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_VARIANT: Record<OrderStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  confirmed: "default",
  completed: "outline",
  cancelled: "destructive",
};

const FILTERS: ReadonlyArray<"all" | OrderStatus> = ["all", ...ORDER_STATUSES];

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(TOKEN_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setToken(stored);
    setHydrated(true);
  }, []);

  const handleUnlock = (t: string) => {
    sessionStorage.setItem(TOKEN_KEY, t);
    setToken(t);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
  };

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {token ? (
        <Dashboard token={token} onLogout={handleLogout} />
      ) : (
        <TokenGate onUnlock={handleUnlock} />
      )}
    </div>
  );
}

function TokenGate({ onUnlock }: { onUnlock: (token: string) => void }) {
  const [value, setValue] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingToken, setPendingToken] = useState<string | null>(null);

  const validation = useQuery(
    api.orders.validateAdminToken,
    pendingToken ? { token: pendingToken } : "skip",
  );

  useEffect(() => {
    if (pendingToken == null) return;
    if (validation === undefined) return;
    if (validation.ok) {
      onUnlock(pendingToken);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("Invalid token");
    }
    setChecking(false);
    setPendingToken(null);
  }, [validation, pendingToken, onUnlock]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || checking) return;
    setError(null);
    setChecking(true);
    setPendingToken(value.trim());
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-md border-gold/40 bg-card/80 backdrop-blur shadow-deep">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 bg-gold/5 text-gold">
            <Lock className="h-5 w-5" />
          </div>
          <CardTitle className="font-display text-2xl text-gradient-gold">
            Admin Access
          </CardTitle>
          <CardDescription>
            Enter the admin token to view orders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              autoFocus
              placeholder="Paste admin token"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={checking}
              className="font-mono"
            />
            {error && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <ShieldAlert className="h-3.5 w-3.5" />
                {error}
              </div>
            )}
            <Button
              type="submit"
              disabled={!value.trim() || checking}
              className="w-full bg-gold-gradient text-primary-foreground shadow-gold hover:scale-[1.01]"
            >
              {checking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying
                </>
              ) : (
                "Unlock"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

type Order = Doc<"orders">;

function Dashboard({
  token,
  onLogout,
}: {
  token: string;
  onLogout: () => void;
}) {
  const orders = useQuery(api.orders.listOrders, { token }) as
    | Order[]
    | undefined;
  const updateStatus = useMutation(api.orders.updateOrderStatus);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [page, setPage] = useState(1);

  const onSearchChange = (v: string) => {
    setSearch(v);
    setPage(1);
  };
  const onFilterChange = (f: (typeof FILTERS)[number]) => {
    setFilter(f);
    setPage(1);
  };

  // If token gets revoked (or server rejects), Convex throws and the
  // component re-renders with orders === undefined indefinitely. We catch
  // that path with an error fallback further down.
  const filtered = useMemo(() => {
    if (!orders) return [];
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter !== "all" && o.status !== filter) return false;
      if (!q) return true;
      return (
        o.customer.name.toLowerCase().includes(q) ||
        o.customer.phone.toLowerCase().includes(q) ||
        o.customer.address.toLowerCase().includes(q) ||
        o.status.toLowerCase().includes(q)
      );
    });
  }, [orders, search, filter]);

  const counts = useMemo(() => {
    const base = { all: orders?.length ?? 0 } as Record<string, number>;
    for (const s of ORDER_STATUSES) base[s] = 0;
    for (const o of orders ?? []) base[o.status] = (base[o.status] ?? 0) + 1;
    return base;
  }, [orders]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  );
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, filtered.length);

  const handleStatusChange = async (
    orderId: Id<"orders">,
    status: OrderStatus,
  ) => {
    try {
      await updateStatus({ token, orderId, status });
      toast.success(`Marked as ${STATUS_LABEL[status]}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update status";
      toast.error(message.replace(/^\[CONVEX[^\]]*\]\s*/, ""));
    }
  };

  return (
    <div className="container mx-auto px-6 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs tracking-[0.4em] text-gold">DASHBOARD</div>
          <h1 className="font-display text-3xl text-gradient-gold md:text-4xl">
            Orders
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="border-border"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Reload
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="border-border"
          >
            <LogOut className="mr-1.5 h-3.5 w-3.5" /> Lock
          </Button>
        </div>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, phone, address, status…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const active = filter === f;
            const label = f === "all" ? "All" : STATUS_LABEL[f];
            return (
              <button
                key={f}
                onClick={() => onFilterChange(f)}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${
                  active
                    ? "border-gold bg-gold/15 text-gold"
                    : "border-border text-muted-foreground hover:border-gold/50 hover:text-foreground"
                }`}
              >
                {label}
                <span
                  className={`ml-1.5 text-[10px] ${active ? "text-gold/80" : "text-muted-foreground/60"}`}
                >
                  {counts[f] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {orders === undefined ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading orders…
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-border bg-card/60">
          <CardContent className="py-16 text-center text-muted-foreground">
            No orders match your filters.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden rounded-2xl border border-border bg-card/60 backdrop-blur lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[170px]">Placed</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="w-[170px]">Delivery</TableHead>
                  <TableHead className="w-[90px] text-right">Total</TableHead>
                  <TableHead className="w-[160px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((o) => (
                  <TableRow key={o._id}>
                    <TableCell className="align-top text-xs text-muted-foreground">
                      <div>{formatDate(o.createdAt)}</div>
                      <div className="mt-1 font-mono text-[10px] tracking-wider text-muted-foreground/70">
                        #{o._id.slice(-6).toUpperCase()}
                      </div>
                      {o.updatedAt !== o.createdAt && (
                        <div className="mt-1 text-[10px] text-muted-foreground/60">
                          updated {formatDate(o.updatedAt)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="font-medium text-foreground">
                        {o.customer.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <a
                          href={`tel:${o.customer.phone}`}
                          className="hover:text-gold"
                        >
                          {o.customer.phone}
                        </a>
                      </div>
                      <div className="mt-1 max-w-[220px] text-xs text-muted-foreground">
                        {o.customer.address}
                      </div>
                      {o.customer.notes && (
                        <div className="mt-1 max-w-[220px] text-xs italic text-gold/80">
                          “{o.customer.notes}”
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      <OrderSummary order={o} />
                    </TableCell>
                    <TableCell className="align-top text-xs">
                      {formatDate(o.customer.deliveryTime)}
                    </TableCell>
                    <TableCell className="align-top text-right font-display text-gold">
                      ${o.total.toFixed(2)}
                    </TableCell>
                    <TableCell className="align-top">
                      <StatusSelect
                        value={o.status}
                        onChange={(s) => handleStatusChange(o._id, s)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile / tablet cards */}
          <div className="space-y-3 lg:hidden">
            {paged.map((o) => (
              <Card key={o._id} className="border-border bg-card/60 backdrop-blur">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">
                        {o.customer.name}
                      </CardTitle>
                      <CardDescription className="mt-1 text-xs">
                        <a href={`tel:${o.customer.phone}`}>{o.customer.phone}</a>{" "}
                        · #{o._id.slice(-6).toUpperCase()}
                      </CardDescription>
                    </div>
                    <Badge variant={STATUS_VARIANT[o.status]}>
                      {STATUS_LABEL[o.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <Row label="Placed" value={formatDate(o.createdAt)} />
                  <Row label="Delivery" value={formatDate(o.customer.deliveryTime)} />
                  <Row label="Address" value={o.customer.address} />
                  {o.customer.notes && (
                    <Row label="Notes" value={`“${o.customer.notes}”`} />
                  )}
                  <div className="border-t border-border pt-3">
                    <OrderSummary order={o} />
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <div className="font-display text-xl text-gold">
                      ${o.total.toFixed(2)}
                    </div>
                    <StatusSelect
                      value={o.status}
                      onChange={(s) => handleStatusChange(o._id, s)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="text-xs text-muted-foreground">
              Showing <span className="text-foreground">{rangeStart}</span>–
              <span className="text-foreground">{rangeEnd}</span> of{" "}
              <span className="text-foreground">{filtered.length}</span>
            </div>
            {pageCount > 1 && (
              <PagerControls
                page={safePage}
                pageCount={pageCount}
                onChange={setPage}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function PagerControls({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (p: number) => void;
}) {
  const pages = pageList(page, pageCount);
  const go = (p: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (p < 1 || p > pageCount || p === page) return;
    onChange(p);
  };
  return (
    <Pagination className="mx-0 w-auto justify-end">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={go(page - 1)}
            aria-disabled={page === 1}
            className={page === 1 ? "pointer-events-none opacity-40" : ""}
          />
        </PaginationItem>
        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <PaginationItem key={`e-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink
                href="#"
                isActive={p === page}
                onClick={go(p)}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={go(page + 1)}
            aria-disabled={page === pageCount}
            className={
              page === pageCount ? "pointer-events-none opacity-40" : ""
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

function pageList(page: number, pageCount: number): Array<number | "ellipsis"> {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const out: Array<number | "ellipsis"> = [1];
  const left = Math.max(2, page - 1);
  const right = Math.min(pageCount - 1, page + 1);
  if (left > 2) out.push("ellipsis");
  for (let i = left; i <= right; i++) out.push(i);
  if (right < pageCount - 1) out.push("ellipsis");
  out.push(pageCount);
  return out;
}

function StatusSelect({
  value,
  onChange,
}: {
  value: OrderStatus;
  onChange: (status: OrderStatus) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as OrderStatus)}>
      <SelectTrigger className="h-9 w-[140px]">
        <SelectValue>
          <Badge variant={STATUS_VARIANT[value]}>{STATUS_LABEL[value]}</Badge>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {ORDER_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {STATUS_LABEL[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function OrderSummary({ order }: { order: Order }) {
  return (
    <div className="space-y-1 text-xs">
      <div className="text-foreground">{order.base.name}</div>
      <div className="text-muted-foreground">
        Flavours: {order.flavours.join(", ") || "—"}
      </div>
      <div className="text-muted-foreground">Head: {order.head.name}</div>
      {order.addons.length > 0 && (
        <div className="text-muted-foreground">
          Add-ons:{" "}
          {order.addons
            .map((a) => (a.qty > 1 ? `${a.name} ×${a.qty}` : a.name))
            .join(", ")}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-foreground">{value}</span>
    </div>
  );
}

function formatDate(ms: number) {
  if (!Number.isFinite(ms)) return "—";
  const d = new Date(ms);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
