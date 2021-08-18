import { MESSAGE_TRANSLATE } from "../constants";
import { sendRequest } from "./networking";
import * as state from "./state";

import md5 from "md5";

// process.env.GOOGLE_APPLICATION_CREDENTIALS = "./token.json";

const getHash = (s) => {
  return md5((s || "").replace(/^\s*(.*)\s*$/g, "$1"));
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

const translate = (text, config) => {
  return new Promise((resolve) => {
    sendRequest(
      MESSAGE_TRANSLATE,
      {
        text,
        config: { sd: "d1aphpd63trzzv.cloudfront", tld: "net", ...config },
      },
      (data) => {
        console.log("[DEBUG] translate", data);
        resolve(data);
      }
    );
  });
};

const translateUnits = async (units, source, target) => {
  console.log("[DEBUG] translateUnits #1", units, source, target);
  // Translates the text into the target language. "text" can be a string for
  // translating a single piece of text, or an array of strings for translating
  // multiple texts.
  try {
    const results = {};

    await Promise.all(
      Object.keys(units).map(async (key) => {
        try {
          const unit = units[key];

          const res: any = await translate(unit[source], {
            from: source,
            to: target,
          });
          console.log("[DEBUG] translateUnits #2", res);
          // set translation
          unit[target] = res.text;

          // source mismatch
          if (res.from.language.iso != source) {
            console.log(
              `[DEBUG] translateUnits #3:`,
              `Source language mismatch detected ([${res.from.language.iso}] instead of [${source}]): ${unit.source}`
            );
          }
        } catch (e) {
          console.log(e);
        }
      })
    );

    Object.keys(units)
      .map((key) => units[key])
      .map((unit) => {
        const sourceHash = getHash(unit[source]);
        const targetHash = getHash(unit[target]);

        console.log(
          `[DEBUG] translateUnits #4: [${sourceHash}] (${source}) ${unit[source]} => (${target}) ${unit[target]}`
        );

        console.log(
          `[DEBUG] translateUnits #5: [${targetHash}] (${target}) ${unit[target]} => (${source}) ${unit[source]}`
        );

        results[sourceHash] = {
          _SOURCE: source,
          ...unit,
        };

        results[targetHash] = {
          _SOURCE: target,
          ...unit,
        };
      });

    return results;
  } catch (e) {
    console.log("[DEBUG] translateUnits: ERROR", e);
    return {};
  }
};

export const runTranslation = async (
  page,
  resources,
  sourceLanguage,
  targetLanguage,
  translatedBySourceHash,
  translatedByElementId
) => {
  const container = {
    sourceLanguage,
    id: page.id,
    targetLanguage,
    resources,
  };

  console.log(
    "[DEBUG] runTranslation",
    page.id,
    resources,
    sourceLanguage,
    targetLanguage,
    translatedBySourceHash,
    translatedByElementId
  );

  const cacheBySourceHash =
    translatedBySourceHash && Object.keys(translatedBySourceHash).length > 0
      ? translatedBySourceHash
      : state.loadCacheByTextHash(page);
  const cacheByElementId =
    translatedByElementId && Object.keys(translatedByElementId).length > 0
      ? translatedByElementId
      : state.loadCacheByElementID(page);
  const toTranslateByHash = {};

  Object.keys(container.resources).map((unitKey) => {
    const res = container.resources[unitKey];
    const source = res[sourceLanguage];
    const target = res[targetLanguage];
    const sourceHash = getHash(source);
    const compositeId = `${page.id}::${unitKey}`;

    const cached = cacheBySourceHash[sourceHash];

    // save element with missing translations
    if (
      !target &&
      !!source &&
      (!cached || (cached && !cached[targetLanguage]))
    ) {
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

  console.log("[DEBUG] runTranslation :: toTranslateByHash", toTranslateByHash);
  console.log("[DEBUG] runTranslation :: cacheByElementId", cacheByElementId);

  const batches = hashTableToBatches(toTranslateByHash);

  console.log("[DEBUG] runTranslation :: batches", batches);

  let translatedUnits = cacheBySourceHash;

  await Promise.all(
    batches.map(async (batch) => {
      const translatedBatch = await translateUnits(
        batch,
        sourceLanguage,
        targetLanguage
      );

      Object.keys(translatedBatch).map((key) => {
        if (translatedUnits[key]) {
          translatedUnits[key] = {
            ...translatedUnits[key],
            ...translatedBatch[key],
          };
        } else {
          translatedUnits[key] = translatedBatch[key];
        }
      });
    })
  );

  console.log("[DEBUG] runTranslation :: translatedUnits", translatedUnits);

  Object.keys(container.resources).map((unitKey) => {
    const res = container.resources[unitKey];
    const source = res[sourceLanguage];
    const sourceHash = getHash(source);
    const compositeId = `${page.id}::${unitKey}`;

    if (!!cacheByElementId[compositeId][res[targetLanguage]]) {
      // get translation from elementsID cache
      res[targetLanguage] = cacheByElementId[compositeId][res[targetLanguage]];
    } else if (!!translatedUnits[sourceHash]) {
      // get translation from hash cache
      res[targetLanguage] = translatedUnits[sourceHash][targetLanguage];
      cacheByElementId[compositeId][targetLanguage] =
        translatedUnits[sourceHash][targetLanguage];
    }
  });

  // save cache
  state.saveCacheByElementID(page, cacheByElementId);
  state.saveCacheByTextHash(page, translatedUnits);

  const data = {
    data: container.resources,
    cacheByElementId,
    cacheBySourceHash: translatedUnits,
  };

  console.log("[DEBUG] runTranslation :: data", data);

  return data;
};
