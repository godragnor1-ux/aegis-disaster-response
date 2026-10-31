import React from 'react';

/**
 * Minimal primitive set for the Linear-derived system.
 * Tokens live in globals.css / tailwind.config.js — no hex values here.
 */

export function Panel({
  children,
  className = '',
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={`rounded-lg border border-hairline bg-surface-1 ${padded ? 'p-4 md:p-5' : ''} ${className}`}
    >
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  caption,
  action,
}: {
  title: string;
  caption?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <h2 className="font-display text-[15px] font-medium tracking-tight text-ink">{title}</h2>
        {caption && <p className="mt-0.5 text-[12px] text-ink-subtle">{caption}</p>}
      </div>
      {action}
    </div>
  );
}

type Tone = 'neutral' | 'critical' | 'warning' | 'ok' | 'brand';

const TONE_VAR: Record<Tone, string> = {
  neutral: 'var(--ink-tertiary)',
  critical: 'var(--critical)',
  warning: 'var(--warning)',
  ok: 'var(--ok)',
  brand: 'var(--brand)',
};

export function StatusDot({ tone = 'neutral' }: { tone?: Tone }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ background: TONE_VAR[tone] }}
    />
  );
}

export function StatusLabel({
  tone = 'neutral',
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted">
      <StatusDot tone={tone} />
      {children}
    </span>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: Tone;
}) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3.5">
      <span className="eyebrow">{label}</span>
      <span className="metric-value text-[26px] leading-none" style={{ color: TONE_VAR[tone] }}>
        {value}
      </span>
      {hint && <span className="text-[11px] text-ink-subtle">{hint}</span>}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  icon,
}: {
  title: string;
  body: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-hairline px-4 py-10 text-center">
      {icon && <div className="mb-2 text-ink-subtle">{icon}</div>}
      <p className="text-[13px] font-medium text-ink-muted">{title}</p>
      <p className="mt-1 max-w-sm text-[12px] leading-relaxed text-ink-subtle">{body}</p>
    </div>
  );
}

export function Bar({ value, max, tone = 'brand' }: { value: number; max: number; tone?: Tone }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-surface-3">
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{ width: `${pct}%`, background: TONE_VAR[tone] }}
      />
    </div>
  );
}

export function severityTone(severity?: string): Tone {
  switch (severity) {
    case 'critical':
    case 'high':
      return 'critical';
    case 'medium':
      return 'warning';
    case 'low':
      return 'ok';
    default:
      return 'neutral';
  }
}
