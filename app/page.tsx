"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import {
  BoltIcon,
  ChatBubbleBottomCenterTextIcon,
  FireIcon,
  PaperAirplaneIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

type Author = "user" | "agent" | "system";

interface Message {
  id: string;
  author: Author;
  content: string;
  hint?: string;
  createdAt: string;
}

interface ModeState {
  analysis: boolean;
  planning: boolean;
  summary: boolean;
}

const createId = () => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);

const initialMessages: Message[] = [
  {
    id: createId(),
    author: "agent",
    content:
      "Hey there! I'm Atlas, your autonomous problem-solving agent. Drop a challenge below and I'll break it down, plan my moves, and deliver focused execution steps.",
    hint: "Ready when you are",
    createdAt: new Date().toISOString(),
  },
];

const capabilityHighlights = [
  {
    label: "Strategize",
    description: "Craft actionable roadmaps for fuzzy goals",
    icon: SparklesIcon,
  },
  {
    label: "Execute",
    description: "Split work into resilient micro-missions",
    icon: BoltIcon,
  },
  {
    label: "Review",
    description: "Summarize progress and surface next best moves",
    icon: FireIcon,
  },
];

const quickPrompts = [
  "Design a launch plan for a new productivity SaaS",
  "Break down a research workflow for market validation",
  "Draft a content calendar targeting AI engineers",
  "Map the first sprint for a web-based AI companion",
];

const taglines = [
  "Agentic reasoning with measurable outcomes.",
  "Human goals, machine execution, tight loops.",
  "From insight to action without babysitting.",
];

const heuristics = [
  {
    keywords: ["plan", "roadmap", "milestone", "strategy"],
    narrative:
      "You need a structured path. I'll break the objective into phases with crisp deliverables and checkpoints.",
    steps: [
      "Clarify success metrics and guardrails",
      "Sequence milestones with resource sizing",
      "Highlight dependencies and risk mitigations",
    ],
  },
  {
    keywords: ["content", "write", "copy", "post"],
    narrative:
      "Let's align voice, audience, and distribution to keep every piece on-message and high leverage.",
    steps: [
      "Confirm target persona pains and desired outcomes",
      "Outline a reusable pillar/cluster structure",
      "Draft samples with tone, CTA, and repurposing notes",
    ],
  },
  {
    keywords: ["research", "analyze", "compare", "study"],
    narrative:
      "I'll synthesize signals, highlight patterns, and surface what deserves deeper digging.",
    steps: [
      "Frame hypotheses and evidence you already have",
      "Collect primary/secondary sources with confidence tiers",
      "Extract insights, contradictions, and suggested experiments",
    ],
  },
  {
    keywords: ["code", "build", "architecture", "feature"],
    narrative:
      "I'll transform requirements into architecture, interfaces, and delivery sequencing.",
    steps: [
      "Capture user flows and data contracts",
      "Design modular components with integration notes",
      "Plan implementation slices with testing anchors",
    ],
  },
];

const defaultResponse = {
  narrative:
    "I'll evaluate the request, stabilize assumptions, and recommend a pragmatic action plan.",
  steps: [
    "Clarify the core objective and constraints",
    "Identify the most leverage-first deliverables",
    "Provide a tight feedback loop for the next iteration",
  ],
};

function formatAgentMessage(
  input: string,
  mode: ModeState,
  narrative: string,
  steps: string[],
  messageHistory: Message[],
): string {
  const reflections = messageHistory
    .filter((msg) => msg.author === "user")
    .slice(-2)
    .map((msg) => `• ${msg.content.trim()}`)
    .join("\n");

  const segments: string[] = [];

  if (mode.analysis) {
    const analysisLines = [
      "**Analysis**",
      narrative,
      reflections ? "Recent signals:" : null,
      reflections ? reflections : null,
    ].filter(Boolean);
    segments.push(analysisLines.join("\n"));
  }

  if (mode.planning) {
    const planLines = [
      "**Plan**",
      ...steps.map((step, index) => `${index + 1}. ${step}`),
    ];
    segments.push(planLines.join("\n"));
  }

  if (mode.summary) {
    segments.push(
      [
        "**Next Move**",
        `I'll start by focusing on: ${summarizePrimaryTask(input, steps)}`,
      ].join("\n"),
    );
  }

  return segments.join("\n\n");
}

function summarizePrimaryTask(prompt: string, steps: string[]): string {
  const concise = prompt.replace(/\s+/g, " ").trim();
  if (!concise) {
    return steps[0] ?? "Establishing context";
  }

  if (concise.length < 120) {
    return concise;
  }

  return steps[0] ?? "Defining the objective";
}

