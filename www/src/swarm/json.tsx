import * as Either from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import React from "react";
import ReactJson, { InteractionProps } from "react-json-view";
import { Link } from "react-router-dom";
import * as S from "shared/src/swarm";
import * as Route from "../route";
import { UseReducerT } from "../util";

export default function View(props: {
  ctx: UseReducerT<S.Session.Ctx, S.Session.T.Action>;
}): JSX.Element {
  const [ctx, dispatch] = props.ctx;
  function onChange(event: InteractionProps): void {
    console.log("json:onchange", event);
    pipe(
      event.updated_src,
      S.Session.T.Session.json.decode,
      Either.fold(
        (err) => console.error(err),
        (session) => dispatch({ type: "debug-set-session", session })
      )
    );
  }
  return (
    <>
      <h1>
        <Link to={Route.Route.swarm}>swarm</Link> &gt; json
      </h1>
      <ReactJson
        src={S.Session.T.Session.json.encode(ctx.session) as object}
        onEdit={onChange}
        onAdd={onChange}
        onDelete={onChange}
      />
      <textarea
        value={S.Session.T.Session.jsonStringF.encode(ctx.session)}
        onChange={(e) =>
          pipe(
            e.currentTarget.value,
            S.Session.T.Session.jsonStringF.decode,
            Either.fold(
              (err) => console.error(err),
              (session) => dispatch({ type: "debug-set-session", session })
            )
          )
        }
      />
    </>
  );
}
