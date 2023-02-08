/**
 * Get a value from a map. If it doesn't exist, set + return a default value.
 *
 * Like Python's `dict.setdefault()`
 */
export function setdefault<K, V>(dict: Map<K, V>, key: K, default_: V): V {
  let val = dict.get(key);
  if (val === undefined) {
    val = default_;
    dict.set(key, val);
  }
  return val;
}

export function update<K, V>(
  dict: Map<K, V>,
  key: K,
  fn: (v: V | undefined, k: K, d: Map<K, V>) => V | undefined
): void {
  const val0 = dict.get(key);
  const val1 = fn(val0, key, dict);
  if (val1 === undefined) {
    dict.delete(key);
  } else {
    dict.set(key, val1);
  }
}
