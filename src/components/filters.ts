import { Pokemon } from "@/app/data/tectonic/Pokemon";
import { TectonicData } from "@/app/data/tectonic/TectonicData";

export type FilterOperator = "==" | "!=" | ">" | "<" | "includes";

type BaseFilter = {
    label: string; // What users see in the UI
    operator: FilterOperator;
    value: string | number;
    apply: (pokemon: Pokemon, value: string | number) => boolean;
};

type TextFilter = BaseFilter & {
    inputMethod: "text";
};

type SelectFilter = BaseFilter & {
    inputMethod: "select";
    inputValues: readonly string[];
};

function validateMoves(pokemon: Pokemon) {
    if (!pokemon.levelMoves) {
        console.warn(`Pokemon ${pokemon.name} has undefined level_moves`);
        return false;
    }

    const invalidMoves = pokemon.levelMoves.filter((m) => !m?.[1]?.name);
    if (invalidMoves.length > 0) {
        console.warn(`Pokemon ${pokemon.name} has invalid moves:`, invalidMoves);
        return false;
    }
    return true;
}

export type PokemonFilterType = TextFilter | SelectFilter;

export const nameFilter: PokemonFilterType = {
    label: "Name",
    operator: "includes",
    value: "",
    inputMethod: "text",
    apply: (pokemon, value) => {
        const searchValue = String(value).toLowerCase();
        return pokemon.name.toLowerCase().includes(searchValue);
    },
};

export const abilityNameFilter: PokemonFilterType = {
    label: "Ability Name",
    operator: "includes",
    value: "",
    apply: (pokemon: Pokemon, value: string | number) => {
        const searchValue = String(value).toLowerCase();
        return pokemon.abilities.some((a) => a.name.toLowerCase().includes(searchValue));
    },
    inputMethod: "text",
};

export const allMovesFilter: PokemonFilterType = {
    label: "Moves (All)",
    operator: "includes",
    value: "",
    apply: (pokemon: Pokemon, value: string | number) => {
        if (!validateMoves(pokemon)) return false;
        const searchValue = String(value).toLowerCase();
        return pokemon.allMoves().some((m) => m.name.toLowerCase().includes(searchValue));
    },
    inputMethod: "select",
    inputValues: Object.values(TectonicData.moves).map((m) => m.name),
};

export const tribesFilter: PokemonFilterType = {
    label: "Tribes",
    operator: "includes",
    value: "",
    apply: (pokemon: Pokemon, value: string | number) => {
        const searchValue = String(value).toLowerCase();
        return pokemon.tribes.some((t) => t.name.toLowerCase().includes(searchValue));
    },
    inputMethod: "select",
    inputValues: Object.values(TectonicData.tribes).map((t) => t.name),
};

export const heldItemFilter: PokemonFilterType = {
    label: "Wild Held Item",
    operator: "includes",
    value: "",
    apply: (pokemon: Pokemon, value: string | number) => {
        const searchValue = String(value).toLowerCase();
        return pokemon.items.some(([i]) => i.name.toLowerCase().includes(searchValue));
    },
    inputMethod: "select",
    inputValues: Object.values(TectonicData.items).map((i) => i.name),
};

export const AVAILABLE_FILTERS: PokemonFilterType[] = [
    // Standard field filters
    nameFilter,

    // Custom filters
    {
        label: "Type",
        operator: "includes",
        value: "",
        apply: (pokemon: Pokemon, value: string | number) => {
            const searchType = String(value).toLowerCase();
            return (
                pokemon.type1.name.toLowerCase().includes(searchType) ||
                (pokemon.type2?.name.toLowerCase().includes(searchType) ?? false)
            );
        },
        inputMethod: "select",
        inputValues: Object.values(TectonicData.types)
            .filter((t) => t.isRealType)
            .map((t) => t.name),
    },
    abilityNameFilter,
    {
        label: "Ability Desc",
        operator: "includes",
        value: "",
        apply: (pokemon: Pokemon, value: string | number) => {
            const searchValue = String(value).toLowerCase();
            return pokemon.abilities.some((a) => a.description.toLowerCase().includes(searchValue));
        },
        inputMethod: "text",
    },
    {
        label: "Moves (Level)",
        operator: "includes",
        value: "",
        apply: (pokemon: Pokemon, value: string | number) => {
            if (!validateMoves(pokemon)) return false;
            const searchValue = String(value).toLowerCase();
            return pokemon.levelMoves.some((m) => m[1].name.toLowerCase().includes(searchValue));
        },
        inputMethod: "select",
        inputValues: Object.values(TectonicData.moves).map((m) => m.name),
    },
    allMovesFilter,
    tribesFilter,
    heldItemFilter,
];
