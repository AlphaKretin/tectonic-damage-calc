import { calcBestMoveMatchup, DefenderData } from "@/app/data/typeChart";
import { PartyPokemon } from "@/app/data/types/PartyPokemon";
import { PokemonType } from "@/app/data/types/PokemonType";

function compare(num: number, total: "nve" | "se") {
    if (total === "se") {
        return num > 1;
    }
    return num < 1;
}

export default function AtkTotalCell({
    cards,
    type,
    total,
}: {
    cards: PartyPokemon[];
    type: PokemonType;
    total: "nve" | "se";
}): React.ReactNode {
    const num = cards.filter((c) => {
        return compare(calcBestMoveMatchup(c, new DefenderData(type)), total);
    }).length;

    return (
        <td className={`border border-gray-600 text-lg text-center cursor-default font-bold`}>{num > 0 ? num : ""}</td>
    );
}
