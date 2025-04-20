import { LoadedMove } from "../loading/moves";
import { Move } from "../types/Move";
import { Stat } from "../types/Pokemon";

export const differentAttackStatMoves: Record<string, Stat> = {
    BODYPRESS: "defense",
};

export class DifferentAttackingStatMove extends Move {
    attackStat: Stat;
    constructor(move: LoadedMove, attackStat: Stat) {
        super(move);
        this.attackStat = attackStat;
    }

    public getAttackingStat(): Stat {
        return this.attackStat;
    }
}
