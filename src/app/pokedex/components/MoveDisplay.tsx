"use client";

import { nullMove } from "@/app/data/moves";
import { Move } from "@/app/data/types/Move";
import { Pokemon } from "@/app/data/types/Pokemon";
import { isNull } from "@/app/data/util";
import TypeBadge from "@/components/TypeBadge";
import { useState } from "react";

export default function MoveDisplay({ pokemon, moveKey }: { pokemon: Pokemon; moveKey: "level" | "tutor" }) {
    const [selectedMove, setSelectedMove] = useState<Move>(nullMove);
    const moves =
        moveKey === "level" ? pokemon.level_moves.map((m) => m[1]) : pokemon.line_moves.concat(pokemon.tutor_moves);
    const levels = moveKey === "level" ? pokemon.level_moves.map((m) => m[0]) : [];
    return (
        <>
            <div className="flex">
                {/* Moves List */}
                <div className="w-1/2 max-h-64 overflow-y-auto">
                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-300">
                        {moves.map((move, index) => (
                            <li
                                key={index}
                                className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                                onMouseEnter={() => setSelectedMove(move)}
                                onClick={() => setSelectedMove(move)}
                            >
                                {levels.length > 0 ? (levels[index] === 0 ? "E: " : `${levels[index]}: `) : ""}
                                <span className={move.isSTAB(pokemon) ? "font-semibold" : ""}>{move.name}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Move Details */}
                <div className="w-1/2 pl-4">
                    {!isNull(selectedMove) ? (
                        <div>
                            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                                {selectedMove.name}
                            </h4>
                            <p className="text-gray-600 dark:text-gray-300">{selectedMove.description}</p>
                            <div className="mt-2 text-gray-600 dark:text-gray-300">
                                <span className="font-semibold">Type:</span> <TypeBadge type1={selectedMove.type} />
                            </div>
                            <p className="mt-2 text-gray-600 dark:text-gray-300">
                                <span className="font-semibold">Category:</span> {selectedMove.category}
                            </p>
                            <p className="mt-2 text-gray-600 dark:text-gray-300">
                                <span className="font-semibold">Power:</span> {selectedMove.bp || "—"}
                            </p>
                            <p className="mt-2 text-gray-600 dark:text-gray-300">
                                <span className="font-semibold">Accuracy:</span> {selectedMove.accuracy || "—"}
                            </p>
                            <p className="mt-2 text-gray-600 dark:text-gray-300">
                                <span className="font-semibold">PP:</span> {selectedMove.pp}
                            </p>
                        </div>
                    ) : (
                        <p className="text-gray-600 dark:text-gray-300">Hover over or click a move to see details.</p>
                    )}
                </div>
            </div>
        </>
    );
}
