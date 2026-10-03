const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://api-proxy-157704882598.us-east1.run.app";
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 5;

const companyDataCache = new Map();
const pendingRequests = new Map();

export function readCompanyDataCache(isin) {
  const cached = companyDataCache.get(isin);

  if (!cached) return null;
  if (Date.now() - cached.savedAt >= CACHE_TTL_MS) {
    companyDataCache.delete(isin);
    return null;
  }

  // Refresh insertion order so the least recently viewed company is removed first.
  companyDataCache.delete(isin);
  companyDataCache.set(isin, cached);
  return cached.data;
}

function cacheCompanyData(isin, data) {
  companyDataCache.delete(isin);

  while (companyDataCache.size >= MAX_CACHE_ENTRIES) {
    const oldestIsin = companyDataCache.keys().next().value;
    companyDataCache.delete(oldestIsin);
  }

  companyDataCache.set(isin, { data, savedAt: Date.now() });
}

export async function loadCompanyData(isin) {
  const cached = readCompanyDataCache(isin);
  if (cached) return cached;

  if (pendingRequests.has(isin)) return pendingRequests.get(isin);

  const request = fetch(
    `${API_BASE_URL}/get-data/${encodeURIComponent(isin)}`,
  )
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Company data request failed with ${response.status}`);
      }

      const data = await response.json();
      cacheCompanyData(isin, data);
      return data;
    })
    .finally(() => pendingRequests.delete(isin));

  pendingRequests.set(isin, request);
  return request;
}
