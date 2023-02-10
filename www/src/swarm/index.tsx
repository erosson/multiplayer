import produce from "immer";
import _ from "lodash";
import React from "react";
import { Link } from "react-router-dom";
import * as S from "shared/src/swarm";
import * as Route from "../route";
import { UseReducerT } from "../util";

const style = {
  input: { width: "5em" },
  readonlyInput: { width: "5em", border: "none" },
  prodList: { padding: 0, margin: 0, listStyleType: "none" },
};
export default function Swarm(props: {
  ctx: UseReducerT<S.Session.Ctx, S.Session.T.Action>;
}): JSX.Element {
  const [ctx, dispatch] = props.ctx;

  return (
    <div>
      <h1>swarm</h1>
      <table>
        <thead>
          <Timer ctx={props.ctx} />
          <tr>
            {columns.map((c) => (
              <ColumnLabel key={c.name} column={c} />
            ))}
          </tr>
        </thead>
        <tbody>
          {S.Session.unitCtxs(ctx).map((ctx, i) => {
            const unit = S.Session.Unit.schema(ctx);
            const count0 = S.Session.Unit.count0(ctx);
            const poly = S.Session.Unit.polynomial(ctx);
            const count = S.Session.Unit.count(ctx);
            const props = {
              ctx,
              dispatch,
              unit,
              count0,
              count,
              poly,
            };
            return <Unit key={`${ctx.unitId}`} {...props} />;
          })}
        </tbody>
      </table>
    </div>
  );
}

interface UnitProps {
  ctx: S.Session.Unit.Ctx;
  dispatch: React.Dispatch<S.Session.T.Action>;
  unit: S.Schema.Unit;
  // redundant/cached
  count: number;
  count0: number;
  poly: number[];
}
function Unit(props: UnitProps): JSX.Element {
  return (
    <tr key={S.Schema.UnitID.unwrap(props.unit.id)}>
      {columns.map((c, i) =>
        i === 0 ? (
          <th key={c.name}>
            <c.element {...props} />
          </th>
        ) : (
          <td key={c.name}>
            <c.element {...props} />
          </td>
        )
      )}
    </tr>
  );
}

interface Column {
  name: string;
  label?: JSX.Element;
  element(props: UnitProps): JSX.Element;
}
const columns: readonly Column[] = [
  {
    name: "name",
    element(props) {
      return (
        <Link to={Route.swarmUnit(props.unit.id)}>{`${props.unit.id}`}</Link>
      );
    },
  },
  {
    name: "count(0)",
    element(props) {
      const { ctx, count0, dispatch } = props;
      return (
        <input
          type="number"
          style={style.input}
          value={count0}
          onInput={(e) => {
            const count = inputInt(e.currentTarget.value ?? "", count0);
            dispatch({
              type: "debug-set-session",
              session: produce(ctx.session, (s) => {
                s.unit.set(ctx.unitId, { id: ctx.unitId, count });
              }),
            });
          }}
        />
      );
    },
  },
  {
    name: "count",
    label: <>Count(t)</>,
    element(props) {
      const { count } = props;
      return (
        <input
          readOnly={true}
          type="number"
          style={style.readonlyInput}
          value={count.toPrecision(3)}
        />
      );
    },
  },
  {
    name: "autobuy",
    element(props) {
      const { ctx, dispatch, unit } = props;
      const order = S.Session.Unit.autobuyOrderOrNull(ctx);
      return (
        <input
          type="number"
          style={style.input}
          value={order?.count ?? ""}
          onInput={(e) => {
            const count = inputInt(
              e.currentTarget.value ?? "",
              order?.count ?? 0
            );
            dispatch({
              type: "debug-set-session",
              session: produce(ctx.session, (s) => {
                if (count === 0) {
                  s.autobuy.delete(unit.id);
                } else {
                  s.autobuy.set(unit.id, { id: unit.id, count });
                }
              }),
            });
          }}
        />
      );
    },
  },
  {
    name: "produces",
    element(props) {
      const { unit } = props;
      return (
        <ul style={style.prodList}>
          {(unit.prod ?? []).map((prod) => (
            <li key={`${unit.id} -> ${prod.unit}`}>
              {`${prod.unit}`} &times;{prod.value}
            </li>
          ))}
        </ul>
      );
    },
  },
  {
    name: "prod rate",
    element(props) {
      return (
        <>
          {S.Session.Unit.velocity(props.ctx).toPrecision(3)}
          /s
        </>
      );
    },
  },
  {
    name: "polynomial",
    element: ViewPolynomial,
  },
  {
    name: "degree",
    element(props) {
      return <>{S.Polynomial.degree(props.poly)}</>;
    },
  },
  {
    name: "cost",
    element(props) {
      const { unit, count0 } = props;
      return (
        <ul style={style.prodList}>
          {(unit.cost ?? []).map((cost) => (
            <li key={`${unit.id} $$ ${cost.unit}`}>
              {`${cost.unit}`} &times;
              {cost.value * (cost.factor ? Math.pow(cost.factor, count0) : 1)}
            </li>
          ))}
        </ul>
      );
    },
  },
  {
    name: "buyable",
    element(props) {
      const b = S.Session.Unit.buyable(props.ctx);
      return b.isBuyable ? (
        <ul style={style.prodList}>
          {b.cost.map((res) => (
            <li key={`${props.ctx.unitId} $$ ${res.cost.unit}`}>
              {res.buyable.toPrecision(3)}
            </li>
          ))}
        </ul>
      ) : (
        <></>
      );
    },
  },
  {
    name: "buy rate",
    element(props) {
      const b = S.Session.Unit.autobuyable(props.ctx);
      return b.isAutobuyable ? (
        <ul style={style.prodList}>
          {b
            ? b.cost.map((res) => (
                <li key={`${props.ctx.unitId} v$$ ${res.cost.unit}`}>
                  {res.velocity.toPrecision(3)}/s
                </li>
              ))
            : []}
        </ul>
      ) : (
        <></>
      );
    },
  },
  {
    name: "buy-button",
    element({ ctx, dispatch }) {
      const b = S.Session.Unit.buyable(ctx);
      if (b.isBuyable) {
        const buttons = _.uniq(
          [b.buyable * 0.04, b.buyable * 0.2, b.buyable].map((v) =>
            Math.max(1, Math.floor(v))
          )
        );
        return (
          <>
            {buttons.map((count, index) => (
              <button
                key={`buy.${ctx.unitId}.${index}`}
                onClick={() => {
                  dispatch({ type: "buy", unitId: ctx.unitId, count });
                }}
              >
                Buy {count}
              </button>
            ))}
          </>
        );
      } else {
        return <></>;
      }
    },
  },
  {
    name: "autobuy-button",
    element({ ctx, dispatch }) {
      const b = S.Session.Unit.autobuyable(ctx);
      if (b.isAutobuyable) {
        const buttons = [0, b.velocity];
        return (
          <>
            {buttons.map((count, index) => (
              <button
                key={`autobuy.${ctx.unitId}.${index}`}
                onClick={() => {
                  dispatch({ type: "autobuy", unitId: ctx.unitId, count });
                }}
              >
                Autobuy {count.toPrecision(3)}
              </button>
            ))}
          </>
        );
      } else {
        return <></>;
      }
    },
  },
];

