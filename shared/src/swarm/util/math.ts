export function sum(ns: number[]): number {
  return ns.reduce((a, n) => a + n, 0);
}
export function product(ns: number[]): number {
  return ns.reduce((a, n) => a * n, 1);
}
export function range(a: number, b?: number): number[] {
  const start = b == null ? 0 : a;
  const end = b == null ? a : b;
  return Array.from(Array(end - start).keys()).map((n) => n + start);
}
export function fact(n: number): number {
  return product(range(1, n + 1));
}
