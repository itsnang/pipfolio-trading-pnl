export function calcPnl(direction: 'buy' | 'sell', entry: number, exit: number, lots: number): number {
  return direction === 'buy' ? (exit - entry) * lots * 100 : (entry - exit) * lots * 100
}
