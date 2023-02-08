import * as S from "../schema";
import { idRecord } from "../util/schema";

export const Unit = idRecord(
  ["larva", "hatchery", "mineral", "drone", "queen", "nest"] as const,
  S.UnitID.wrap
);
export const Upgrade = idRecord(["TODO"] as const, S.UpgradeID.wrap);
export const Achievement = idRecord(["TODO"] as const, S.AchievementID.wrap);
