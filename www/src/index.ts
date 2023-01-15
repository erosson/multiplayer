import "shared";

console.log("Hello World!");

const ws = new WebSocket(
  "wss://3000-erosson-multiplayer-pde2ydj4486.ws-us82.gitpod.io"
);
ws.onopen = (ev) => {
  console.log("ws open");
  ws.send("hello from client");
};
ws.onmessage = (ev) => {
  console.log("ws server: ", ev.data);
};
ws.onclose = (ev) => {
  console.error("close", ev);
};
ws.onerror = (ev) => {
  console.error("error", ev);
};
