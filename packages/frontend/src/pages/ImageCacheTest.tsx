import { useState } from "react";
import { Button } from "@/components/ui/button";

// Test image URLs
// const TEST_IMAGE_URLS = [
//   "https://images.dev.yu-f87ct9a.dev/images/articles/7/b01b358d-9f64-40b3-9b65-f37b21a59c3b.jpg?type=content",
//   "https://images.dev.yu-f87ct9a.dev/images/articles/7/3032f673-008c-4ccb-aa86-151ee9c93b63.jpg?type=content",
//   "https://images.dev.yu-f87ct9a.dev/images/articles/7/3583d964-6565-4cc8-9b34-0ce4a5aac2b5.jpg?type=content",
// ];
const TEST_IMAGE_URLS = [
  "http://localhost:8788/images/articles/7/5ee30c3d-59f7-415b-a4f4-c786c319166a.jpg?type=content",
  "http://localhost:8788/images/articles/7/11d9e20f-5e1d-49ef-8650-bcadcb5f51a8.jpg?type=content",
];

interface TestResult {
  url: string;
  filename: string;
  round: number;
  cacheStatus: string;
  cfCacheStatus: string;
  duration: number;
  contentType: string;
  size: number;
  imageUrl: string;
}

interface Stats {
  total: number;
  hits: number;
  misses: number;
}

export default function ImageCacheTest() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, hits: 0, misses: 0 });
  const [loading, setLoading] = useState(false);

  const addLog = (
    message: string,
    type: "info" | "hit" | "miss" | "error" = "info"
  ) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message} ${type}`;
    setLogs((prev) => [logEntry, ...prev].slice(0, 50));
  };

  const fetchImageWithMetrics = async (
    url: string
  ): Promise<TestResult | null> => {
    const startTime = performance.now();

    // Add cache-busting query parameter to bypass browser cache
    const cacheBuster = `cb=${Date.now()}_${Math.random()}`;
    const urlWithCacheBuster = url.includes("?")
      ? `${url}&${cacheBuster}`
      : `${url}?${cacheBuster}`;

    try {
      const response = await fetch(urlWithCacheBuster, {
        method: "GET",
        cache: "no-store",
        mode: "cors",
        credentials: "omit",
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      const cacheStatus = response.headers.get("X-Cache-Status") || "UNKNOWN";
      const cfCacheStatus = response.headers.get("CF-Cache-Status") || "N/A";
      const contentType = response.headers.get("Content-Type") || "unknown";

      // Update stats
      setStats((prev) => {
        const newStats = { ...prev, total: prev.total + 1 };
        if (cacheStatus === "HIT") {
          newStats.hits = prev.hits + 1;
        } else if (cacheStatus === "MISS") {
          newStats.misses = prev.misses + 1;
        }
        return newStats;
      });

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      const filename = url.split("/").pop()?.split("?")[0] || "unknown";

      return {
        url,
        filename,
        round: 0,
        cacheStatus,
        cfCacheStatus,
        duration,
        contentType,
        size: blob.size,
        imageUrl,
      };
    } catch (error) {
      addLog(`Error fetching ${url}: ${error}`, "error");
      return null;
    }
  };

  const runCacheTest = async () => {
    setLoading(true);
    setResults([]);
    setStats({ total: 0, hits: 0, misses: 0 });
    setLogs([]);

    addLog("Starting cache test...", "info");
    addLog("Browser cache bypassed with cache-busting parameters", "info");

    const allResults: TestResult[] = [];

    // Round 1 - should be MISS
    addLog("Round 1: Initial requests (expecting MISS)", "info");
    for (const url of TEST_IMAGE_URLS) {
      const result = await fetchImageWithMetrics(url);
      if (result) {
        result.round = 1;
        allResults.push(result);
        const shortName = result.filename.substring(0, 13) + "...";
        addLog(
          `${shortName}: ${result.cacheStatus} - ${result.duration.toFixed(
            2
          )}ms | CF: ${result.cfCacheStatus}`,
          result.cacheStatus === "HIT" ? "hit" : "miss"
        );
      }
    }

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Round 2 - should be HIT
    addLog(
      "Round 2: Repeated requests (expecting HIT from Worker/CDN cache)",
      "info"
    );
    for (const url of TEST_IMAGE_URLS) {
      const result = await fetchImageWithMetrics(url);
      if (result) {
        result.round = 2;
        allResults.push(result);
        const shortName = result.filename.substring(0, 13) + "...";
        addLog(
          `${shortName}: ${result.cacheStatus} - ${result.duration.toFixed(
            2
          )}ms | CF: ${result.cfCacheStatus}`,
          result.cacheStatus === "HIT" ? "hit" : "miss"
        );
      }
    }

    setResults(allResults);
    addLog("Cache test completed", "info");
    setLoading(false);
  };

  const hitRate =
    stats.total > 0 ? ((stats.hits / stats.total) * 100).toFixed(1) : "0";

  // Group results by round
  const resultsByRound: { [key: number]: TestResult[] } = {};
  results.forEach((r) => {
    if (!resultsByRound[r.round]) resultsByRound[r.round] = [];
    resultsByRound[r.round].push(r);
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">🖼️ Image Worker Cache Test</h1>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
        <div className="flex gap-4 mb-6">
          <Button onClick={runCacheTest} disabled={loading}>
            {loading ? "Running..." : "Run Cache Test"}
          </Button>
          <Button onClick={() => setLogs([])}>Clear Logs</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded">
            <div className="text-sm text-gray-600">Total Requests</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <div className="text-sm text-gray-600">Cache Hits</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.hits}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <div className="text-sm text-gray-600">Cache Misses</div>
            <div className="text-2xl font-bold text-red-600">
              {stats.misses}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <div className="text-sm text-gray-600">Hit Rate</div>
            <div className="text-2xl font-bold">{hitRate}%</div>
          </div>
        </div>
      </div>

      {/* Test Results */}
      {Object.keys(resultsByRound).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          {Object.entries(resultsByRound).map(([round, items]) => (
            <div key={round} className="mb-6">
              <h3 className="text-lg font-medium mb-3">Round {round}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {items.map((item, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <img
                      src={item.imageUrl}
                      alt={item.filename}
                      className="w-full h-48 object-cover rounded mb-3"
                    />
                    <div className="text-xs space-y-1 font-mono">
                      <div className="font-semibold truncate">
                        {item.filename}
                      </div>
                      <div>
                        Worker Cache:
                        <span
                          className={`ml-2 px-2 py-0.5 rounded text-white font-bold ${
                            item.cacheStatus === "HIT"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        >
                          {item.cacheStatus}
                        </span>
                      </div>
                      <div>CF-Cache: {item.cfCacheStatus}</div>
                      <div>Load Time: {item.duration.toFixed(2)}ms</div>
                      <div>Size: {(item.size / 1024).toFixed(2)} KB</div>
                      <div className="truncate">Type: {item.contentType}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Logs */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Request Log</h2>
        <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500">Waiting for tests...</div>
          ) : (
            logs.map((log, idx) => (
              <div
                key={idx}
                className={`py-1 ${
                  log.includes("HIT")
                    ? "text-green-400"
                    : log.includes("MISS")
                      ? "text-red-400"
                      : log.includes("Error")
                        ? "text-yellow-400"
                        : "text-gray-300"
                }`}
              >
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
