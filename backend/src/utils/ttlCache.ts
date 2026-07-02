type CacheEntry<T> = {
  expiresAt: number;
  value?: T;
  promise?: Promise<T>;
};

export class TtlCache<T> {
  private store = new Map<string, CacheEntry<T>>();

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  async getOrSet(key: string, ttlMs: number, factory: () => Promise<T>): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) return cached;

    const pending = this.store.get(key)?.promise;
    if (pending) return pending;

    const promise = factory().then((value) => {
      this.set(key, value, ttlMs);
      return value;
    });

    this.store.set(key, {
      promise,
      expiresAt: Date.now() + ttlMs,
    });

    try {
      return await promise;
    } catch (error) {
      this.store.delete(key);
      throw error;
    }
  }

  clear() {
    this.store.clear();
  }
}

