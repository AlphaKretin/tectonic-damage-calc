"use client";

import InternalLink from "@/components/InternalLink";
import type { NextPage } from "next";
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { pokemon } from "../data/pokemon";
import { Pokemon } from "../data/types/Pokemon";
import PokemonFilter, { PokemonFilterType } from "./components/PokemonFilter";
import PokemonModal from "./components/PokemonModal";
import PokemonTable from "./components/PokemonTable";

export interface PokemonTableProps {
    mons: Pokemon[];
    onRowClick: (pokemon: Pokemon) => void;
}

const Home: NextPage = () => {
    const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
    const [filters, setFilters] = useState<PokemonFilterType[]>([]);

    const mons = Object.values(pokemon);
    const filteredPokemon = useMemo(() => {
        const filtered = mons.filter((mon) => {
            return filters.every((filter) => {
                return filter.apply(mon, filter.value);
            });
        });
        return filtered;
    }, [filters, mons]);

    useEffect(() => {
        if (selectedPokemon) {
            document.body.style.overflow = "hidden"; // Disable scrolling
        } else {
            document.body.style.overflow = ""; // Re-enable scrolling
        }
    }, [selectedPokemon]);

    const handleRowClick = (pokemon: Pokemon) => {
        setSelectedPokemon(pokemon);
    };

    const handleCloseModal = () => {
        setSelectedPokemon(null);
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <Head>
                <title>Pokémon Tectonic Online Pokédex</title>
                <meta name="description" content="View Pokémon data for the fangame Pokémon Tectonic" />
            </Head>

            <main className="container mx-auto py-8 px-4">
                <div className="flex flex-col justify-center items-center mb-10 relative">
                    <h1 className="text-3xl font-bold text-center mb-8 text-blue-800 dark:text-blue-300">
                        Pokémon Tectonic Online Pokédex
                    </h1>
                    <p>
                        <InternalLink url="../">Return to homepage</InternalLink>
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-4">
                    <PokemonFilter onChangeFilters={setFilters} />
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <PokemonTable mons={filteredPokemon} onRowClick={handleRowClick} />
                </div>
            </main>

            {selectedPokemon && <PokemonModal pokemon={selectedPokemon} onClose={handleCloseModal} />}
        </div>
    );
};

export default Home;
