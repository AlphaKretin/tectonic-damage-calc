import loadedMoves from "public/data/moves.json";
import { LoadedMove } from "./loading/moves";
import { BreakScreensMove } from "./moves/BreakScreensMove";
import { ConditionalAutoBoostMove } from "./moves/ConditionalAutoBoostMove";
import { ConditionalInputBoostMove } from "./moves/ConditionalInputBoostMove";
import { DesperationMove } from "./moves/DesperationMove";
import { DifferentAttackingStatMove } from "./moves/DifferentAttackStatMove";
import { DifferentDefenseStatMove } from "./moves/DifferentDefenseStatMove";
import { ExtraEffectiveMove } from "./moves/ExtraEffectiveMove";
import { ExtraTypeMove } from "./moves/ExtraTypeMove";
import { FacadeMove } from "./moves/FacadeMove";
import { HitsFliersMove } from "./moves/HitsFliersMove";
import { HPScalingMove } from "./moves/HPScalingMove";
import { IgnoreStatMove } from "./moves/IgnoreStatMove";
import { MultiHitMove } from "./moves/MultiHitMove";
import { SlownessScalingMove } from "./moves/SlownessScalingMove";
import { SpeedScalingMove } from "./moves/SpeedScalingMove";
import { SpitUpMove } from "./moves/SpitUpMove";
import { StackingMove } from "./moves/StackingMove";
import { StepScalingMove } from "./moves/StepScalingMove";
import { SuperAdaptiveMove } from "./moves/SuperAdaptiveMove";
import { TargetAttackMove } from "./moves/TargetAttackMove";
import { UserBelowHalfDoubleMove } from "./moves/UserBelowHalfDoubleMove";
import { VariableTypeMove } from "./moves/VariableTypeMove";
import { WeightTargetScalingMove } from "./moves/WeightTargetScalingMove";
import { WeightUserScalingMove } from "./moves/WeightUserScalingMove";
import { Move } from "./types/Move";

const moveSubclasses = [
    BreakScreensMove,
    ConditionalAutoBoostMove,
    ConditionalInputBoostMove,
    DesperationMove,
    DifferentAttackingStatMove,
    DifferentDefenseStatMove,
    ExtraEffectiveMove,
    ExtraTypeMove,
    FacadeMove,
    HitsFliersMove,
    HPScalingMove,
    IgnoreStatMove,
    MultiHitMove,
    SpeedScalingMove,
    SlownessScalingMove,
    SpitUpMove,
    StackingMove,
    StepScalingMove,
    SuperAdaptiveMove,
    TargetAttackMove,
    UserBelowHalfDoubleMove,
    VariableTypeMove,
    WeightTargetScalingMove,
    WeightUserScalingMove,
];

function loadMove(move: LoadedMove): Move {
    for (const subclass of moveSubclasses) {
        if (subclass.moveCodes.includes(move.functionCode)) {
            return new subclass(move);
        }
    }
    return new Move(move);
}

export const moves: Record<string, Move> = Object.fromEntries(
    Object.entries(loadedMoves).map(([id, move]) => [id, loadMove(move)])
);

export const nullMove: Move = new Move({
    key: "",
    name: "",
    description: "",
    type: "Normal",
    power: 0,
    accuracy: 0,
    pp: 0,
    category: "Status",
    target: "User",
    functionCode: "Basic",
    effectChance: 0,
    priority: 0,
    flags: [],
});
