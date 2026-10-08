import { useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Crosshair, Loader2, Maximize2, Minus, Network, Plus, Sparkles, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import useAuth from "@/hooks/auth/use-auth";
import { useEgoGraph } from "@/hooks/data/graph/useEgoGraph";
import NetworkCanvas from "@/components/graph/NetworkCanvas";
import PersonAvatar from "@/components/people/PersonAvatar";

const RING_LABEL = ["Centre", "Friend", "Friend of a friend", "Suggested"];

function Legend({ hasSuggestions }) {
  const items = [
    ["bg-primary", "Centre"],
    ["bg-primary/75", "Friends"],
    ["bg-muted-foreground/45", "Friends of friends"],
  ];
  if (hasSuggestions) items.push(["bg-amber-500", "Suggested for you"]);
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map(([cls, label]) => (
        <span key={label} className="inline-flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-full ${cls}`} aria-hidden="true" /> {label}
        </span>
      ))}
    </div>
  );
}

function PersonButton({ node, onClick, active, extra }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-xl p-2 text-left transition-colors ${
        active ? "bg-primary/10" : "hover:bg-primary/5"
      }`}
    >
      <PersonAvatar person={node} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium truncate">{node.name}</span>
        <span className="block text-xs text-muted-foreground truncate">{extra}</span>
      </span>
    </button>
  );
}

export default function Explorer() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const centerId = params.get("center") ?? user?.id;
  const depth = params.get("depth") === "1" ? 1 : 2;
  const { data: graph, isLoading, isFetching, error } = useEgoGraph(user?.id, centerId, depth);
  const [selectedId, setSelectedId] = useState(null);
  const canvas = useRef(null);

  const nodesById = useMemo(() => new Map(graph?.nodes.map((n) => [n.id, n]) ?? []), [graph]);
  // links each person has inside the drawn network
  const localDegree = useMemo(() => {
    const d = new Map();
    for (const l of graph?.links ?? []) {
      d.set(l.source, (d.get(l.source) || 0) + 1);
      d.set(l.target, (d.get(l.target) || 0) + 1);
    }
    return d;
  }, [graph]);
  const center = graph?.nodes.find((n) => n.ring === 0);
  const selected = nodesById.get(selectedId) ?? null;
  const isMe = String(centerId) === String(user?.id);
  const suggested = (graph?.nodes ?? []).filter((n) => n.suggestedRank).sort((a, b) => a.suggestedRank - b.suggestedRank);
  const friends = (graph?.nodes ?? []).filter((n) => n.ring === 1).sort((a, b) => (localDegree.get(b.id) || 0) - (localDegree.get(a.id) || 0) || a.name.localeCompare(b.name));
  const mutualWithCenter = useMemo(() => {
    if (!selected || !graph) return 0;
    const ring1 = new Set(graph.nodes.filter((n) => n.ring === 1).map((n) => n.id));
    return graph.links.filter(
      (l) => (l.source === selected.id && ring1.has(l.target)) || (l.target === selected.id && ring1.has(l.source))
    ).length;
  }, [selected, graph]);

  const update = (changes) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) (v == null ? next.delete(k) : next.set(k, v));
    setParams(next);
  };
  const recenter = (node) => {
    setSelectedId(null);
    update({ center: String(node.id) === String(user?.id) ? null : node.id });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
            <Network className="h-7 w-7 text-primary" /> Network Explorer
          </h1>
          <p className="text-muted-foreground">
            {center ? (
              <>
                {isMe ? "Your" : `${center.name}'s`} network: rings show degrees of separation.
                Drag to pan, scroll to zoom, double-click someone to explore from them.
              </>
            ) : (
              "Loading the network from Neo4j..."
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="inline-flex rounded-lg border border-border p-1 bg-background/50" role="group" aria-label="Depth">
            {[
              [1, "Friends"],
              [2, "Friends of friends"],
            ].map(([d, label]) => (
              <button
                key={d}
                type="button"
                aria-pressed={depth === d}
                onClick={() => update({ depth: d === 2 ? null : 1 })}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  depth === d ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {!isMe && (
            <Button variant="outline" onClick={() => recenter({ id: user.id })}>
              <Crosshair className="h-4 w-4 mr-1" /> Back to me
            </Button>
          )}
        </div>
      </div>

      {graph && (
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ["Friends", graph.friendTotal, graph.friendTotal > 150 ? "strongest 150 shown" : null],
            ["Friends of friends", depth > 1 ? graph.secondTotal : "-", depth > 1 && graph.secondTotal > 150 ? "best connected 150 shown" : null],
            ["People drawn", graph.nodes.length, null],
            ["Friendships drawn", graph.links.length, null],
          ].map(([label, value, note]) => (
            <div key={label} className="glass rounded-2xl p-4">
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
              <dd className="text-2xl font-heading font-bold tabular-nums">{value}</dd>
              {note && <dd className="text-xs text-muted-foreground">{note}</dd>}
            </div>
          ))}
        </dl>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <div className="glass rounded-2xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/60">
            <Legend hasSuggestions={suggested.length > 0} />
            <div className="flex gap-1 shrink-0">
              <Button size="icon" variant="ghost" aria-label="Zoom in" onClick={() => canvas.current?.zoomIn()}>
                <Plus className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" aria-label="Zoom out" onClick={() => canvas.current?.zoomOut()}>
                <Minus className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" aria-label="Fit to screen" onClick={() => canvas.current?.fit()}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="relative h-[60vh] min-h-[420px]">
            {error ? (
              <div className="absolute inset-0 flex items-center justify-center text-destructive p-6 text-center">
                Couldn&apos;t load the network: {error.response?.data?.error || error.message}
              </div>
            ) : (
              <NetworkCanvas
                ref={canvas}
                graph={graph}
                selectedId={selectedId}
                onSelect={(node) => setSelectedId(node?.id ?? null)}
                onRecenter={recenter}
              />
            )}
            {(isLoading || isFetching) && (
              <div className="absolute top-3 right-3 inline-flex items-center gap-2 rounded-full bg-background/80 px-3 py-1 text-xs text-muted-foreground shadow">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Querying Neo4j
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <section className="glass rounded-2xl p-5 space-y-4" aria-live="polite">
            {selected ? (
              <>
                <div className="flex items-center gap-3">
                  <PersonAvatar person={selected} />
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{selected.name}</p>
                    <p className="text-xs text-muted-foreground truncate">@{selected.username}</p>
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Position</dt>
                    <dd className="font-medium">{RING_LABEL[selected.ring]}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Friends</dt>
                    <dd className="font-medium tabular-nums">{selected.friendCount}</dd>
                  </div>
                  {selected.ring >= 2 && (
                    <div className="col-span-2">
                      <dt className="text-xs text-muted-foreground">
                        Connected to {isMe ? "your" : `${center?.name}'s`} friends
                      </dt>
                      <dd className="font-medium tabular-nums">{mutualWithCenter} of them</dd>
                    </div>
                  )}
                </dl>
                {selected.suggestedRank && (
                  <p className="text-sm rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 px-3 py-2">
                    <Sparkles className="inline h-3.5 w-3.5 mr-1" />
                    Suggestion #{selected.suggestedRank}, {Math.round(selected.matchScore)}% match: {selected.reason}
                  </p>
                )}
                <div className="flex flex-col gap-2">
                  <Button asChild>
                    <Link to={`/people/${selected.id}`}>
                      <UserRound className="h-4 w-4 mr-1" /> Open profile
                    </Link>
                  </Button>
                  {selected.ring !== 0 && (
                    <Button variant="outline" onClick={() => recenter(selected)}>
                      <Crosshair className="h-4 w-4 mr-1" /> Explore their network
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Hover a person to highlight their friendships. Click to see details here.
              </p>
            )}
          </section>

          {suggested.length > 0 && (
            <section className="glass rounded-2xl p-4 space-y-2">
              <h2 className="font-heading font-semibold px-1 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" /> Suggested for you
              </h2>
              <ul className="max-h-64 overflow-y-auto">
                {suggested.map((n) => (
                  <li key={n.id}>
                    <PersonButton
                      node={n}
                      active={n.id === selectedId}
                      onClick={() => setSelectedId(n.id)}
                      extra={`#${n.suggestedRank}, ${Math.round(n.matchScore)}% match`}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {friends.length > 0 && (
            <section className="glass rounded-2xl p-4 space-y-2">
              <h2 className="font-heading font-semibold px-1">
                {isMe ? "Your friends" : `${center?.name}'s friends`}{" "}
                <span className="text-muted-foreground font-normal text-sm">({graph.friendTotal})</span>
              </h2>
              <ul className="max-h-72 overflow-y-auto">
                {friends.map((n) => (
                  <li key={n.id}>
                    <PersonButton
                      node={n}
                      active={n.id === selectedId}
                      onClick={() => setSelectedId(n.id)}
                      extra={`${localDegree.get(n.id) || 0} links in this view`}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
