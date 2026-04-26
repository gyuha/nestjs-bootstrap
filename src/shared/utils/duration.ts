export function parseDurationMs(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());

  if (!match) {
    throw new Error(`Unsupported duration: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 };

  return amount * multipliers[unit as keyof typeof multipliers];
}
