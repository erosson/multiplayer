import "shared";

console.log("Hello World!");

// TODO productionify this. it works on gitpod
const wsUrl = `wss://${document.location.hostname.replace(/^8080-/, '3000-')}`
const ws = new WebSocket(wsUrl);
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
