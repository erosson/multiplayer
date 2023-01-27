export enum Route {
  home = "/",
  hello = "/hello",
  count = "/count",
  platform = "/platform",
  swarm = "/swarm",
  swarmGraph = "/swarm-graph",
  chromGraph = "/chrom-graph/:figure?",
}
export function chromGraph(figure?: string): string {
  return Route.chromGraph.replace("/:figure?", figure ?? "");
}
