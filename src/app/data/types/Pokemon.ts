import { abilities } from "../abilities";
import { PokemonTribe, PokemonType, pokemonTypes } from "../basicData";
import { PokemonForm } from "../forms";
import { LoadedPokemon } from "../loading/pokemon";
import { moves } from "../moves";
import { pokemon } from "../pokemon";
import { typeChart } from "../typeChart";
import { Ability } from "./Ability";
import { Move } from "./Move";

export interface Evolution {
    target: string;
    method: string;
    param: string;
    prevo: boolean;
}

export interface Stats {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
    spatk: number;
    spdef: number;
}

export const blankStats: Stats = {
    hp: 0,
    attack: 0,
    defense: 0,
    speed: 0,
    spatk: 0,
    spdef: 0,
};

function uniq<T>(a: T[]) {
    return a.filter((item, pos, self) => self.indexOf(item) == pos);
}

function getterFactory<T extends keyof Pokemon>(mon: Pokemon, key: T) {
    return function (form: number = -1) {
        if (form in mon.forms && mon.forms[form][key] !== undefined) {
            return mon.forms[form][key];
        }
        return mon[key];
    };
}

export class Pokemon {
    id: string;
    dex: number;
    name: string;
    formName?: string;
    type1: PokemonType;
    type2?: PokemonType;
    stats: Stats;
    abilities: Ability[];
    levelMoves: [number, Move][];
    lineMoves: Move[];
    tutorMoves: Move[];
    tribes: PokemonTribe[];
    height: number;
    weight: number;
    kind: string;
    pokedex: string;
    evos: Evolution[];
    forms: PokemonForm[] = [];
    constructor(mon: LoadedPokemon, dexNo: number) {
        this.id = mon.key;
        this.dex = dexNo;
        this.name = mon.name;
        if (mon.formName !== null) {
            this.formName = mon.formName;
        }
        this.type1 = mon.type1 as PokemonType;
        if (mon.type2 !== null) {
            this.type2 = mon.type2 as PokemonType;
        }
        this.stats = {
            hp: mon.hp,
            attack: mon.attack,
            spatk: mon.spAttack,
            speed: mon.speed,
            defense: mon.defense,
            spdef: mon.spDefense,
        };
        this.abilities = mon.abilities.map((a) => abilities[a]);
        this.levelMoves = Object.entries(mon.levelMoves).map(([id, level]) => [level, moves[id]]);
        this.lineMoves = [];
        if (mon.lineMoves !== null) {
            this.lineMoves = mon.lineMoves.map((m) => moves[m]);
        }
        this.tutorMoves = [];
        if (mon.tutorMoves !== null) {
            this.tutorMoves = mon.tutorMoves.map((m) => moves[m]);
        }
        this.tribes = [];
        if (mon.tribes !== null) {
            this.tribes = mon.tribes as PokemonTribe[];
        }
        this.height = mon.height;
        this.weight = mon.weight;
        this.kind = mon.kind;
        this.pokedex = mon.pokedex;
        this.evos = [];
        if (mon.evolutions !== null) {
            this.evos = mon.evolutions.map((e) => {
                return { target: e.pokemon, method: e.method, param: e.condition, prevo: false };
            });
        }
    }

    public addForms(forms: PokemonForm[]) {
        this.forms = this.forms.concat(forms);
    }

    public allMoves(currentForm: number = 0): Move[] {
        const flatLevelMoves = this.getLevelMoves(currentForm).map((m) => m[1]);
        return uniq(flatLevelMoves.concat(this.lineMoves, this.tutorMoves));
    }

    public hasType(type: PokemonType): boolean {
        return this.type1 === type || this.type2 === type;
    }

    public BST(currentForm: number = 0): number {
        const stats = this.getStats(currentForm);
        return stats.hp + stats.attack + stats.defense + stats.spatk + stats.spdef + stats.speed;
    }

    public getPrevos(): Evolution[] {
        return this.evos.filter((e) => e.prevo);
    }

    public getEvos(): Evolution[] {
        return this.evos.filter((e) => !e.prevo);
    }

    public getDeepEvos(): Evolution[] {
        let allEvos = this.getEvos();
        if (allEvos.length === 0) {
            return [];
        }
        for (const evo of this.getEvos()) {
            const mon = pokemon[evo.target];
            const monEvos = mon.getDeepEvos();
            allEvos = allEvos.concat(monEvos);
        }
        return allEvos;
    }

    public getFormName = getterFactory(this, "formName");
    public getType1 = getterFactory(this, "type1");
    public getType2 = getterFactory(this, "type2");
    public getAbilities = getterFactory(this, "abilities");
    public getStats = getterFactory(this, "stats");
    public getPokedex = getterFactory(this, "pokedex");
    public getLevelMoves = getterFactory(this, "levelMoves");

    public getImage(currentForm: number = 0) {
        return "/Pokemon/" + this.id + (currentForm > 0 ? "_" + this.forms[currentForm].formId : "") + ".png";
    }

    public defMatchups(currentForm: number = 0) {
        return Object.fromEntries(
            pokemonTypes.map((t) => {
                const type2 = this.getType2(currentForm);
                return [t, typeChart[t][this.getType1(currentForm)] * (type2 ? typeChart[t][type2] : 1)];
            })
        );
    }

    public atkMatchups(currentForm: number = 0) {
        return Object.fromEntries(
            pokemonTypes.map((t) => {
                const type2 = this.getType2(currentForm);
                return [t, Math.max(typeChart[this.getType1(currentForm)][t], type2 ? typeChart[type2][t] : 0)];
            })
        );
    }
}
