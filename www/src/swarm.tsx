import React from "react";
import { Env } from "./env";
import * as S from "shared/src/swarm";

function inputInt(inputS: string, default_: number): number {
  const input = parseInt(inputS);
  return Math.max(0, isNaN(input) ? default_ : input);
}
function inputFloat(inputS: string, default_: number): number {
  const input = parseFloat(inputS);
  return Math.max(0, isNaN(input) ? default_ : input);
}
const prodNames = ["Drone", "Queen", "Nest", "Yas Queen"];
function prodName(i: number): string {
  return i in prodNames ? `${prodNames[i]} (prod[${i}])` : `prod[${i}]`;
}
const style = {
  input: { width: "5em" },
  readonlyInput: { width: "5em", border: "none" },
};
export default function Swarm(props: { env: Env }): JSX.Element {
  const [start, setStart] = React.useState(Date.now());
  const [timeMs, setTimeMs] = React.useState(0);
  const [minerals, setMinerals] = React.useState(0);
  const [prods, setProds] = React.useState<S.ProductionUnit[]>([]);
  const [paused, setPaused] = React.useState(false);
  const polys = S.Production.toPolynomials(minerals, prods);
  const counts = S.Production.calcs(minerals, prods, timeMs / 1000);

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
  }, [paused]);

  function reify() {
    setTimeMs(0);
    setStart(Date.now());
    setMinerals(counts[0]);
    setProds(prods.map((p, i) => ({ ...p, count: counts[i + 1] })));
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
            <th>Production</th>
            <th>Count(t)</th>
            <th>Polynomial</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Minerals</th>
            <td>
              <input
                type="number"
                style={style.input}
                value={minerals}
                onInput={(e) =>
                  setMinerals(inputInt(e.currentTarget.value, minerals))
                }
              />
            </td>
            <td>-</td>
            <td>
              <input
                readOnly={true}
                style={style.readonlyInput}
                value={counts[0]}
              />
            </td>
            <td>
              <ViewPolynomial poly={polys[0]} />
            </td>
          </tr>
          {prods.map((prod, i) => {
            return (
              <tr key={i}>
                <th>{prodName(i)}</th>
                <td>
                  <input
                    type="number"
                    style={style.input}
                    value={prod.count}
                    onInput={(e) =>
                      setProds((prods) => {
                        prods = [...prods];
                        prods[i].count = inputInt(
                          e.currentTarget.value,
                          prod.count
                        );
                        if (i === prods.length - 1 && prods[i].count === 0) {
                          // remove the last element when count is 0
                          prods.pop();
                        }
                        return prods;
                      })
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    style={style.input}
                    value={prod.production}
                    onInput={(e) =>
                      setProds((prods) => {
                        prods = [...prods];
                        prods[i].production = inputInt(
                          e.currentTarget.value,
                          prod.production
                        );
                        return prods;
                      })
                    }
                  />
                </td>
                <td>
                  <input
                    readOnly={true}
                    style={style.readonlyInput}
                    value={counts[i + 1]}
                  />
                </td>
                <td>
                  <ViewPolynomial poly={polys[i + 1]} />
                </td>
              </tr>
            );
          })}
          <tr>
            <th>{prodName(prods.length)}</th>
            <td>
              <input
                type="number"
                style={style.input}
                value={0}
                onInput={(e) =>
                  setProds((prods) => {
                    const count = inputInt(e.currentTarget.value, 1);
                    return count === 0
                      ? prods
                      : prods.concat([
                          {
                            count,
                            production: 1,
                          },
                        ]);
                  })
                }
              />
            </td>
            <td>
              <input
                type="number"
                style={style.input}
                value={0}
                onInput={(e) =>
                  setProds((prods) => {
                    const production = inputInt(e.currentTarget.value, 1);
                    return production === 0
                      ? prods
                      : prods.concat([
                          {
                            count: 1,
                            production,
                          },
                        ]);
                  })
                }
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function ViewPolynomial(props: { poly: S.Polynomial }): JSX.Element {
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

function intersperseI<A>(els: A[], join: (i: number) => A): A[] {
  const ret = els.map((el, i) => [el, join(i)]).flat();
  ret.pop();
  return ret;
}