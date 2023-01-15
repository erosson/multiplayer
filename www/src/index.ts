import "shared";

console.log("Hello World!");

async function main() {
  // TODO productionify this. it works on gitpod
  const server = process.env["SERVER_URL"];
  console.log(server);
  const authUrl = `${server}/auth/guest`;
  const wsUrl = `${server.replace(/^http/, "ws")}/ws`;
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
