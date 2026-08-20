"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SendEmailButtons } from "./SendEmailButtons";

export type PartRow = {
  id: string;
  sku: string;
  name: string;
  barcode?: string | null;
  quantity: number;
  unit?: string;
  status: "in_stock" | "low" | "out_of_stock" | string;
  vendor: string;
  catalogUrl?: string | null;
  imageUrl?: string | null;
};

type CatalogLink = { id: string; label: string; url: string; vendor: string };
type StreamItem = { sku: string; name: string; barcode?: string; vendor: string };

type Mode = "inventory" | "order";

/**
 * ESA Parts Card — ordering + conversational inventory (Ava007).
 * Mobile standalone: same Input Ingestion Interface pattern.
 */
export function PartsCard({
  mobileStandalone = false,
  className = "",
}: {
  mobileStandalone?: boolean;
  className?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("inventory");
  const [parts, setParts] = useState<PartRow[]>([]);
  const [mandatory, setMandatory] = useState(true);
  const [catalogLinks, setCatalogLinks] = useState<CatalogLink[]>([]);
  const [stream, setStream] = useState<StreamItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [avaPrompt, setAvaPrompt] = useState(
    "Inventory mode. Scan a barcode or photograph a part. I'll ask for quantity."
  );
  const [pending, setPending] = useState<{
    name: string;
    sku?: string;
    barcode?: string | null;
    imageUrl?: string | null;
  } | null>(null);
  const [qtyInput, setQtyInput] = useState("0");
  const [orderSku, setOrderSku] = useState("");
  const [orderQty, setOrderQty] = useState("1");
  const [lastOrder, setLastOrder] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/inventory");
    const data = await res.json();
    setParts(data.parts ?? []);
    setMandatory(!!data.mandatoryInventory || !!data.bootstrapRequired);
    setCatalogLinks(data.catalogLinks ?? []);
    setStream(data.streamCatalog ?? []);
    if (data.mandatoryInventory) {
      setAvaPrompt(
        "No inventory database yet. Inventory is mandatory. Scan or photograph a part to begin."
      );
    }
  }, []);

  useEffect(() => {
    refresh().catch(() => setError("Failed to load inventory"));
  }, [refresh]);

  async function commitQuantity() {
    if (!pending) return;
    const quantity = Math.max(0, parseInt(qtyInput, 10) || 0);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "scan_add",
          name: pending.name,
          sku: pending.sku,
          barcode: pending.barcode,
          imageUrl: pending.imageUrl,
          quantity,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Save failed");
      setAvaPrompt(
        data.conversational?.prompt ??
          (quantity === 0
            ? "Out of stock (red). Add service request to today's todos?"
            : "Saved. Scan next item.")
      );
      setPending(null);
      setQtyInput("0");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const file = files[0];
    setBusy(true);
    setError(null);
    try {
      let imageUrl: string | null = null;
      if (file.type.startsWith("image/")) {
        imageUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result));
          r.onerror = reject;
          r.readAsDataURL(file);
        });
      }
      const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
      setPending({
        name: baseName || "Photographed part",
        sku: undefined,
        barcode: null,
        imageUrl,
      });
      setAvaPrompt(
        `I see "${baseName || "this part"}". How many are on hand? Enter 0 for out of stock.`
      );
      setMode("inventory");
      setQtyInput("1");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read file");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function onBarcodeSubmit(code: string) {
    const trimmed = code.trim();
    if (!trimmed) return;
    const fromStream = stream.find(
      (s) => s.barcode === trimmed || s.sku === trimmed
    );
    setPending({
      name: fromStream?.name ?? `Part ${trimmed}`,
      sku: fromStream?.sku ?? trimmed,
      barcode: trimmed,
      imageUrl: null,
    });
    setAvaPrompt(
      fromStream
        ? `Matched catalog: ${fromStream.name}. Quantity on hand?`
        : `Barcode ${trimmed}. What quantity is on the shelf? (0 = out of stock)`
    );
    setMode("inventory");
    setQtyInput("1");
  }

  async function placeOrder() {
    setBusy(true);
    setError(null);
    setLastOrder(null);
    try {
      const res = await fetch("/api/parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: orderSku,
          quantity: parseInt(orderQty, 10) || 1,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Order failed");
      setLastOrder(data.message || data.orderId);
      setAvaPrompt(`Order placed: ${data.orderId}. HD Supply / Punch-In fallback available.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Order failed");
    } finally {
      setBusy(false);
    }
  }

  async function addServiceTodo(part: PartRow) {
    setBusy(true);
    try {
      const res = await fetch("/api/service-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Restock / service: ${part.name}`,
          service: "Parts / warranty service",
          partSku: part.sku,
          notes: part.status === "out_of_stock" ? "Out of stock" : part.status,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setAvaPrompt(`Added to Today's Jobs: ${data.request?.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Service request failed");
    } finally {
      setBusy(false);
    }
  }

  async function streamAdd(sku: string) {
    const q = prompt(`Quantity for ${sku}?`, "1");
    if (q === null) return;
    setBusy(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "stream_add",
          sku,
          quantity: parseInt(q, 10) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Stream add failed");
      await refresh();
      setAvaPrompt(`Streamed ${sku} into inventory at qty ${q}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Stream add failed");
    } finally {
      setBusy(false);
    }
  }

  const shell = mobileStandalone
    ? "mx-auto max-w-md min-h-screen bg-[#0a0a0f] text-[#e8e8ed]"
    : "rounded-2xl border border-[#1e1e2e] bg-[#12121a] text-[#e8e8ed]";

  return (
    <div className={`${shell} ${className}`} data-card="esa-parts">
      <div className="border-b border-[#1e1e2e] px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#7c3aed]">
              ESA Parts Card
            </p>
            <h2 className="text-base font-semibold">
              {mode === "inventory" ? "Inventory mode" : "Parts ordering"}
            </h2>
          </div>
          <div className="flex rounded-lg border border-[#2a2a3a] p-0.5 text-xs">
            <button
              type="button"
              className={`rounded-md px-2 py-1 ${
                mode === "inventory" ? "bg-[#7c3aed]/30 text-[#ddd]" : "text-[#888]"
              }`}
              onClick={() => setMode("inventory")}
            >
              Inventory
            </button>
            <button
              type="button"
              className={`rounded-md px-2 py-1 ${
                mode === "order" ? "bg-[#00d4ff]/20 text-[#00d4ff]" : "text-[#888]"
              }`}
              onClick={() => setMode("order")}
            >
              Order
            </button>
          </div>
        </div>
        {mandatory && (
          <p className="mt-2 rounded-lg bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-200">
            Mandatory inventory — system has no parts database yet.
          </p>
        )}
        <div className="mt-2">
          <SendEmailButtons
            aloneContext={{
              type: "parts_inventory",
              mandatory,
              partsCount: parts.length,
              outOfStock: parts.filter((x) => x.status === "out_of_stock").map((x) => x.sku),
            }}
          />
        </div>
      </div>

      <div className="border-b border-[#1e1e2e] bg-[#0d0d14] px-4 py-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-[#00d4ff]">
          Ava007
        </p>
        <p className="mt-1 text-sm text-[#ccc]">{avaPrompt}</p>
        {pending && (
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <div className="min-w-[8rem] flex-1">
              <label className="text-[10px] text-[#666]">Quantity</label>
              <input
                type="number"
                min={0}
                value={qtyInput}
                onChange={(e) => setQtyInput(e.target.value)}
                className="mt-0.5 w-full rounded-lg border border-[#2a2a3a] bg-[#0a0a0f] px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={commitQuantity}
              className="rounded-lg bg-[#00d4ff] px-4 py-2 text-sm font-semibold text-[#0a0a0f] disabled:opacity-50"
            >
              Record
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mx-4 mt-3 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      {mode === "order" && (
        <div className="space-y-3 px-4 py-3">
          <p className="text-xs text-[#888]">
            Order against inventory SKUs (blocked until inventory exists).
          </p>
          <div className="flex gap-2">
            <input
              value={orderSku}
              onChange={(e) => setOrderSku(e.target.value)}
              placeholder="SKU"
              className="flex-1 rounded-lg border border-[#2a2a3a] bg-[#0a0a0f] px-3 py-2 text-sm"
            />
            <input
              type="number"
              min={1}
              value={orderQty}
              onChange={(e) => setOrderQty(e.target.value)}
              className="w-20 rounded-lg border border-[#2a2a3a] bg-[#0a0a0f] px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={busy || mandatory}
              onClick={placeOrder}
              className="rounded-lg bg-[#00d4ff] px-3 py-2 text-sm font-semibold text-[#0a0a0f] disabled:opacity-40"
            >
              Order
            </button>
          </div>
          {lastOrder && <p className="text-xs text-emerald-300">{lastOrder}</p>}
        </div>
      )}

      <ul className="max-h-56 space-y-2 overflow-y-auto px-4 py-3">
        {parts.map((p) => (
          <li
            key={p.id}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
              p.status === "out_of_stock"
                ? "border-red-500/50 bg-red-950/40"
                : p.status === "low"
                  ? "border-amber-500/40 bg-amber-950/20"
                  : "border-[#1e1e2e] bg-[#0a0a0f]"
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{p.name}</p>
              <p className="font-mono text-[11px] text-[#666]">
                {p.sku}
                {p.barcode ? ` · ${p.barcode}` : ""}
              </p>
            </div>
            <div className="text-right">
              <p
                className={`text-sm font-semibold ${
                  p.status === "out_of_stock" ? "text-red-400" : "text-[#e8e8ed]"
                }`}
              >
                {p.quantity}
                {p.status === "out_of_stock" && (
                  <span className="ml-1 text-[10px] uppercase">OOS</span>
                )}
              </p>
              <button
                type="button"
                className="text-[10px] text-[#00d4ff]"
                onClick={() => addServiceTodo(p)}
              >
                + todo
              </button>
            </div>
          </li>
        ))}
        {parts.length === 0 && (
          <li className="rounded-xl border border-dashed border-[#2a2a3a] px-3 py-6 text-center text-xs text-[#666]">
            No parts yet — start inventory below
          </li>
        )}
      </ul>

      <div className="border-t border-[#1e1e2e] px-4 py-3">
        <p className="text-[10px] uppercase tracking-wide text-[#555]">
          Catalog links · stream into DB
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {catalogLinks.map((c) => (
            <a
              key={c.id}
              href={c.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[#2a2a3a] px-2.5 py-1 text-[11px] text-[#aaa] hover:border-[#00d4ff]"
            >
              {c.label}
            </a>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {stream.map((s) => (
            <button
              key={s.sku}
              type="button"
              onClick={() => streamAdd(s.sku)}
              className="rounded-md bg-[#1a1a24] px-2 py-1 text-[11px] text-[#bbb] hover:bg-[#222]"
            >
              + {s.sku}
            </button>
          ))}
        </div>
      </div>

      <div
        className="border-t border-[#1e1e2e] bg-[#0d0d14] px-3 py-3"
        data-surface="input-ingestion"
      >
        <div className="rounded-2xl border border-[#2a2a3a] bg-[#12121a] p-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (fileRef.current) {
                fileRef.current.accept = "image/*";
                fileRef.current.capture = "environment";
                fileRef.current.click();
              }
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-[#1a1a24]"
          >
            Photograph part (Ava007 asks qty)
          </button>
          <BarcodeRow onSubmit={onBarcodeSubmit} disabled={busy} />
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (fileRef.current) {
                fileRef.current.accept = "image/*,application/pdf,.csv";
                fileRef.current.removeAttribute("capture");
                fileRef.current.click();
              }
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-[#1a1a24]"
          >
            Add files / catalog sheet
          </button>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
        </div>
      </div>
    </div>
  );
}

function BarcodeRow({
  onSubmit,
  disabled,
}: {
  onSubmit: (code: string) => void;
  disabled?: boolean;
}) {
  const [code, setCode] = useState("");
  return (
    <form
      className="flex gap-2 px-1 py-1"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(code);
        setCode("");
      }}
    >
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        disabled={disabled}
        placeholder="Scan or type barcode / SKU"
        className="flex-1 rounded-lg border border-[#2a2a3a] bg-[#0a0a0f] px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={disabled}
        className="rounded-lg border border-[#2a2a3a] px-3 text-sm text-[#00d4ff]"
      >
        Scan
      </button>
    </form>
  );
}
