export class KVCacheHelper {
  constructor(private kv?: KVNamespace) {}

  /**
   * キャッシュを通した汎用的なデータ取得
   * @param cacheKey キャッシュキー
   * @param fetcher キャッシュミス時のデータ取得関数
   * @param ttl TTL（秒）
   * @returns 取得したデータ
   */
  async getOrFetch<T>(
    cacheKey: string,
    fetcher: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    if (!this.kv) {
      console.error(`KV namespace is not available`);
    }

    if (this.kv) {
      try {
        const cached = await this.kv.get(cacheKey, "json");
        if (cached !== null) {
          return cached as T;
        }
      } catch (error) {
        console.warn(`KV cache read error for key ${cacheKey}:`, error);
      }
    }

    const data = await fetcher();

    if (this.kv && data !== null && data !== undefined) {
      this.kv
        .put(cacheKey, JSON.stringify(data), { expirationTtl: ttl })
        .catch((error) =>
          console.warn(`KV cache write error for key ${cacheKey}:`, error)
        );
    }

    return data;
  }

  /**
   * 複数のキャッシュキーを無効化
   * @param keys 削除するキーの配列
   */
  async invalidate(keys: string[]): Promise<void> {
    if (!this.kv || keys.length === 0) return;

    await Promise.all(
      keys.map((key) =>
        this.kv!.delete(key).catch((error) =>
          console.warn(`Failed to invalidate cache ${key}:`, error)
        )
      )
    );
  }

  /**
   * プレフィックスに基づくキャッシュ無効化
   * @param prefix キーのプレフィックス
   */
  async invalidateByPrefix(prefix: string): Promise<void> {
    if (!this.kv) return;

    try {
      const listResult = await this.kv.list({ prefix });
      const keys = listResult.keys.map((key) => key.name);
      console.log();
      await this.invalidate(keys);
    } catch (error) {
      console.warn(`Failed to list keys with prefix ${prefix}:`, error);
    }
  }
}
