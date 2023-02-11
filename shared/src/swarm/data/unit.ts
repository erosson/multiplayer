import * as S from "../schema";
import { Unit } from "./id";

/**
 * All unit definitions
 */
const list: readonly S.Unit[] = [
  { id: Unit.larva, init: 10, cost: [], prod: [] },
  {
    id: Unit.hatchery,
    init: 1,
    cost: [{ unit: Unit.mineral, value: 300, factor: 10 }],
    prod: [{ unit: Unit.larva, value: 1 }],
  },
  { id: Unit.mineral, init: 35, cost: [], prod: [] },
  {
    id: Unit.drone,
    cost: [
      { unit: Unit.larva, value: 1 },
      { unit: Unit.mineral, value: 10 },
    ],
    prod: [{ unit: Unit.mineral, value: 1 }],
  },
  {
    id: Unit.queen,
    cost: [
      { unit: Unit.larva, value: 1 },
      { unit: Unit.drone, value: 100 },
    ],
    prod: [{ unit: Unit.drone, value: 2 }],
  },
  {
    id: Unit.nest,
    cost: [
      { unit: Unit.larva, value: 1 },
      { unit: Unit.queen, value: 1000 },
    ],
    prod: [{ unit: Unit.queen, value: 3 }],
  },
  { id: Unit.territory, cost: [], prod: [] },
];
export default list;
