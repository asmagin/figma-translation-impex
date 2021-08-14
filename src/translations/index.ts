import { translate } from "./google-translate-api";
import md5 from "md5";

// process.env.GOOGLE_APPLICATION_CREDENTIALS = "./token.json";

const getHash = (s) => {
  return md5(s.replace(/^\s*(.*)\s*$/g, "$1"));
};

const hashTableToBatches = (input, size = 100) => {
  return Object.keys(input).reduce((resultArray, key, index) => {
    const chunkIndex = Math.floor(index / size);

    if (!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = {}; // start a new chunk
    }

    resultArray[chunkIndex][key] = input[key];

    return resultArray;
  }, []);
};

const translateUnits = async (units, source, target) => {

  console.log("translateUnits", units, source, target);
  // Translates the text into the target language. "text" can be a string for
  // translating a single piece of text, or an array of strings for translating
  // multiple texts.
  try {
    const results = {};

    Object.keys(units).map(async (key) => {
      try {
        const unit = units[key];

        const res =  (await translate(unit[source], { from: source, to: target })) as any;
        console.log("translateUnits", res);
        // set translation
        unit[source] = res.text;

        // source mismatch
        if (res.from.language.iso != source) {
          console.log(`Source language mismatch detected ([${res.from.language.iso}] instead of [${source}]): ${unit.source}`);
        }
      } catch (e) {
        console.log(e);
      }
    });

    Object.keys(units).map((key) => {
      const unit = units[key];
      const hashKey = getHash(unit[source]);

      console.log(`    [${hashKey}] (${source}) ${unit[source]} => (${target}) ${unit[target]}`);

      results[hashKey] = {
        direction: `(${source}) => (${target})`,
        ...unit,
      };
    });

    Object.keys(units).map((key) => {
      const unit = units[key];
      const hashKey = getHash(unit[target]);

      console.log(`    [${hashKey}] (${target}) ${unit[target]} => (${source}) ${unit[source]}`);

      results[hashKey] = {
        direction: `(${target}) => (${source})`,
        source: unit[target],
        target: unit[source],
      };
    });

    return results;
  } catch (e) {
    console.log("    ERROR", e);
    return {};
  }
};

export const runTranslation = async (pageId, resources, sourceLanguage, targetLanguage, translatedBySourceHash, translatedByElementId) => {
  const container = {
    sourceLanguage,
    id: pageId,
    targetLanguage,
    resources,
  };

  console.log("runTranslation", pageId, resources, sourceLanguage, targetLanguage, translatedBySourceHash, translatedByElementId)

  const cacheBySourceHash = translatedBySourceHash || {};
  const cacheByElementId = translatedByElementId || {};
  const toTranslateByHash = {};

  Object.keys(container.resources).map((unitKey) => {
    const res = container.resources[unitKey];
    const source = res[sourceLanguage];
    const target = res[targetLanguage];
    const sourceHash = getHash(source);
    const compositeId = `${pageId}::${unitKey}`;

    // save element with missing translations
    if (!target && !!source && !cacheBySourceHash[sourceHash]) {
      toTranslateByHash[sourceHash] = {
        ...res,
      };
    }

    // save original source value for the element ID
    if (!cacheByElementId[compositeId]) {
      cacheByElementId[compositeId] = {};
    }

    cacheByElementId[compositeId][sourceLanguage] = source;
  });

  console.log("runTranslation :: toTranslateByHash", toTranslateByHash);
  console.log("runTranslation :: cacheByElementId", cacheByElementId);

  const batches = hashTableToBatches(toTranslateByHash);

  console.log("runTranslation :: batches", batches);

  let translatedUnits = cacheBySourceHash;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const translatedBatch = await translateUnits(batch, sourceLanguage, targetLanguage);
    translatedUnits = { ...translatedUnits, ...translatedBatch };
  }

  console.log("runTranslation :: translatedUnits", translatedUnits);


  Object.keys(container.resources).map((unitKey) => {
    const res = container.resources[unitKey];
    const source = res[sourceLanguage];
    const target = res[targetLanguage];
    const sourceHash = getHash(source);
    const compositeId = `${pageId}::${unitKey}`;

    if (!!cacheByElementId[compositeId][res[targetLanguage]]) {
      // get translation from elementsID cache
      res[targetLanguage] = cacheByElementId[compositeId][res[targetLanguage]];
    } else if (!!translatedUnits[sourceHash]) {
      // get translation from hash cache
      res[targetLanguage] = translatedUnits[sourceHash].target;
      cacheByElementId[compositeId][targetLanguage] = translatedUnits[sourceHash].target;
    }
  });

  console.log("12312")

  return {
    data: container.resources,
    cacheByElementId,
    cacheBySourceHash: translatedUnits,
  };
};
