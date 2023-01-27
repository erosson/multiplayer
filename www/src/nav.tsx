import React from "react";
import { Link } from "react-router-dom";
import Route from "./route";

const style = {
  list: { listStyleType: "none", margin: 0, padding: 0 },
  li: { display: "inline-block", margin: "0.5em" },
};
export default function Nav(): JSX.Element {
  return (
    <nav>
      <ul style={style.list}>
        <li style={style.li}>
          <Link to={Route.home}>home</Link>
        </li>
        <li style={style.li}>
          <Link to={Route.hello}>hello</Link>
        </li>
        <li style={style.li}>
          <Link to={Route.count}>count</Link>
        </li>
        <li style={style.li}>
          <Link to={Route.platform}>platform</Link>
        </li>
        <li style={style.li}>
          <Link to={Route.swarm}>swarm math</Link>
        </li>
        <li style={style.li}>
          <Link to={Route.swarmGraph}>swarm graph</Link>
        </li>
        <li style={style.li}>
          <Link to={Route.chromGraph}>chromatic graph</Link>
        </li>
      </ul>
    </nav>
  );
}
