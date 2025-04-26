import { MoveData } from "@/app/damagecalc/components/MoveCard";
import { LoadedMove } from "../loading/moves";
import { Move } from "../types/Move";
import { PartyPokemon } from "../types/PartyPokemon";

// targets whichever is lower of phys or spec
export class SuperAdaptiveMove extends Move {
    constructor(move: LoadedMove) {
        super(move);
    }

    public getDamageCategory(move: MoveData, user: PartyPokemon, target: PartyPokemon): "Physical" | "Special" {
        const userStats = user.getStats(move, "player");
        const targetStats = target.getStats(move, "opponent");
        const physEstimate = userStats.attack / targetStats.defense;
        const specEstimate = userStats.spatk / targetStats.spdef;
        // in real tectonic a tie returns a random category
        // but this seems... undesirable for a calculator
        if (physEstimate >= specEstimate) {
            return "Physical";
        }
        return "Special";
    }

    static moveCodes = ["CategoryDependsOnHigherDamagePoisonTarget"];
}
