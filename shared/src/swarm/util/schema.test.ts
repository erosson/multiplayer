import * as IO from "io-ts";
import * as U from "./schema";

const nonzeroIntCodec = U.ioMapper(
  IO.number,
  IO.string,
  (dec, ctx) => {
    const val = parseInt(dec);
    if (isNaN(val)) return IO.failure("nan", ctx);
    if (val === 0) return IO.failure("zero", ctx);
    return IO.success(val);
  },
  (enc) => `${enc}`
);
test("ioMapper", () => {
  expect(nonzeroIntCodec.encode(1)).toBe("1");
  expect(nonzeroIntCodec.decode("1")).toMatchObject({ right: 1 });
  expect(nonzeroIntCodec.decode("1.5")).toMatchObject({ right: 1 });
  expect(nonzeroIntCodec.decode("one")).toMatchObject({ _tag: "Left" });
  expect(nonzeroIntCodec.decode("0")).toMatchObject({ _tag: "Left" });
});
