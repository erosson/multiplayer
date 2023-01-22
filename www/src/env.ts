export interface Env {
  SERVER_URL: string;
  SOCKET_URL: string;
}
export interface InputEnv extends Partial<Env> {
  GITPOD_WORKSPACE_ID?: string;
  GITPOD_WORKSPACE_CLUSTER_HOST?: string;
}
function gen(env: InputEnv): Env {
  let { SERVER_URL, SOCKET_URL } = env;
  if (SERVER_URL == null || SOCKET_URL == null) {
    if (env.GITPOD_WORKSPACE_ID && env.GITPOD_WORKSPACE_CLUSTER_HOST) {
      const hostname = `3000-${env.GITPOD_WORKSPACE_ID}.${env.GITPOD_WORKSPACE_CLUSTER_HOST}`;
      SERVER_URL = SERVER_URL ?? `https://${hostname}`;
      SOCKET_URL = SOCKET_URL ?? `wss://${hostname}`;
    } else {
      const hostname = "localhost:3000";
      SERVER_URL = SERVER_URL ?? `http://${hostname}`;
      SOCKET_URL = SOCKET_URL ?? `ws://${hostname}`;
    }
  }
  return { SERVER_URL, SOCKET_URL };
}

// There are multiple ways we can load our env:
// * In production, `/env/www-env.json` is mounted, and we fetch it
// * In dev, webpack's DefinePlugin replaces `process.env.<whatever>`, and we generate config from that:
//   * if config is directly in the env, use it
//   * if we're in gitpod, generate config from that
//   * if nothing's defined, try to use localhost/default urls
export async function get(): Promise<Env> {
  try {
    const res = await fetch("/env/www-env.json");
    if (res.status === 200) {
      const env = await res.json();
      console.log("fetched env from file", env);
      // TODO parse this
      return env;
    }
    // else, fall through to generated env
  } catch (e) {
    // fall through to generated env
  }
  const inputEnv: InputEnv = {
    // must explicitly list each process.env value here, so webpack DefinePlugin can replace them
    SERVER_URL: process.env.SERVER_URL,
    SOCKET_URL: process.env.SOCKET_URL,
    GITPOD_WORKSPACE_ID: process.env.GITPOD_WORKSPACE_ID,
    GITPOD_WORKSPACE_CLUSTER_HOST: process.env.GITPOD_WORKSPACE_CLUSTER_HOST,
  };
  const env = gen(inputEnv);
  console.log("generated env from input", { inputEnv, env });
  return env;
}
