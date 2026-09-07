"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  EnvironmentVariables,
  EnvironmentVariable,
  EnvironmentVariableCopyButton,
  EnvironmentVariableGroup,
  EnvironmentVariableName,
  EnvironmentVariableRequired,
  EnvironmentVariableValue,
  EnvironmentVariablesContent,
  EnvironmentVariablesHeader,
  EnvironmentVariablesTitle,
  EnvironmentVariablesToggle,
} from "@/components/ai/environment-variables";
import { ENV_VAR_DOCS } from "@/lib/backends/registry";

interface BackendStatus {
  id: string;
  label: string;
  tier: string;
  keyEnv: string;
  available: boolean;
  keyMask: string | null;
  endpoint?: string;
  model?: string;
}

interface ProbeResult {
  ok: boolean;
  backend?: string;
  error?: string;
  identity?: string;
  usage?: { prompt_tokens: number; completion_tokens: number };
}

export function BackendsPanel({ initial }: { initial: BackendStatus[] }) {
  const [backends, setBackends] = useState<BackendStatus[]>(initial);
  const [probes, setProbes] = useState<Record<string, ProbeResult | "pending">>(
    {}
  );

  const refresh = useCallback(async () => {
    try {
      const resp = await fetch("/api/ai/backends", { cache: "no-store" });
      const data = (await resp.json()) as { backends: BackendStatus[] };
      setBackends(data.backends);
    } catch {
      /* keep last known statuses */
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const probe = useCallback(async (id: string) => {
    setProbes((p) => ({ ...p, [id]: "pending" }));
    try {
      const resp = await fetch("/api/ai/backends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = (await resp.json()) as ProbeResult;
      setProbes((p) => ({ ...p, [id]: data }));
    } catch (err) {
      setProbes((p) => ({
        ...p,
        [id]: {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        },
      }));
    }
  }, []);

  // Values shown for keys are server-masked tails — full secrets never
  // cross the A2A boundary. Endpoint/model values are non-secret config.
  const rows: { name: string; value: string; secret: boolean }[] = [];
  for (const b of backends) {
    if (b.keyMask) rows.push({ name: b.keyEnv, value: b.keyMask, secret: true });
    if (b.endpoint) rows.push({ name: `${b.id.toUpperCase()}_ENDPOINT`, value: b.endpoint, secret: false });
    if (b.model) rows.push({ name: `${b.id.toUpperCase()}_MODEL`, value: b.model, secret: false });
  }
  for (const name of Object.keys(ENV_VAR_DOCS)) {
    if (!rows.some((r) => r.name === name)) {
      rows.push({ name, value: "", secret: name.endsWith("API_KEY") || name.endsWith("TOKEN") });
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {backends.map((b) => {
          const probeState = probes[b.id];
          return (
            <div
              key={b.id}
              className="rounded-lg border bg-background p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-tight">{b.label}</p>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">
                    tier: {b.tier}
                  </p>
                </div>
                <Badge variant={b.available ? "default" : "secondary"}>
                  {b.available ? "configured" : "not set"}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={probeState === "pending"}
                onClick={() => void probe(b.id)}
              >
                {probeState === "pending" ? "Probing…" : "Probe"}
              </Button>
              {probeState && probeState !== "pending" ? (
                <p className="text-xs leading-relaxed">
                  {probeState.ok ? (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      ok{probeState.identity ? ` — ${probeState.identity}` : ""}
                      {probeState.usage
                        ? ` — ${probeState.usage.completion_tokens} completion tokens`
                        : ""}
                    </span>
                  ) : (
                    <span className="text-destructive">{probeState.error}</span>
                  )}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <EnvironmentVariables>
        <EnvironmentVariablesHeader>
          <EnvironmentVariablesTitle>
            Model backend environment
          </EnvironmentVariablesTitle>
          <EnvironmentVariablesToggle />
        </EnvironmentVariablesHeader>
        <EnvironmentVariablesContent>
          {rows.map((r) => {
            const doc = ENV_VAR_DOCS[r.name];
            return (
              <EnvironmentVariable key={r.name} name={r.name} value={r.value}>
                <div className="flex min-w-0 flex-col gap-1">
                  <EnvironmentVariableGroup>
                    <EnvironmentVariableName />
                    {doc?.required ? <EnvironmentVariableRequired /> : null}
                    {r.value.length === 0 ? (
                      <Badge variant="outline">not set</Badge>
                    ) : null}
                  </EnvironmentVariableGroup>
                  {doc ? (
                    <p className="text-muted-foreground text-xs">{doc.note}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <EnvironmentVariableValue className="max-w-[10rem] truncate sm:max-w-[16rem]" />
                  <EnvironmentVariableCopyButton
                    copyFormat={r.secret ? "export" : "value"}
                  />
                </div>
              </EnvironmentVariable>
            );
          })}
        </EnvironmentVariablesContent>
      </EnvironmentVariables>

      <p className="text-muted-foreground text-xs leading-relaxed">
        Values are read from the server environment at request time. Secrets
        are masked server-side ({"\u2022\u2022\u2022\u2022"} + last 4) — the full
        key never crosses the boundary. Set them in{" "}
        <code className="font-mono">.env.local</code>, then re-scan.
      </p>
    </div>
  );
}
