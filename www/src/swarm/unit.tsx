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

export default function View(props: {
  ctx: UseStateT<S.Session.Ctx>;
}): JSX.Element {
  const [sctx, setCtx] = props.ctx;
  const params = useParams();
  if (!params.unitId) throw new Error("no unitid");
  const unitId = S.Schema.UnitID.wrap(params.unitId);
  const unit = sctx.data.unit.byId.get(unitId);
  if (!unit) throw new Error(`no unit with unitId=${unitId}`);
  const ctx: S.Session.Unit.Ctx = { ...sctx, unitId };
  return (
    <h1>
      <Link to={Route.Route.swarm}>swarm</Link> &gt; {`${ctx.unitId}`}
    </h1>
  );
}
