import { NETWORKING_REQUEST, NETWORKING_RESPONSE } from "../constants";

const requests = [];

const uuidv4 = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const sendRequest = (type, payload, callback) => {
  const id = uuidv4();
  const data = { id, type, ...payload };

  figma.ui.postMessage({
    type: NETWORKING_REQUEST,
    data: { id, type, ...payload },
  });
  requests.push({ ...data, callback });

  console.log("[DEBUG] sendRequest", data);
};

// subscribe to events
export const recieveResponse = async (msg) => {
  const req = requests.find((x) => x.id === msg.data.id);
  if (req) {
    console.log("[DEBUG] recieveResponse", msg.data);
    req.callback(msg.data.payload);
  }
};
