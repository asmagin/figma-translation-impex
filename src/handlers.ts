import { getTableOfAllNodes } from "./functions";
import { runTranslation } from "./translations";

export const exportTexts = (page, source, target) => {
  return page
    .findAll((node) => node.type === "TEXT")
    .reduce((acc, node) => {
      const textNode = node as TextNode;
      const data = {};

      data[target] = "";
      data[source] = textNode.characters;

      acc[textNode.id] = data;
      return acc;
    }, {});
};

export const importTexts = (page, data, target) => {
  if (!data) {
    console.warn("No input data.");
    return false;
  }
  if (!target) {
    console.warn("Target language should be defined.");
    return false;
  }

  let success = true;
  const texts = getTableOfAllNodes(page);

  Object.keys(data).map((key) => {
    const text = texts[key];
    const newTextValue = data[key][target];

    if (text && newTextValue && text.characters !== newTextValue) {
      try {
        text.characters = newTextValue;
        console.info(`Element (${key}): Set to (${newTextValue})`);
      } catch (e) {
        console.warn(`Element (${key}): Failed to set value (${newTextValue})`, e);
        success = false;
      }
    } else {
      console.info(`Element (${key}): No change required`);
    }
  });

  return success;
};

export const tanslateTexts = (pageId, resources, sourceLanguage, targetLanguage, translatedBySourceHash, translatedByElementId) => {
  console.log("tanslateTexts", pageId, resources, sourceLanguage, targetLanguage, translatedBySourceHash, translatedByElementId)
  
  const res = runTranslation(pageId, resources, sourceLanguage, targetLanguage, translatedBySourceHash, translatedByElementId);
  return res;
};

export default { importTexts, exportTexts, tanslateTexts };
