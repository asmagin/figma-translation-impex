import { exportTexts, importTexts, tanslateTexts } from "./handlers";
import { init } from "./functions";
init().then(() => {
  figma.showUI(__html__);

  figma.ui.resize(640, 640);

  // Calls to "parent.postMessage" from within the HTML page will trigger this
  // callback. The callback will be passed the "pluginMessage" property of the
  // posted message.
  figma.ui.onmessage = async (msg) => {
    // One way of distinguishing between different types of messages sent from
    // your HTML page is to use an object with a "type" property like this.
    if (msg.type === "export-texts") {
      const data = exportTexts(figma.currentPage, msg.source, msg.target);
      figma.ui.postMessage({ type: "export-texts:done", data });
    }

    if (msg.type === "import-texts") {
      const res = importTexts(figma.currentPage, msg.data, msg.lang);
      figma.ui.postMessage({ type: `import-texts:${res ? "done" : "error"}` });
    }

    if (msg.type === "translate") {
      console.log("translate", msg)
      const res = tanslateTexts(figma.currentPage.id, msg.data, msg.source, msg.target, msg.cacheBySourceHash, msg.cacheByElementId);
      figma.ui.postMessage({ type: `translate-texts:${res ? "done" : "error"}`, ...res });
    }

    if (msg.type === "cancel") {
      // Make sure to close the plugin when you're done. Otherwise the plugin will
      // keep running, which shows the cancel button at the bottom of the screen.
      figma.closePlugin();
    }
  };
});
