import React from "react";
import * as S from "shared/src/swarm";
import _, { omit } from "lodash";
import { keyBy } from "shared/src/swarm/util/schema";
import { ViewPolynomial, inputInt, inputFloat } from "./swarm";
import { partitionMapWithIndex } from "fp-ts/lib/ReadonlyRecord";
import { reify } from "shared/src/swarm/session";
import { flow, pipe } from "fp-ts/lib/function";

const style = {
  input: { width: "5em" },
  readonlyInput: { width: "5em", border: "none" },
  prodList: { padding: 0, margin: 0, listStyleType: "none" },
};
export default function Swarm(): JSX.Element {
  const data = S.Data.create();
  console.log("data", data);
  return <_Swarm data={data} />;
}
function _Swarm(props: {
  data: ReturnType<typeof S.Data.create>;
}): JSX.Element {
  const { data } = props;
  const [ctx, setCtx] = React.useState(() => S.Session.empty(data));

  return (
    <div>
      <h1>swarm</h1>
      <table>
        <thead>
          <Timer {...{ ctx, setCtx }} />
          <tr>
            {columns.map((c) => (
              <th key={c.name}>
                <ColumnLabel column={c} />
              </th>
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
              // different name because ctx references a unit and setSession doesn't
              setSession: setCtx,
              unit,
              count0,
              count,
              poly,
            };
            return <Unit key={ctx.unitId} {...props} />;
          })}
        </tbody>
      </table>
    </div>
  );
}

interface UnitProps<I extends S.Schema.AnyID> {
  ctx: S.Session.Unit.SnapshotCtx<I>;
  setSession: React.Dispatch<React.SetStateAction<S.Session.T.SnapshotCtx<I>>>;
  unit: S.Schema.Unit<I>;
  // redundant/cached
  count: number;
  count0: number;
  poly: number[];
}
function Unit<I extends S.Schema.AnyID>(props: UnitProps<I>): JSX.Element {
  return (
    <tr key={props.unit.id}>
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
  element<I extends S.Schema.AnyID>(props: UnitProps<I>): JSX.Element;
}
const columns: readonly Column[] = [
  {
    name: "name",
    element(props) {
      return <>{props.unit.id}</>;
    },
  },
  {
    name: "count(0)",
    element(props) {
      const { ctx, count0, setSession } = props;
      return (
        <input
          type="number"
          style={style.input}
          value={count0}
          onInput={(e) => {
            const value = e.currentTarget.value;
            setSession(
              S.Session.Unit.set(ctx, {
                ...S.Session.Unit.get(ctx),
                count: inputInt(value ?? "", count0),
              })
              // TODO why does type inference not work right here?
              // S.Session.Unit.map(ctx, (u, x) => ({
              // ...u,
              // count: inputInt(value ?? "", count0),
              // }))
            );
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
    name: "produces",
    element(props) {
      const { unit } = props;
      return (
        <ul style={style.prodList}>
          {(unit.prod ?? []).map((prod) => (
            <li key={`${unit.id} -> ${prod.unit}`}>
              {prod.unit} &times;{prod.value}
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
              {cost.unit} &times;
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
      return (
        <ul style={style.prodList}>
          {S.Session.Unit.buyable(props.ctx).cost.map((res) => (
            <li key={`${props.ctx.unitId} $$ ${res.cost.unit}`}>
              {res.buyable.toPrecision(3)}
            </li>
          ))}
        </ul>
      );
    },
  },
  {
    name: "buy rate",
    element(props) {
      const b = S.Session.Unit.buyableVelocity(props.ctx);
      return (
        <ul style={style.prodList}>
          {b
            ? b.cost.map((res) => (
                <li key={`${props.ctx.unitId} v$$ ${res.cost.unit}`}>
                  {res.velocity.toPrecision(3)}/s
                </li>
              ))
            : []}
        </ul>
      );
    },
  },
  {
    name: "buy-button",
    element({ ctx, setSession }) {
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
                  setSession(
                    // TODO there must be a better way to do these types
                    S.Session.Unit.buy<(typeof ctx)["data"]["id"], typeof ctx>(
                      ctx,
                      count
                    )
                  );
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
  ctx: S.Session.T.SnapshotCtx<S.Schema.AnyID>;
  setCtx: React.Dispatch<
    React.SetStateAction<S.Session.T.SnapshotCtx<S.Schema.AnyID>>
  >;
}): JSX.Element {
  const { ctx, setCtx } = props;
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    let handle: number | null = null;
    function tick() {
      if (!paused) {
        setCtx(S.Session.tick);
      }
      handle = requestAnimationFrame(tick);
    }
    tick();
    return () => {
      if (handle !== null) cancelAnimationFrame(handle);
    };
  }, [paused, setCtx]);

  return (
    <tr>
      <th>Time</th>
      <td>
        <input
          type="number"
          style={style.input}
          value={S.Duration.toSeconds(S.Session.sinceReified(ctx))}
          onInput={(e) => {
            setPaused(true);
            setCtx((ctx) => {
              const s = inputFloat(e.currentTarget.value, 0);
              const now = S.Duration.dateAdd(
                ctx.session.reified,
                S.Duration.fromSeconds(s)
              );
              return { ...ctx, now };
            });
          }}
        />
      </td>
      <td>
        <button
          onClick={() => {
            if (paused) {
              // reify on unpause avoids needing to track how long we were paused
              setCtx(
                flow(S.Session.reify, S.Session.tick, (ctx) => ({
                  ...ctx,
                  session: { ...ctx.session, reified: ctx.now },
                }))
              );
            }
            setPaused(!paused);
          }}
        >
          {paused ? "Reify and Resume" : "Pause"}
        </button>
      </td>
      <td>
        <button onClick={() => setCtx(S.Session.reify)}>Reify</button>
      </td>
    </tr>
  );
}
