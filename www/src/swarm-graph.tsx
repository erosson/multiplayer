import React from "react";
import * as S from "shared/src/swarm";
// import "graphology-types";
import * as G from "graphology";
// import * as C from "graphology-canvas";
import * as C from "sigma";
import * as CT from "sigma/types";
import * as GL from "graphology-layout";
import forceAtlas2 from "graphology-layout-forceatlas2";

const style = {
  canvas: {
    border: "1px solid red",
    borderRadius: "0.5em",
    width: "400px",
    height: "400px",
  },
};

export default function SwarmProduction(): JSX.Element {
  const [graph, setGraph] = React.useState<G.default | null>(null);

  React.useEffect(() => {
    const d = S.Data.create();
    const graph = d.unit.producerGraph.all;

    const rendered = new G.DirectedGraph<
      Partial<CT.NodeDisplayData>,
      Partial<CT.EdgeDisplayData>
    >({
      allowSelfLoops: false,
      multi: false,
      type: "directed",
    });
    graph.forEachNode((node, unit) =>
      rendered.addNode(node, { color: "red", size: 5, label: unit.id })
    );
    graph.forEachEdge((edge, prod, source, target) =>
      rendered.addEdge(source, target, {
        // color: "red",
        size: 3,
        label: `${prod.prod.value}`,
        forceLabel: true,
        type: "arrow",
      })
    );
    GL.circular.assign(rendered, { scale: 1 });
    forceAtlas2.assign(rendered, { iterations: 50 });
    console.log("setup graph", rendered);
    setGraph(rendered);
    return () => rendered.clear();
  }, []);

  // const canvas = React.useRef<HTMLCanvasElement | null>(null);
  const canvas = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    // const context = canvas.current?.getContext("2d");
    // if (context) {
    if (canvas.current && graph) {
      new C.Sigma(graph, canvas.current, {});
      // C.render(graph, context, {
      // padding: 20,
      // height: 350,
      // width: 350,
      // edges: {},
      // nodes: {},
      // });
    }
  }, [canvas, graph]);
  return (
    <div>
      <div style={style.canvas} ref={canvas}></div>
      {/* <canvas height={dim} width={dim} style={style.canvas} ref={canvas} /> */}
    </div>
  );
}
