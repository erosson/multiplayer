import * as S from "./session";
import * as DID from "./data/id";

test("session basics: linear count", () => {
  const session = S.create();
  session.unit.hatchery.count = 10;
  session.unit.larva.count = 0;
  expect(S.unitPolynomial(session, DID.Unit.larva)).toEqual([0, 10]);
  expect(S.unitCountElapsed(session, DID.Unit.larva, S.elapsedMs(0))).toBe(0);
  expect(S.unitCountElapsed(session, DID.Unit.larva, S.elapsedMs(1000))).toBe(
    10
  );
  expect(S.unitCountElapsed(session, DID.Unit.larva, S.elapsedMs(2000))).toBe(
    20
  );
});

test("session basics: cubic count", () => {
  const session = S.create();
  session.unit.queen.count = 10;
  session.unit.mineral.count = 0;
  expect(S.unitPolynomial(session, DID.Unit.mineral).slice(0, 3)).toEqual([
    0, 0, 10,
  ]);
  expect(S.unitCountElapsed(session, DID.Unit.mineral, S.elapsedMs(0))).toBe(0);
  expect(S.unitCountElapsed(session, DID.Unit.mineral, S.elapsedMs(1000))).toBe(
    10
  );
  expect(S.unitCountElapsed(session, DID.Unit.mineral, S.elapsedMs(2000))).toBe(
    40
  );
});
