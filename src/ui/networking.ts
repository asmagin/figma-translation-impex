import * as translate from "@asmagin/google-translate-api";
import { MESSAGE_TRANSLATE, NETWORKING_RESPONSE } from "../constants";

export const processNetworkingRequest = async (data) => {
  console.log("[DEBUG][UI] processNetworkingRequest:", data);
  try {
    let res = {};
    switch (data.type) {
      case MESSAGE_TRANSLATE:
        console.log(
          "[DEBUG][UI] processNetworkingRequest MESSAGE_TRANSLATE:",
          data
        );
        res = await translate(data.text, data.config);
        console.log(
          "[DEBUG][UI] processNetworkingRequest MESSAGE_TRANSLATE #2:",
          res
        );
        break;
    }
    parent.postMessage(
      {
        pluginMessage: {
          type: NETWORKING_RESPONSE,
          data: { id: data.id, payload: res },
        },
      },
      "*"
    );
  } catch (error) {
    console.warn("[DEBUG][UI]", error);
  }
};