function pickNarrative(prompt: string) {
  const normalized = prompt.toLowerCase();
  const match = heuristics.find((candidate) =>
    candidate.keywords.some((keyword) => normalized.includes(keyword)),
  );
  return match ?? defaultResponse;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<ModeState>({
    analysis: true,
    planning: true,
    summary: true,
  });
  const [isThinking, setIsThinking] = useState(false);
  const scrollAnchor = useRef<HTMLDivElement | null>(null);

  const rotatingTagline = useMemo(() => {
    const index = messages.length % taglines.length;
    return taglines[index];
  }, [messages.length]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    queueUserMessage();
  };

  const queueUserMessage = () => {
    const trimmed = input.trim();
    if (!trimmed || isThinking) return;

    const userMessage: Message = {
      id: createId(),
      author: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsThinking(true);

    const { narrative, steps } = pickNarrative(trimmed);
    const agentContent = formatAgentMessage(
      trimmed,
      mode,
      narrative,
      steps,
      [...messages, userMessage],
    );

    const agentMessage: Message = {
      id: createId(),
      author: "agent",
      content: agentContent,
      hint: "Calibrated plan ready",
      createdAt: new Date().toISOString(),
    };

    setTimeout(() => {
      setMessages((prev) => [...prev, agentMessage]);
      setIsThinking(false);
      scrollAnchor.current?.scrollIntoView({ behavior: "smooth" });
    }, 550 + Math.random() * 400);
  };

  const toggleMode = (key: keyof ModeState) => {
    setMode((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const acceptQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-zinc-950 via-black to-zinc-900 text-zinc-100">
      <header className="border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">Atlas Agent</p>
            <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
              Operate at agentic velocity
            </h1>
            <p className="mt-2 max-w-xl text-sm text-zinc-400 sm:text-base">
              {rotatingTagline}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-300">
            {capabilityHighlights.map((capability) => (
              <div
                key={capability.label}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm"
              >
                <capability.icon className="h-4 w-4 text-emerald-400" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-300">
                    {capability.label}
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    {capability.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10 lg:flex-row">
        <section className="flex w-full flex-col gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-xl shadow-emerald-500/10 sm:p-8 lg:max-w-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">
              <ChatBubbleBottomCenterTextIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Control Panel</h2>
              <p className="text-xs text-zinc-400">
                Tune how Atlas reasons before execution.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {(
              [
                { key: "analysis", title: "Deep analysis", description: "Surface assumptions, risks, and context you may miss." },
                { key: "planning", title: "Structured planning", description: "Produce sequenced actions with dependencies and rationale." },
                { key: "summary", title: "Next move", description: "Lock the very next step so momentum never stalls." },
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => toggleMode(item.key)}
                className={`flex w-full flex-col rounded-2xl border px-4 py-3 text-left transition ${
                  mode[item.key]
                    ? "border-emerald-400/80 bg-emerald-400/10"
                    : "border-white/10 bg-black/30 hover:border-emerald-300/40 hover:bg-emerald-400/5"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                      mode[item.key]
                        ? "bg-emerald-400 text-emerald-950"
                        : "bg-zinc-800 text-zinc-200"
                    }`}
                  >
                    {mode[item.key] ? "ON" : "OFF"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-zinc-400">{item.description}</p>
              </button>
            ))}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Jump start ideas</h3>
            <div className="mt-3 space-y-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => acceptQuickPrompt(prompt)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-xs text-zinc-300 transition hover:border-emerald-400/60 hover:bg-emerald-400/10 hover:text-emerald-100"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="flex min-h-[480px] flex-1 flex-col justify-between gap-6 rounded-3xl border border-white/10 bg-zinc-950/60 p-4 shadow-2xl shadow-emerald-500/10 sm:p-6">
          <div className="flex-1 space-y-6 overflow-y-auto pr-1">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`flex items-start gap-4 rounded-3xl border border-white/5 bg-white/[0.03] p-5 text-sm shadow-md shadow-black/40 ${
                  message.author === "user" ? "border-emerald-400/40 bg-emerald-400/10" : ""
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                    message.author === "user"
                      ? "bg-emerald-400 text-emerald-950"
                      : "bg-zinc-800 text-zinc-200"
                  }`}
                >
                  {message.author === "user" ? "You" : "AI"}
                </div>
                <div className="flex-1 space-y-3">
                  <p className="whitespace-pre-line text-sm leading-6 text-zinc-200">
                    {message.content}
                  </p>
                  {message.hint ? (
                    <p className="text-[11px] uppercase tracking-widest text-emerald-300">
                      {message.hint}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}

            {isThinking ? (
              <div className="flex items-center gap-3 rounded-3xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-xs text-emerald-200">
                <SparklesIcon className="h-4 w-4 animate-spin" />
                Atlas is synthesizing your next steps...
              </div>
            ) : null}

            <div ref={scrollAnchor} />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-zinc-500">
              <span>Agent Loop Ready</span>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-black/60 px-4 py-3">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Describe what you want Atlas to achieve..."
                className="h-24 flex-1 resize-none bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    queueUserMessage();
                  }
                }}
              />
              <button
                type="submit"
                className="inline-flex h-12 w-12 flex-none items-center justify-center rounded-full bg-emerald-400 text-emerald-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-emerald-400/40 disabled:text-emerald-900/70"
                disabled={!input.trim() || isThinking}
                aria-label="Send message"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
