import loadedPokemon from "public/data/pokemon.json";
import { moves } from "./moves";
import { PokemonType } from "./types/BasicData";
import { Pokemon, Stats } from "./types/Pokemon";

interface LoadedPokemon {
    id: string;
    name: string;
    type1: string;
    type2: string;
    stats: Stats;
    moves: string[];
}

function loadPokemon(mon: LoadedPokemon): Pokemon {
    const newMoves = mon.moves.map((m) => moves[m]);
    return { ...mon, moves: newMoves, type1: mon.type1 as PokemonType, type2: mon.type2 as PokemonType };
}

export const pokemon: Record<string, Pokemon> = Object.fromEntries(
    Object.entries(loadedPokemon).map(([id, mon]) => [id, loadPokemon(mon)])
);

export const nullPokemon: Pokemon = {
    id: "",
    name: "",
    type1: "Normal",
    type2: "Normal",
    stats: {
        hp: 0,
        attack: 0,
        defense: 0,
        speed: 0,
        spatk: 0,
        spdef: 0,
    },
    moves: [],
};
