import { UnsignResult } from "@fastify/cookie";
import { FastifyRequest, FastifyReply } from "fastify";
import { v4 as uuidv4 } from "uuid";

export const SESSION_COOKIE_KEY = "session";
export type Id = string;

export function getSession(req: FastifyRequest): null | UnsignResult {
  const raw = req.cookies[SESSION_COOKIE_KEY];
  if (!raw) return null;
  const res = req.unsignCookie(raw);
  return res.valid ? res : null;
}

export function getSessionId(req: FastifyRequest): null | Id {
  return getSession(req)?.value ?? null;
}

const cookieOpts = {
  path: "/",
  signed: true,
  httpOnly: true,
  secure: true,
};
export function ensure(req: FastifyRequest, res: FastifyReply): void {
  const session = getSession(req);
  if (session) {
    if (session.renew && session.value) {
      res.setCookie(SESSION_COOKIE_KEY, session.value, cookieOpts);
      res.send({ status: "RENEW" });
    } else {
      res.send({ status: "VALID" });
    }
  } else {
    res.setCookie(SESSION_COOKIE_KEY, uuidv4(), cookieOpts);
    res.send({ status: "CREATED" });
  }
}