function ColumnLabel(props: { column: Column }): JSX.Element {
  const { column } = props;
  return (
    <th>
      {column.label ?? (
        <span style={{ textTransform: "capitalize" }}>{column.name}</span>
      )}
    </th>
  );
}

function Timer(props: {
  ctx: UseReducerT<S.Session.Ctx, S.Session.T.Action>;
}): JSX.Element {
  const [ctx, dispatch] = props.ctx;
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    let handle: number | null = null;
    function tick() {
      if (!paused) {
        dispatch({ type: "tick" });
      }
      handle = requestAnimationFrame(tick);
    }
    tick();
    return () => {
      if (handle !== null) cancelAnimationFrame(handle);
    };
  }, [paused, dispatch]);

  return (
    <tr>
      <th>Time</th>
      <td>
        <input
          type="number"
          style={style.input}
          value={S.Duration.toSeconds(S.Session.sinceReified(ctx))}
          onInput={(e) => {
            const s = inputFloat(e.currentTarget.value, 0);
            const reified = S.Duration.dateSub(
              ctx.now,
              S.Duration.fromSeconds(s)
            );
            const session = { ...ctx.session, reified };
            dispatch({ type: "debug-set-session", session });
            setPaused(true);
          }}
        />
      </td>
      <td>
        <button
          onClick={() => {
            if (paused) {
              // add pause duration to reified
              const now = new Date();
              const pauseDur = S.Duration.between({
                before: ctx.now,
                after: now,
              });
              const reified = S.Duration.dateAdd(ctx.session.reified, pauseDur);
              const session = { ...ctx.session, reified };
              dispatch({ type: "debug-set-session", session, now });
            }
            setPaused(!paused);
          }}
        >
          {paused ? "Resume" : "Pause"}
        </button>
      </td>
      <td>
        <button
          onClick={() =>
            dispatch({
              type: "debug-set-session",
              session: S.Session.reify(ctx).session,
            })
          }
        >
          Reify
        </button>
      </td>
      <td>
        <button onClick={() => dispatch({ type: "undo" })}>Undo</button>
      </td>
    </tr>
  );
}

export function inputInt(inputS: string, default_: number): number {
  const input = parseInt(inputS);
  return Math.max(0, isNaN(input) ? default_ : input);
}
export function inputFloat(inputS: string, default_: number): number {
  const input = parseFloat(inputS);
  return Math.max(0, isNaN(input) ? default_ : input);
}

function intersperseI<A>(els: A[], join: (i: number) => A): A[] {
  const ret = els.map((el, i) => [el, join(i)]).flat();
  ret.pop();
  return ret;
}

export function ViewPolynomial(props: { poly: S.Polynomial }): JSX.Element {
  return (
    <>
      {intersperseI(
        S.Polynomial.format(props.poly).map(([c, i]) => {
          switch (i) {
            case 0:
              return <span key={i}>{c}</span>;
            case 1:
              return <span key={i}>{c} t</span>;
            default:
              return (
                <span key={i}>
                  {c} t <sup>{i}</sup>
                </span>
              );
          }
        }),
        (i) => (
          <span key={`${i}+`}> + </span>
        )
      )}
    </>
  );
}
