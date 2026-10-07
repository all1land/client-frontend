// src/common/MapHistory.js

export const HISTORY_KEY = {
  SEARCH: 'search-history',
  ROUTE: 'route-history',
};

class MapHistory {
  constructor(key) {
    this.key = key;
  }

  getAll() {
    const data = localStorage.getItem(this.key);

    if (!data) {
      return [];
    }

    try {
      return JSON.parse(data);
    } catch (error) {
      console.error(`[MapHistory] ${this.key} parse error`, error);
      return [];
    }
  }

  get(key) {
    return this.getAll().find((item) => item.key === key) ?? null;
  }

  add(item) {
    const list = this.getAll();

    const newItem = {
      ...item,
      updateTime: item.updateTime ?? Date.now(),
    };

    const index = list.findIndex(
      (historyItem) => historyItem.key === newItem.key
    );

    if (index >= 0) {
      list[index] = newItem;
    } else {
      list.unshift(newItem);
    }

    this.save(list);

    return newItem;
  }

  remove(key) {
    const list = this.getAll().filter(
      (item) => item.key !== key
    );

    this.save(list);
  }

  clear() {
    localStorage.removeItem(this.key);
  }

  save(list) {
    localStorage.setItem(
      this.key,
      JSON.stringify(list)
    );
  }
}

export const searchHistory = new MapHistory(
  HISTORY_KEY.SEARCH
);

export const routeHistory = new MapHistory(
  HISTORY_KEY.ROUTE
);

export default MapHistory;