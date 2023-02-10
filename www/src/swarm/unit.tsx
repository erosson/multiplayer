import React from "react";
import {
  useParams,
  LoaderFunctionArgs,
  useLoaderData,
  Link,
} from "react-router-dom";
import * as S from "shared/src/swarm";
import * as Route from "../route";
import { UseStateT } from "../util";

export function createLoader(sctx: S.Session.Ctx) {
  return ({ params }: LoaderFunctionArgs) => {
    if (!params.unitId) throw new Error("no unitid");
    const unitId = S.Schema.UnitID.wrap(params.unitId);
    const unit = sctx.data.unit.byId.get(unitId);
    if (!unit) throw new Error(`no unit with unitId=${unitId}`);
    const ctx: S.Session.Unit.Ctx = { ...sctx, unitId };
    return { unitId, unit, ctx };
  };
}
type LoaderData = ReturnType<ReturnType<typeof createLoader>>;

export default function View(props: {
  ctx: UseStateT<S.Session.Ctx>;
}): JSX.Element {
  const [sctx, setCtx] = props.ctx;
  const { ctx } = useLoaderData() as LoaderData;
  return (
    <h1>
      <Link to={Route.Route.swarm}>swarm</Link> &gt; {`${ctx.unitId}`}
    </h1>
  );
}
