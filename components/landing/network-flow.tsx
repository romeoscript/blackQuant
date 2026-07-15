"use client";

import { useEffect } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Handle,
  Position,
  useReactFlow,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Wallet,
  Cpu,
  Zap,
  Sprout,
  Server,
  Database,
  Bot,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "green" | "red";
type EntityData = {
  Icon: LucideIcon;
  size: number;
  tone: Tone;
  label?: string;
  frame?: boolean;
};

const handleStyle: React.CSSProperties = {
  left: "50%",
  top: "50%",
  width: 1,
  height: 1,
  minWidth: 1,
  minHeight: 1,
  transform: "translate(-50%, -50%)",
  background: "transparent",
  border: "none",
  pointerEvents: "none",
};

function Corners({ tone }: { tone: Tone }) {
  const c = tone === "green" ? "border-bq-green/70" : "border-red-500/70";
  return (
    <>
      <span className={cn("absolute left-0 top-0 size-2.5 border-l border-t", c)} />
      <span className={cn("absolute right-0 top-0 size-2.5 border-r border-t", c)} />
      <span className={cn("absolute bottom-0 left-0 size-2.5 border-b border-l", c)} />
      <span className={cn("absolute bottom-0 right-0 size-2.5 border-b border-r", c)} />
    </>
  );
}

function EntityNode({ data }: NodeProps<Node<EntityData>>) {
  const { Icon, size, tone, label, frame } = data;
  const green = tone === "green";
  const pad = 12;

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative" style={{ width: size + pad * 2, height: size + pad * 2 }}>
        {frame && <Corners tone={tone} />}
        <div
          className={cn(
            "absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border",
            green
              ? "border-bq-green/60 bg-bq-green/[0.07] text-bq-green bq-verify"
              : "border-dashed border-red-500/70 bg-red-500/10 text-red-400 bq-threat",
          )}
          style={{ width: size, height: size }}
        >
          <Icon size={Math.round(size * 0.42)} strokeWidth={1.6} />
        </div>
      </div>

      {label && (
        <span
          className={cn(
            "absolute top-full mt-1.5 whitespace-nowrap rounded-md border px-2 py-1 font-plex text-[9px] uppercase tracking-[1.5px]",
            green
              ? "border-bq-green/30 bg-bq-green/5 text-bq-green"
              : "border-red-500/30 bg-red-500/[0.07] text-red-400",
          )}
        >
          {label}
        </span>
      )}

      <Handle type="target" position={Position.Top} style={handleStyle} isConnectable={false} />
      <Handle type="source" position={Position.Bottom} style={handleStyle} isConnectable={false} />
    </div>
  );
}

const nodeTypes = { entity: EntityNode };

function node(id: string, x: number, y: number, data: EntityData): Node<EntityData> {
  return { id, type: "entity", position: { x, y }, data, draggable: false, selectable: false };
}

const NODES: Node<EntityData>[] = [
  node("wallet", 10, 205, { Icon: Wallet, size: 84, tone: "green", label: "Non-Custodial", frame: true }),
  node("nexus", 300, 45, { Icon: Zap, size: 54, tone: "green" }),
  node("core", 365, 215, { Icon: Cpu, size: 82, tone: "green", frame: true }),
  node("arbor", 292, 380, { Icon: Sprout, size: 54, tone: "green" }),
  node("relay1", 560, 95, { Icon: Server, size: 44, tone: "green" }),
  node("relay2", 660, 280, { Icon: Server, size: 44, tone: "green" }),
  node("relay3", 520, 400, { Icon: Server, size: 42, tone: "green" }),
  node("venue1", 775, 160, { Icon: Database, size: 50, tone: "green" }),
  node("venue2", 822, 330, { Icon: Database, size: 50, tone: "green" }),
  node("t1", 470, 55, { Icon: Bot, size: 50, tone: "red", frame: true }),
  node("t2", 205, 285, { Icon: Bot, size: 46, tone: "red", frame: true }),
  node("t3", 700, 415, { Icon: Bot, size: 48, tone: "red", frame: true }),
  node("tblock", 905, 200, { Icon: Bot, size: 88, tone: "red", label: "MEV Blocked", frame: true }),
];

const GREEN_EDGES: [string, string][] = [
  ["wallet", "core"],
  ["wallet", "nexus"],
  ["wallet", "arbor"],
  ["core", "nexus"],
  ["core", "arbor"],
  ["core", "relay1"],
  ["core", "relay2"],
  ["core", "relay3"],
  ["nexus", "relay1"],
  ["arbor", "relay3"],
  ["relay1", "relay2"],
  ["relay2", "relay3"],
  ["relay1", "venue1"],
  ["relay2", "venue1"],
  ["relay2", "venue2"],
  ["venue1", "venue2"],
];

const RED_EDGES: [string, string][] = [
  ["t1", "core"],
  ["t1", "nexus"],
  ["t2", "wallet"],
  ["t2", "core"],
  ["t3", "venue2"],
  ["t3", "relay2"],
  ["tblock", "venue2"],
  ["tblock", "venue1"],
];

const EDGES: Edge[] = [
  ...GREEN_EDGES.map(([source, target]) => ({
    id: `g-${source}-${target}`,
    source,
    target,
    type: "straight",
    animated: true,
    className: "bq-edge-green",
    style: { stroke: "rgba(74,222,128,0.5)", strokeWidth: 1.3 },
  })),
  ...RED_EDGES.map(([source, target]) => ({
    id: `r-${source}-${target}`,
    source,
    target,
    type: "straight",
    className: "bq-edge-red",
    style: { stroke: "rgba(239,68,68,0.38)", strokeWidth: 1.1, strokeDasharray: "5 6" },
  })),
];

function FitOnResize() {
  const rf = useReactFlow();
  useEffect(() => {
    const fit = () => rf.fitView({ padding: 0.12, duration: 0 });
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [rf]);
  return null;
}

export function NetworkFlow() {
  return (
    <div className="relative h-[360px] w-full overflow-hidden rounded-xl sm:h-[440px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "radial-gradient(60% 55% at 42% 45%, rgba(74,222,128,0.08), transparent 70%)",
        }}
      />
      <ReactFlow
        nodes={NODES}
        edges={EDGES}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.12 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        elementsSelectable={false}
        panOnDrag={false}
        panOnScroll={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        minZoom={0.1}
        maxZoom={2}
      >
        <Background variant={BackgroundVariant.Lines} gap={42} color="rgba(255,255,255,0.035)" />
        <FitOnResize />
      </ReactFlow>
    </div>
  );
}
