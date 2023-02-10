import React from "react";
import { Link, useParams } from "react-router-dom";
import * as S from "shared/src/swarm";
import * as Route from "../route";
import { UseReducerT } from "../util";
import { ViewPolynomial, columns, UnitProps, Timer } from ".";

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
    <>
      <h1>
        <Link to={Route.Route.swarm}>swarm</Link> &gt; {`${ctx.unitId}`}
      </h1>
      <table>
        <tbody>
          <Timer {...props} />
        </tbody>
      </table>
      <ViewBody ctx={ctx} dispatch={dispatch} />
    </>
  );
}

interface Props {
  ctx: S.Session.Unit.Ctx;
  dispatch: React.Dispatch<S.Session.T.Action>;
}
function ViewBody(props: Props): JSX.Element {
  const { ctx, dispatch } = props;
  const data = [
    { label: "count0", value: S.Session.Unit.count0(ctx) },
    { label: "count", value: S.Session.Unit.count(ctx) },
    {
      label: "autobuy0",
      value: S.Session.Unit.autobuyOrderOrNull(ctx)?.count ?? "",
    },
    {
      label: "polynomial",
      value: <ViewPolynomial poly={S.Session.Unit.polynomial(ctx)} />,
    },
  ];
  const count0 = S.Session.Unit.count0(ctx);
  const count = S.Session.Unit.count(ctx);
  const unit = S.Session.Unit.schema(ctx);
  const poly = S.Session.Unit.polynomial(ctx);
  const cprops: UnitProps = { ctx, dispatch, count0, count, unit, poly };
  return (
    <div>
      <dl>
        {columns.map((entry) => (
          // <React.Fragment> === <></>
          <React.Fragment key={entry.name}>
            <dt>
              {entry.label ?? (
                <span style={{ textTransform: "capitalize" }}>
                  {entry.name}
                </span>
              )}
            </dt>

            <dd>
              <entry.element {...cprops} />
            </dd>
          </React.Fragment>
        ))}
      </dl>
    </div>
  );
}
