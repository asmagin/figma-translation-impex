import { NETWORKING_REQUEST } from "../constants";
import { processNetworkingRequest } from "./networking";

import { selectMenu } from "figma-plugin-ds";

import "./styles.css";

selectMenu.init();

const getTextArea = (id) => document.getElementById(id) as HTMLTextAreaElement;
const getSelect = (id) => document.getElementById(id) as HTMLSelectElement;
const getButton = (id) => document.getElementById(id) as HTMLButtonElement;

getSelect("source").onchange = (e) => {
  const value = (e.target as any).value;
  const collection = document.getElementsByClassName("source");

  const elements = [];
  for (let i = 0; i < collection.length; i++) {
    elements.push(collection[i]);
  }

  elements.map((el) => {
    el.innerHTML = value;
  });
};

getSelect("target").onchange = (e) => {
  const value = (e.target as any).value;
  const collection = document.getElementsByClassName("target");

  const elements = [];
  for (let i = 0; i < collection.length; i++) {
    elements.push(collection[i]);
  }

  elements.map((el) => {
    el.innerHTML = value;
  });
};

getButton("export").onclick = () => {
  const source = getSelect("source").value || "ja";
  const target = getSelect("target").value || "en";
  parent.postMessage({ pluginMessage: { type: "export-texts", source, target } }, "*");
};

getButton("load-source").onclick = () => {
  const data = JSON.parse(getTextArea("texts-area").value);
  const lang = getSelect("source").value || "ja";
  parent.postMessage({ pluginMessage: { type: "import-texts", data, lang } }, "*");
};

getButton("translate").onclick = () => {
  const data = JSON.parse(getTextArea("texts-area").value || "{}");
  const cacheByElementId = JSON.parse(getTextArea("cache-by-id").value || "{}");
  const cacheBySourceHash = JSON.parse(getTextArea("cache-by-hash").value || "{}");
  const source = getSelect("source").value || "ja";
  const target = getSelect("target").value || "en";
  parent.postMessage({ pluginMessage: { type: "translate", data, source, target, cacheByElementId, cacheBySourceHash } }, "*");
};

getButton("load-target").onclick = () => {
  const data = JSON.parse(getTextArea("texts-area").value);
  const target = getSelect("target").value || "en";
  parent.postMessage({ pluginMessage: { type: "import-texts", data, lang: target } }, "*");
};

getButton("cancel").onclick = () => {
  parent.postMessage({ pluginMessage: { type: "cancel" } }, "*");
};

onmessage = (event) => {
  const msg = event.data.pluginMessage;

  if (msg.type === NETWORKING_REQUEST) {
    console.log("[DEBUG][UI] onmessage", msg.data);
    processNetworkingRequest(msg.data)
  }

  if (msg.type === "export-texts:done") {
    getTextArea("texts-area").value = JSON.stringify(msg.data, null, 2);
  }

  if (msg.type === "translate-texts:done") {
    getTextArea("texts-area").value = JSON.stringify(msg.data, null, 2);
    getTextArea("cache-by-hash").value = JSON.stringify(msg.cacheBySourceHash, null, 2);
    getTextArea("cache-by-id").value = JSON.stringify(msg.cacheByElementId, null, 2);
  }
};
