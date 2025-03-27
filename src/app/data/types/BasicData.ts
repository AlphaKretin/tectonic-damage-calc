export const pokemonTypes = [
    "Normal",
    "Fire",
    "Water",
    "Grass",
    "Electric",
    "Ice",
    "Fighting",
    "Poison",
    "Ground",
    "Flying",
    "Psychic",
    "Bug",
    "Rock",
    "Ghost",
    "Dragon",
    "Dark",
    "Steel",
    "Fairy",
    "Mutant",
] as const;

export type PokemonType = (typeof pokemonTypes)[number];

export type MoveCategory = "Physical" | "Special" | "Status";

export interface StylePoints {
    hp: number;
    attacks: number;
    defense: number;
    spdef: number;
    speed: number;
}

export const defaultStylePoints: StylePoints = {
    hp: 0,
    attacks: 0,
    defense: 0,
    spdef: 0,
    speed: 0,
};
