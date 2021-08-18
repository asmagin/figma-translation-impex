export const checkAndLoadMissingFonts = async (texts) => {
  // const fontsToLoad = { "Source Han Sans JP:Regular": { family: "Source Han Sans JP", style: "Regular" } };
  const fontsToLoad = {};

  Object.keys(texts).map((key) => {
    const text = texts[key] as TextNode;
    if (text.hasMissingFont) {
      let len = text.characters.length;
      for (let i = 0; i < len; i++) {
        const fontName = text.getRangeFontName(i, i + 1) as FontName;
        fontsToLoad[`${fontName.family}:${fontName.style}`] = fontName;
      }
    } else {
      const fontName = text.fontName as FontName;

      if (fontName.family) {
        fontsToLoad[`${fontName.family}:${fontName.style}`] = fontName;
      }
    }
  });

  console.info("List of missing fonts:", fontsToLoad);

  await Object.keys(fontsToLoad).map(async (key) => {
    const fontName = fontsToLoad[key];

    try {
      await figma.loadFontAsync(fontName);
      console.log("Font loaded:", fontName);
    } catch (e) {
      console.log("WARN: ", e);
    }
  });
};

export const getTableOfAllNodes = (page) => {
  const texts = page
    .findAll((node) => node.type === "TEXT")
    .reduce((acc, node) => {
      const text = node as TextNode;
      acc[text.id] = text;
      return acc;
    }, {});

  return texts;
};

export const init = async () => {
  // do we need to read all pages
  const texts = getTableOfAllNodes(figma.currentPage);
  await checkAndLoadMissingFonts(texts);
};

export default { init, getTableOfAllNodes, checkAndLoadMissingFonts };
