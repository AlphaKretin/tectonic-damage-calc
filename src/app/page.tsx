"use client";

import type { NextPage } from "next";
import { useState } from "react";
import { moves, nullMove } from "./data/moves";
import { nullPokemon, pokemon } from "./data/pokemon";
import { typeChart } from "./data/typeChart";
import { blankStylePoints, PokemonType, StylePoints } from "./data/types/BasicData";
import { Move } from "./data/types/Move";
import { blankStats, Pokemon, Stats } from "./data/types/Pokemon";

function isNull(o: Pokemon | Pokemon | Move | undefined): boolean {
    return !o || o.id === "";
}

function isKey<T extends object>(k: string | number | symbol, o: T): k is keyof T {
    return k in o;
}

function safeKeys<T extends object>(o: T): Array<keyof T> {
    const allKeys = Object.keys(o);
    return allKeys.filter((k) => isKey(k, o));
}

const PokemonDamageCalculator: NextPage = () => {
    const [playerPokemon, setPlayerPokemon] = useState<Pokemon>(nullPokemon);
    const [playerMove, setPlayerMove] = useState<Move>(nullMove);
    const [playerLevel, setPlayerLevel] = useState<number>(70);
    const [playerStylePoints, setPlayerStylePoints] = useState<StylePoints>(blankStylePoints);
    const [playerCalculatedStats, setPlayerCalculatedStats] = useState<Stats>(blankStats);

    const [opponentPokemon, setOpponentPokemon] = useState<Pokemon>(nullPokemon);
    const [opponentLevel, setOpponentLevel] = useState<number>(70);
    const [opponentStylePoints, setOpponentStylePoints] = useState<StylePoints>(blankStylePoints);
    const [opponentCalculatedStats, setOpponentCalculatedStats] = useState<Stats>(blankStats);

    const [multiBattle, setMultiBattle] = useState<boolean>(false);

    type Side = "player" | "opponent";

    const getPokemon = {
        player: playerPokemon,
        opponent: opponentPokemon,
    };

    const setPokemon = {
        player: setPlayerPokemon,
        opponent: setOpponentPokemon,
    };

    const getLevel = {
        player: playerLevel,
        opponent: opponentLevel,
    };

    const setLevel = {
        player: setPlayerLevel,
        opponent: setOpponentLevel,
    };

    const getStylePoints = {
        player: playerStylePoints,
        opponent: opponentStylePoints,
    };

    const setStylePoints = {
        player: setPlayerStylePoints,
        opponent: setOpponentStylePoints,
    };

    const getCalculatedStats = {
        player: playerCalculatedStats,
        opponent: opponentCalculatedStats,
    };

    const setCalculatedStats = {
        player: setPlayerCalculatedStats,
        opponent: setOpponentCalculatedStats,
    };

    const DEFAULT_LEVEL = 70;
    const STYLE_POINT_CAP = 50;

    function handleLoadingPokemon(pokemon: Pokemon, side: Side) {
        if (!isNull(pokemon)) {
            setPokemon[side](pokemon);
            const baseStats = pokemon.stats;
            const level = DEFAULT_LEVEL;
            const stylePoints = blankStylePoints;
            const newStats: Stats = {
                hp: calculateHP(baseStats.hp, level, stylePoints.hp),
                attack: calculateStat(baseStats.attack, level, stylePoints.attacks),
                defense: calculateStat(baseStats.defense, level, stylePoints.defense),
                spatk: calculateStat(baseStats.spatk, level, stylePoints.attacks),
                spdef: calculateStat(baseStats.spdef, level, stylePoints.spdef),
                speed: calculateStat(baseStats.speed, level, stylePoints.speed),
            };
            setCalculatedStats[side](newStats);
            if (side === "player") {
                setPlayerMove(nullMove);
            }
        }
    }

    function styleValueMult(level: number): number {
        return 2.0 + level / 50.0;
    }

    function calculateHP(base: number, level: number, sv: number, stylish: boolean = false): number {
        if (base === 1) return 1; // For Shedinja
        const pseudoLevel = 15.0 + level / 2.0;
        const stylishMult = stylish ? 2.0 : 1.0;
        return Math.floor(
            ((base * 2.0 + sv * styleValueMult(level) * stylishMult) * pseudoLevel) / 100.0 + pseudoLevel + 10.0
        );
    }

    function calculateStat(base: number, level: number, sv: number, stylish: boolean = false): number {
        const pseudoLevel = 15.0 + level / 2.0;
        const stylishMult = stylish ? 2.0 : 1.0;
        return Math.floor(((base * 2.0 + sv * styleValueMult(level) * stylishMult) * pseudoLevel) / 100.0 + 5.0);
    }

    function isReadyToCalculate() {
        return !isNull(playerPokemon) && !isNull(opponentPokemon) && !isNull(playerMove);
    }

    function handleLevel(level: number, side: Side) {
        setLevel[side](level);
        const baseStats = getPokemon[side].stats;
        const stylePoints = getStylePoints[side];
        const newStats: Stats = {
            hp: calculateHP(baseStats.hp, level, stylePoints.hp),
            attack: calculateStat(baseStats.attack, level, stylePoints.attacks),
            defense: calculateStat(baseStats.defense, level, stylePoints.defense),
            spatk: calculateStat(baseStats.spatk, level, stylePoints.attacks),
            spdef: calculateStat(baseStats.spdef, level, stylePoints.spdef),
            speed: calculateStat(baseStats.speed, level, stylePoints.speed),
        };
        setCalculatedStats[side](newStats);
    }

    function handleStylePoints(stylePoints: StylePoints, side: Side) {
        const spSum = Object.values(stylePoints).reduce((total, sp) => total + sp, 0);
        if (spSum > STYLE_POINT_CAP) {
            alert("You can only have a maximum of 50 total style points!");
            return;
        }
        setStylePoints[side](stylePoints);
        const baseStats = getPokemon[side].stats;
        const level = getLevel[side];
        const newStats: Stats = {
            hp: calculateHP(baseStats.hp, level, stylePoints.hp),
            attack: calculateStat(baseStats.attack, level, stylePoints.attacks),
            defense: calculateStat(baseStats.defense, level, stylePoints.defense),
            spatk: calculateStat(baseStats.spatk, level, stylePoints.attacks),
            spdef: calculateStat(baseStats.spdef, level, stylePoints.spdef),
            speed: calculateStat(baseStats.speed, level, stylePoints.speed),
        };
        setCalculatedStats[side](newStats);
    }

    function styleFromStat(stat: keyof Stats): keyof StylePoints {
        if (stat === "attack" || stat === "spatk") {
            return "attacks";
        }
        return stat;
    }

    function calculateTypeEffect(attackType: PokemonType, defendType1: PokemonType, defendType2?: PokemonType) {
        let mult = typeChart[attackType][defendType1];
        if (defendType2) {
            mult *= typeChart[attackType][defendType2];
        }
        return mult;
    }

    function calculateDamage() {
        const attackingStat = playerMove.category === "Physical" ? "attack" : "spatk";
        const defendingStat = playerMove.category === "Physical" ? "defense" : "spdef";

        // calculate multipliers
        const bpMult = 1;
        const atkMult = 1;
        const defMult = 1;
        let finalMult = 1;
        if (playerMove.isSpread() && multiBattle) {
            finalMult *= 0.75;
        }
        const typeEffectMult = calculateTypeEffect(playerMove.type, opponentPokemon.type1, opponentPokemon.type2);
        finalMult *= typeEffectMult;

        // stat multipliers
        const bp = playerMove.bp * bpMult;
        const attack = Math.max(Math.round(playerCalculatedStats[attackingStat] * atkMult), 1);
        const defense = Math.max(Math.round(opponentCalculatedStats[defendingStat] * defMult), 1);

        // basic damage
        const pseudoLevel = 15 + playerLevel / 2;
        const levelMultiplier = 2 + 0.4 * pseudoLevel;
        let damage = 2 + Math.floor((levelMultiplier * bp * attack) / defense / 50);

        // final multiplier
        damage = Math.max(Math.round(damage * finalMult), 1);

        if (typeEffectMult === 0) {
            damage = 0;
        }
        const percentage = damage / opponentCalculatedStats.hp;
        const hits = Math.ceil(1 / percentage);
        return { damage, percentage, typeEffectMult, hits };
    }

    const damageResult = calculateDamage();

    function pokemonSelect(side: Side) {
        return (
            <>
                <div className="text-center">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Pokémon</label>
                </div>
                <select
                    className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 text-gray-200 focus:ring-blue-500 focus:border-blue-500 text-center"
                    value={getPokemon[side].id}
                    onChange={(e) => handleLoadingPokemon(pokemon[e.target.value] || nullPokemon, side)}
                >
                    <option value="" className="bg-gray-800">
                        Select Pokémon
                    </option>
                    {Object.values(pokemon).map((p) => (
                        <option key={p.id} value={p.id} className="bg-gray-800">
                            {p.name}
                        </option>
                    ))}
                </select>
            </>
        );
    }

    function pokemonStats(side: Side) {
        return !isNull(getPokemon[side]) ? (
            <div className="space-y-6">
                {/* Pokemon type */}
                <p className="text-center">
                    {getPokemon[side].type2
                        ? getPokemon[side].type1 + " / " + getPokemon[side].type2
                        : getPokemon[side].type1}
                </p>

                {/* Level input */}
                <div className="text-center">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Level</label>
                    <input
                        type="number"
                        min="1"
                        max="70"
                        className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 text-gray-200 focus:ring-blue-500 focus:border-blue-500 text-center"
                        value={getLevel[side]}
                        onChange={(e) => handleLevel(parseInt(e.target.value) || DEFAULT_LEVEL, side)}
                    />
                </div>

                {/* Stats with perfect alignment */}
                <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-3 text-center">Stats</h3>
                    <div className="space-y-3">
                        {safeKeys(getPokemon[side].stats).map((statName) => {
                            const styleName = styleFromStat(statName);
                            return (
                                <div key={statName} className="flex items-center justify-between px-2">
                                    <span className="text-gray-300 w-16 text-right">{statName.toUpperCase()}</span>
                                    <span className="text-gray-400 w-12 text-center">
                                        {getCalculatedStats[side][statName]}
                                    </span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="20"
                                        className="w-16 px-2 py-1 rounded-md bg-gray-700 border border-gray-600 text-gray-200 focus:ring-blue-500 focus:border-blue-500 text-center"
                                        value={getStylePoints[side][styleName]}
                                        onChange={(e) =>
                                            handleStylePoints(
                                                {
                                                    ...getStylePoints[side],
                                                    [styleName]: parseInt(e.target.value) || 0,
                                                },
                                                side
                                            )
                                        }
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        ) : (
            ""
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Centered title */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-blue-400 mb-2">Pokémon Tectonic Damage Calculator</h1>
                </div>

                {/* Calculator container */}
                <div className="flex justify-center">
                    <div className="w-full max-w-6xl bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700">
                        <div className="flex flex-col md:flex-row">
                            {/* Player's Pokemon Section - Perfectly centered */}
                            <div className="flex-1 p-6 bg-gray-800 border-b md:border-b-0 md:border-r border-gray-700">
                                <div className="flex flex-col items-center">
                                    {" "}
                                    {/* Added centering container */}
                                    <h2 className="text-xl font-semibold mb-6 text-blue-400">Your Pokémon</h2>
                                    <div className="w-full max-w-xs space-y-6">
                                        {pokemonSelect("player")}
                                        {pokemonStats("player")}
                                        {/* Move selection */}
                                        {!isNull(playerPokemon) && (
                                            <div className="text-center">
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    Move
                                                </label>
                                                <select
                                                    className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 text-gray-200 focus:ring-blue-500 focus:border-blue-500 text-center"
                                                    value={playerMove.id}
                                                    onChange={(e) =>
                                                        setPlayerMove(moves[e.target.value] || nullPokemon)
                                                    }
                                                >
                                                    <option value="" className="bg-gray-800">
                                                        Select Move
                                                    </option>
                                                    {playerPokemon.moves.map((p) => (
                                                        <option key={p.id} value={p.id} className="bg-gray-800">
                                                            {p.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        {/* Move details */}
                                        {!isNull(playerMove) && (
                                            <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                                                <h3 className="text-sm font-medium text-gray-300 mb-3 text-center">
                                                    Move Details
                                                </h3>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                                    <div className="text-right text-gray-400">Name:</div>
                                                    <div className="text-left text-gray-200">{playerMove.name}</div>
                                                    <div className="text-right text-gray-400">Type:</div>
                                                    <div className="text-left text-gray-200">{playerMove.type}</div>
                                                    <div className="text-right text-gray-400">BP:</div>
                                                    <div className="text-left text-gray-200">{playerMove.bp}</div>
                                                    <div className="text-right text-gray-400">Category:</div>
                                                    <div className="text-left text-gray-200">{playerMove.category}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Results Section */}
                            <div className="flex-1 p-6 bg-gray-800 border-b md:border-b-0 md:border-x border-gray-700">
                                <div className="h-full flex flex-col items-center justify-center">
                                    {isReadyToCalculate() ? (
                                        <div className="w-full max-w-xs">
                                            <div className="bg-gray-700 p-6 rounded-lg border border-gray-600 text-center">
                                                <h3 className="font-medium text-lg text-white mb-4">
                                                    Damage Calculation
                                                </h3>
                                                <div className="space-y-4">
                                                    <p className="text-3xl font-bold text-green-400">
                                                        {damageResult.damage}
                                                    </p>
                                                    <p className="text-gray-300">
                                                        {(damageResult.percentage * 100).toFixed(2)}% of opponent&apos;s
                                                        HP
                                                    </p>
                                                    <p className="text-gray-300">{damageResult.hits} hits to KO</p>
                                                    {/* Effectiveness message */}
                                                    {damageResult.typeEffectMult === 4 && (
                                                        <p className="text-pink-400 font-bold">Hyper Effective!</p>
                                                    )}
                                                    {damageResult.typeEffectMult === 2 && (
                                                        <p className="text-green-400 font-bold">Super Effective!</p>
                                                    )}
                                                    {damageResult.typeEffectMult === 0.5 && (
                                                        <p className="text-red-400 font-bold">Not Very Effective!</p>
                                                    )}
                                                    {damageResult.typeEffectMult === 0.25 && (
                                                        <p className="text-gray-400 font-bold">Barely Effective!</p>
                                                    )}
                                                    {damageResult.typeEffectMult === 0 && (
                                                        <p className="text-gray-500 font-bold shadow-md">
                                                            Not Effective!
                                                        </p>
                                                    )}
                                                    {/* Fixed health bar */}
                                                    <div className="mt-4 relative">
                                                        <div className="h-4 bg-gray-600 rounded-full overflow-hidden relative">
                                                            <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"></div>
                                                            <div
                                                                className="absolute inset-0 bg-gray-800 rounded-left transition-all duration-300"
                                                                style={{
                                                                    left: `${
                                                                        100 -
                                                                        Math.min(100, damageResult.percentage * 100)
                                                                    }%`,
                                                                }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-500 p-8">
                                            <p>Select Pokémon and moves to see damage calculation</p>
                                        </div>
                                    )}
                                    <h2 className="text-xl font-semibold mb-6 text-purple-400">Field Status</h2>
                                    <div className="mt-6">
                                        <label className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                checked={multiBattle}
                                                className="form-checkbox h-5 w-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                                                onChange={() => setMultiBattle(!multiBattle)}
                                            />
                                            <span className="text-gray-300">Multi Battle</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Opponent's Pokemon Section - Perfectly centered */}
                            <div className="flex-1 p-6 bg-gray-800 border-t md:border-t-0 md:border-l border-gray-700">
                                <div className="flex flex-col items-center">
                                    {" "}
                                    {/* Added centering container */}
                                    <h2 className="text-xl font-semibold mb-6 text-red-400">Opponent&apos;s Pokémon</h2>
                                    <div className="w-full max-w-xs space-y-6">
                                        {pokemonSelect("opponent")}

                                        {pokemonStats("opponent")}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PokemonDamageCalculator;
