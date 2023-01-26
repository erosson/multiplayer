import { Unit } from "../schema";
import { Unit as ID } from "./id";

/**
 * All unit definitions
 */
const list: readonly Unit[] = [
  { id: ID.larva, init: 10, cost: [], prod: [] },
  {
    id: ID.hatchery,
    init: 1,
    cost: [{ unit: ID.mineral, value: 300, factor: 10 }],
    prod: [{ unit: ID.larva, value: 1 }],
  },
  { id: ID.mineral, init: 35, cost: [], prod: [] },
  {
    id: ID.drone,
    cost: [
      { unit: ID.larva, value: 1 },
      { unit: ID.mineral, value: 10 },
    ],
    prod: [{ unit: ID.mineral, value: 1 }],
  },
  {
    id: ID.queen,
    cost: [
      { unit: ID.larva, value: 1 },
      { unit: ID.drone, value: 100 },
    ],
    prod: [{ unit: ID.drone, value: 2 }],
  },
];
export default list;
