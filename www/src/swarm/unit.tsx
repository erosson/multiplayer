import React from "react";
import { Link, useParams } from "react-router-dom";
import * as S from "shared/src/swarm";
import * as Route from "../route";
import { UseReducerT } from "../util";

export default function View(props: {
  ctx: UseReducerT<S.Session.Ctx, S.Session.T.Action>;
}): JSX.Element {
  const [sctx, dispatch] = props.ctx;
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
