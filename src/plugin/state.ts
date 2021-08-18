import { CACHE_BY_ELEMENT_ID, CACHE_BY_TEXT_HASH } from "../constants";

export const saveCacheByElementID = (page, data) => {
  if (page && data) {
    console.log("[DEBUG] Save Cache Data", data);
    page.setPluginData(CACHE_BY_ELEMENT_ID, JSON.stringify(data));
  }
};

export const loadCacheByElementID = (page) => {
  if (page) {
    try {
      const data = JSON.parse(page.getPluginData(CACHE_BY_ELEMENT_ID));
      console.log("[DEBUG] Load Cache Data", data);
      return data;
    } catch (error) {
      console.log("[DEBUG] Failed to load Cache Data:", error);
      return {};
    }
  }
};

// Saved in the root of the document
export const saveCacheByTextHash = (page, data) => {
  if (page && data) {
    console.log("[DEBUG] Save Cache Data", data);
    const topNode = page.parent || page;
    topNode.setPluginData(CACHE_BY_TEXT_HASH, JSON.stringify(data));
  }
};

export const loadCacheByTextHash = (page) => {
  if (page) {
    try {
      const topNode = page.parent || page;
      const data = JSON.parse(topNode.getPluginData(CACHE_BY_TEXT_HASH));
      console.log("[DEBUG] Load Cache Data", data);
      return data;
    } catch (error) {
      console.log("[DEBUG] Failed to load Cache Data:", error);
      return {};
    }
  }
};
