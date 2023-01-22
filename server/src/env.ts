import fs from "fs/promises";

export interface Env {
  WWW_URL: string;
  COOKIE_SECRET: string;
}
export interface InputEnv extends Partial<Env> {
  GITPOD_WORKSPACE_ID?: string;
  GITPOD_WORKSPACE_CLUSTER_HOST?: string;
  NODE_ENV: string;
}
function gen(env: InputEnv): Env {
  let { WWW_URL, COOKIE_SECRET } = env;
  if (WWW_URL == null) {
    if (env.GITPOD_WORKSPACE_ID && env.GITPOD_WORKSPACE_CLUSTER_HOST) {
      const hostname = `8080-${env.GITPOD_WORKSPACE_ID}.${env.GITPOD_WORKSPACE_CLUSTER_HOST}`;
      WWW_URL = `https://${hostname}`;
    } else {
      const hostname = "localhost:8080";
      WWW_URL = `http://${hostname}`;
    }
  }

  if (COOKIE_SECRET == null) {
    if (env.NODE_ENV === "production") {
      throw new Error("COOKIE_SECRET required in production");
    }
    COOKIE_SECRET = "test-secret-abc123";
  }
  return { WWW_URL, COOKIE_SECRET };
}

// There are multiple ways we can load our env:
// * In production, `/env/server-env.json` and `/secret/server.secret.json` are both mounted, and we read them
// * In dev, we also expect process.env to have env info, and generate whatever isn't there
export async function get(): Promise<Env> {
  const [nonsecret, secret] = await Promise.all([
    fs.readFile(`${__dirname}/../env/server-env.json`).then(
      (f) => JSON.parse(f.toString()),
      () => ({})
    ),
    fs.readFile(`${__dirname}/../secret/server.secret.json`).then(
      (f) => JSON.parse(f.toString()),
      () => ({})
    ),
  ]);
  const inputEnv = { ...nonsecret, ...secret };
  console.log("inputEnv", { inputEnv });
  const env = gen(inputEnv);
  console.log("env", { env });
  return env;
}
