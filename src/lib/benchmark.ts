// Peer benchmark — "you spend more than X% of people." Until there's a real
// anonymised aggregate from a user base, this uses a REFERENCE MODEL of typical
// Indian monthly subscription spend (clearly labelled in the UI as such). Swap
// `SUBSCRIPTION_CURVE` for a live percentile query once you have scale.

// (monthly ₹, cumulative percentile of people at-or-below this spend)
const SUBSCRIPTION_CURVE: [number, number][] = [
  [0, 2],
  [149, 18],
  [299, 32],
  [499, 45],
  [799, 58],
  [1200, 70],
  [2000, 80],
  [3000, 87],
  [4500, 93],
  [7000, 97],
  [12000, 99],
];

const STREAMING_CURVE: [number, number][] = [
  [0, 5],
  [149, 30],
  [299, 48],
  [499, 64],
  [799, 78],
  [1200, 88],
  [2000, 95],
  [4000, 99],
];

function percentile(curve: [number, number][], amount: number): number {
  if (amount <= curve[0][0]) return curve[0][1];
  for (let i = 1; i < curve.length; i++) {
    const [x1, p1] = curve[i - 1];
    const [x2, p2] = curve[i];
    if (amount <= x2) {
      const t = (amount - x1) / (x2 - x1);
      return Math.round(p1 + t * (p2 - p1));
    }
  }
  return curve[curve.length - 1][1];
}

export function subscriptionPercentile(monthly: number): number {
  return Math.min(99, percentile(SUBSCRIPTION_CURVE, monthly));
}

export function streamingPercentile(monthly: number): number {
  return Math.min(99, percentile(STREAMING_CURVE, monthly));
}
