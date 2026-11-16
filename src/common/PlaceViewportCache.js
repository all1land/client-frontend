/**
 * Viewport-aware place-list controller for GET /api/places/list.
 * Keeps visible entries in their existing order and retains a few recently
 * offscreen entries briefly. Does not require changes to the Spring API.
 */

export function expandBounds(bounds, scale = 1.5) {
  validateBounds(bounds);
  if (!Number.isFinite(scale) || scale < 1) throw new Error('scale must be >= 1');
  const centerLat = (bounds.minLat + bounds.maxLat) / 2;
  const centerLon = (bounds.minLon + bounds.maxLon) / 2;
  const halfLat = (bounds.maxLat - bounds.minLat) * scale / 2;
  const halfLon = (bounds.maxLon - bounds.minLon) * scale / 2;
  return {
    minLat: Math.max(-90, centerLat - halfLat),
    minLon: Math.max(-180, centerLon - halfLon),
    maxLat: Math.min(90, centerLat + halfLat),
    maxLon: Math.min(180, centerLon + halfLon),
  };
}

export function withinBounds(point, bounds) {
  const lat = Number(point?.latitude ?? point?.lat);
  const lon = Number(point?.longitude ?? point?.lng);
  return Number.isFinite(lat) && Number.isFinite(lon) &&
    lat >= bounds.minLat && lat <= bounds.maxLat &&
    lon >= bounds.minLon && lon <= bounds.maxLon;
}

function containsBounds(outer, inner) {
  return outer && outer.minLat <= inner.minLat && outer.minLon <= inner.minLon &&
    outer.maxLat >= inner.maxLat && outer.maxLon >= inner.maxLon;
}

function validateBounds(bounds) {
  const { minLat, minLon, maxLat, maxLon } = bounds ?? {};
  if (![minLat, minLon, maxLat, maxLon].every(Number.isFinite) ||
      minLat < -90 || maxLat > 90 || minLon < -180 || maxLon > 180 ||
      minLat >= maxLat || minLon >= maxLon) {
    throw new Error('Invalid viewport bounds (WGS84)');
  }
}

/**
 * @param {object} options
 * @param {(params: object) => Promise<object[]>} options.fetchPage
 *   Each callback must return ONE page as an array of PlaceResDTOs.
 * @param {(places: object[], meta: object) => void} options.onChange
 */
