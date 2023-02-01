import React from "react";
import * as S from "shared/src/swarm";
import { ViewPolynomial, inputInt, inputFloat } from "./swarm";

const style = {
  input: { width: "5em" },
  readonlyInput: { width: "5em", border: "none" },
  prodList: { padding: 0, margin: 0, listStyleType: "none" },
};
export default function Swarm(): JSX.Element {
  const [start, setStart] = React.useState(Date.now());
  const [timeMs, setTimeMs] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  const data = S.Data.create();
  const [session, setSession] = React.useState(() => S.Session.create(data));

  React.useEffect(() => {
    let handle: number | null = null;
    function tick() {
      if (!paused) {
        const now = Date.now();
        setTimeMs(now - start);
      }
      handle = requestAnimationFrame(tick);
    }
    tick();
    return () => {
      if (handle !== null) cancelAnimationFrame(handle);
    };
  }, [paused, start]);

  function elapsed() {
    return S.Session.elapsedMs(timeMs);
  }
  function reify() {
    setTimeMs(0);
    setStart(Date.now());
    setSession((session) => S.Session.reify(session, elapsed()));
  }

  return (
    <div>
      <h1>swarm</h1>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <td>
              <input
                type="number"
                style={style.input}
                value={timeMs / 1000}
                onInput={(e) => {
                  setPaused(true);
                  setTimeMs(
                    Math.floor(1000 * inputFloat(e.currentTarget.value, timeMs))
                  );
                }}
              />
            </td>
            <td>
              <button
                onClick={() => {
                  setStart(Date.now() - timeMs);
                  setPaused(!paused);
                }}
              >
                {paused ? "Resume" : "Pause"}
              </button>
            </td>
            <td>
              <button onClick={reify}>Reify</button>
            </td>
          </tr>
          <tr>
            <th>Name</th>
            <th>Count(0)</th>
            <th>Produces</th>
            <th>Prod Rate</th>
            <th>Count(t)</th>
            <th>Polynomial</th>
            <th>Degree</th>
            <th>Cost</th>
            <th>Buyable</th>
            <th>Buy Rate</th>
          </tr>
        </thead>
        <tbody>
          {data.unit.list.map((unit, i) => {
            const count0 = S.Session.unitCount0(session, unit.id);
            const count = S.Session.unitCount(session, unit.id, elapsed());
            const poly = S.Session.unitPolynomial(session, unit.id);
            return (
              <tr key={unit.id}>
                <th>{unit.id}</th>
                <td>
                  <input
                    type="number"
                    style={style.input}
                    value={count0}
                    onInput={(e) => {
                      const value = e.currentTarget.value;
                      setSession((session) =>
                        S.Session.setUnit(session, unit.id, (u) => ({
                          ...u,
                          count: inputInt(value ?? "", count0),
                        }))
                      );
                    }}
                  />
                </td>
                <td>
                  <ul style={style.prodList}>
                    {(unit.prod ?? []).map((prod) => (
                      <li key={`${unit.id} -> ${prod.unit}`}>
                        {prod.unit} &times;{prod.value}
                      </li>
                    ))}
                  </ul>
                </td>
                <td>
                  {S.Session.unitVelocity(
                    session,
                    unit.id,
                    elapsed()
                  ).toPrecision(3)}
                  /s
                </td>
                <td>
                  <input
                    readOnly={true}
                    type="number"
                    style={style.readonlyInput}
                    value={count.toPrecision(3)}
                  />
                </td>
                <td>
                  <ViewPolynomial poly={poly} />
                </td>
                <td>{S.Polynomial.degree(poly)}</td>
                <td>
                  <ul style={style.prodList}>
                    {(unit.cost ?? []).map((cost) => (
                      <li key={`${unit.id} $$ ${cost.unit}`}>
                        {cost.unit} &times;
                        {cost.value *
                          (cost.factor ? Math.pow(cost.factor, count0) : 1)}
                      </li>
                    ))}
                  </ul>
                </td>
                <td>
                  <ul style={style.prodList}>
                    {(unit.cost ?? []).map((cost) => (
                      <li key={`${unit.id} $$$ ${cost.unit}`}>
                        {S.Session.costBuyable(
                          session,
                          cost,
                          elapsed()
                        ).toPrecision(3)}{" "}
                        buyable
                      </li>
                    ))}
                  </ul>
                </td>
                <td>
                  <ul style={style.prodList}>
                    {(unit.cost ?? []).map((cost) => (
                      <li key={`${unit.id} $$$ ${cost.unit}`}>
                        {S.Session.costBuyableVelocity(
                          session,
                          cost,
                          elapsed()
                        ).toPrecision(3)}
                        /s
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
