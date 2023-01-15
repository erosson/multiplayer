import "shared";

console.log("Hello World!");

async function main() {
  // TODO productionify this. it works on gitpod
  const hostname = document.location.hostname.replace(/^8080-/, "3000-");
  const authUrl = `https://${hostname}/auth/guest`;
  const wsUrl = `wss://${hostname}/ws`;
  // sets httpOnly session cookie
  const res = await fetch(authUrl, { credentials: "include" });
  console.log(await res.json());

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
}

main();