export function createPlaceViewportCache({
  fetchPage,
  onChange = () => {},
  debounceMs = 300,
  cacheScale = 1.5,
  cacheTtlMs = 60_000,
  offscreenTtlMs = 15_000,
  maxVisible = 20,
  maxOffscreen = 5,
  pageSize = 20,
  maxPages = 5,
  maxCacheEntries = 600,
  now = () => Date.now(),
} = {}) {
  if (typeof fetchPage !== 'function') throw new Error('fetchPage callback required');
  if (typeof onChange !== 'function') throw new Error('onChange callback required');
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 20) throw new Error('pageSize must be 1..20');
  if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 200) throw new Error('maxPages must be 1..200');
  if (![debounceMs, cacheTtlMs, offscreenTtlMs].every(v => Number.isFinite(v) && v >= 0)) throw new Error('Invalid time option');
  if (![maxVisible, maxOffscreen, maxCacheEntries].every(v => Number.isInteger(v) && v >= 0)) throw new Error('Invalid size option');
  if (maxVisible === 0 || maxCacheEntries === 0) throw new Error('Maximum sizes must be positive');
  if (maxOffscreen > maxVisible) throw new Error('maxOffscreen must be <= maxVisible');

  let destroyed = false;
  let viewport = null;
  let keyword = '';
  let zoom = null;
  let displayed = [];
  let cache = new Map();
  let coveredBounds = null;
  let lastFetchAt = -Infinity;
  let truncated = false;
  let generation = 0;
  let debounceTimer = null;
  let expiryTimer = null;
  let loading = false;
  let error = null;
  let activeFetch = null;

  const normalizeKeyword = value => String(value ?? '').trim();
  const placeId = place => String(place?.poiId ?? place?.id ?? '');
  const snapshot = () => displayed.map(({ place }) => place);
  const emit = () => {
    if (!destroyed) onChange(snapshot(), { loading, error, truncated, cachedCount: cache.size });
  };
  const clearTimers = () => {
    clearTimeout(debounceTimer);
    clearTimeout(expiryTimer);
    debounceTimer = null;
    expiryTimer = null;
  };

  function scheduleExpiry() {
    clearTimeout(expiryTimer);
    if (destroyed || !viewport) return;
    const due = displayed
      .filter(e => e.offscreenSince !== null)
      .map(e => e.offscreenSince + offscreenTtlMs);
    if (!due.length) return;
    expiryTimer = setTimeout(() => {
      reconcile();
      emit();
    }, Math.max(0, Math.min(...due) - now() + 1));
  }

  function reconcile() {
    if (!viewport) return;
    const currentTime = now();
    const next = [];
    const ids = new Set();
    let offscreenCount = 0;

    for (const entry of displayed) {
      const id = placeId(entry.place);
      const newest = cache.get(id) ?? entry.place;
      if (!id || ids.has(id) || !withinBounds(newest, viewport)) continue;
      next.push({ place: newest, offscreenSince: null });
      ids.add(id);
      if (next.length >= maxVisible) break;
    }

    for (const entry of displayed) {
      if (offscreenCount >= maxOffscreen || next.length >= maxVisible) break;
      const id = placeId(entry.place);
      const newest = cache.get(id) ?? entry.place;
      if (!id || ids.has(id) || withinBounds(newest, viewport)) continue;
      const since = entry.offscreenSince ?? currentTime;
      if (currentTime - since >= offscreenTtlMs) continue;
      next.push({ place: newest, offscreenSince: since });
      ids.add(id);
      offscreenCount++;
    }

    for (const place of cache.values()) {
      if (next.length >= maxVisible) break;
      const id = placeId(place);
      if (!id || ids.has(id) || !withinBounds(place, viewport)) continue;
      next.push({ place, offscreenSince: null });
      ids.add(id);
    }
    displayed = next;
    scheduleExpiry();
  }

  async function fetchRegion(bounds, fetchGeneration) {
    const queryBounds = expandBounds(bounds, cacheScale);
    const centerLat = (bounds.minLat + bounds.maxLat) / 2;
    const centerLon = (bounds.minLon + bounds.maxLon) / 2;
    const loaded = new Map();
    let hitLimit = false;
    for (let pageIndex = 1; pageIndex <= maxPages; pageIndex++) {
      const batch = await fetchPage({
        ...queryBounds, centerLat, centerLon, zoom,
        keyword, pageIndex, pageSize,
      });
      if (destroyed || fetchGeneration !== generation) return;
      if (!Array.isArray(batch)) throw new Error('fetchPage must return an array of places');
      for (const place of batch) {
        const id = placeId(place);
        if (id && withinBounds(place, queryBounds)) loaded.set(id, place);
      }
      if (batch.length < pageSize) break;
      if (pageIndex === maxPages) hitLimit = true;
    }
    if (destroyed || fetchGeneration !== generation) return;
    const updated = new Map();
    for (const [id, place] of loaded) updated.set(id, place);
    for (const [id, place] of cache) {
      if (updated.size >= maxCacheEntries) break;
      if (!updated.has(id)) updated.set(id, place);
    }
    cache = new Map([...updated].slice(0, maxCacheEntries));
    coveredBounds = queryBounds;
    lastFetchAt = now();
    truncated = hitLimit || loaded.size > maxCacheEntries;
    reconcile();
  }

  async function refresh() {
    if (destroyed || !viewport) return;
    const withinCached = containsBounds(coveredBounds, viewport);
    if (withinCached && now() - lastFetchAt < cacheTtlMs) {
      reconcile();
      emit();
      return;
    }
    if (activeFetch) {
      await activeFetch;
      if (!destroyed) return refresh();
      return;
    }
    const requestGeneration = generation;
    const target = { ...viewport };
    loading = true;
    error = null;
    emit();
    const job = fetchRegion(target, requestGeneration);
    activeFetch = job;
    try {
      await job;
    } catch (err) {
      if (!destroyed && requestGeneration === generation) error = err;
    } finally {
      if (activeFetch === job) activeFetch = null;
      if (!destroyed && requestGeneration === generation) {
        loading = false;
        reconcile();
        emit();
      }
    }
  }

  function update(bounds, { search = keyword, level = zoom } = {}) {
    if (destroyed) return;
    validateBounds(bounds);
    const nextKeyword = normalizeKeyword(search);
    if (nextKeyword !== keyword) {
      generation++;
      keyword = nextKeyword;
      displayed = [];
      cache = new Map();
      coveredBounds = null;
      lastFetchAt = -Infinity;
      truncated = false;
      activeFetch = null;
      loading = false;
    }
    zoom = level;
    viewport = { ...bounds };
    reconcile();
    emit();
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => { void refresh(); }, debounceMs);
  }

  function invalidate() {
    generation++;
    coveredBounds = null;
    lastFetchAt = -Infinity;
    cache = new Map();
    activeFetch = null;
    loading = false;
    clearTimeout(debounceTimer);
    if (viewport && !destroyed) debounceTimer = setTimeout(() => { void refresh(); }, debounceMs);
  }

  function removePlace(poiId) {
    const id = String(poiId);
    cache.delete(id);
    displayed = displayed.filter(entry => placeId(entry.place) !== id);
    emit();
    invalidate();
  }

  function destroy() {
    destroyed = true;
    generation++;
    clearTimers();
    cache.clear();
    displayed = [];
  }

  return { update, refresh, invalidate, removePlace, destroy, getSnapshot: snapshot };
}
