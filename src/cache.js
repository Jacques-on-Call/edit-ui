const PREFIX = 'filemeta-';
const TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Retrieves an item from the cache.
 * @param {string} key - The key (file SHA) to retrieve.
 * @returns {object|null} The cached data or null if not found or expired.
 */
export function get(key) {
  const itemStr = localStorage.getItem(`${PREFIX}${key}`);
  if (!itemStr) {
    return null;
  }
  try {
    const item = JSON.parse(itemStr);
    const now = new Date();
    // Check if the item has expired
    if (now.getTime() > item.expiry) {
      localStorage.removeItem(`${PREFIX}${key}`);
      return null;
    }
    return item.value;
  } catch (error) {
    console.error("Error reading from cache", error);
    return null;
  }
}

/**
 * Adds an item to the cache with a TTL.
 * @param {string} key - The key (file SHA) to set.
 * @param {object} value - The metadata to store.
 */
export function set(key, value) {
  const now = new Date();
  const item = {
    value: value,
    expiry: now.getTime() + TTL_MS,
  };
  try {
    localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(item));
  } catch (error) {
    console.error("Error writing to cache", error);
    // Handle potential full localStorage
    // For now, we'll just log the error. A more robust solution could clear old cache.
  }
}

/**
 * Removes an item from the cache.
 * @param {string} key - The key (file SHA) to remove.
 */
export function remove(key) {
  localStorage.removeItem(`${PREFIX}${key}`);
}
