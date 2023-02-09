import React from "react";
import { Link } from "react-router-dom";
import * as Route from "./route";

const style = {
  list: { listStyleType: "none", margin: 0, padding: 0 },
  li: { display: "inline-block", margin: "0.5em" },
};
export default function Nav(): JSX.Element {
  return (
    <nav>
      <ul style={style.list}>
        <li style={style.li}>
          <Link to={Route.Route.home}>home</Link>
        </li>
        <li style={style.li}>
          <Link to={Route.Route.hello}>hello</Link>
        </li>
        <li style={style.li}>
          <Link to={Route.Route.count}>count</Link>
        </li>
        <li style={style.li}>
          <Link to={Route.Route.platform}>platform</Link>
        </li>
        <li style={style.li}>
          <Link to={Route.Route.swarm}>swarm math</Link>
        </li>
        <li style={style.li}>
          <Link to={Route.Route.swarmGraph}>swarm graph</Link>
        </li>
      </ul>
    </nav>
  );
}
