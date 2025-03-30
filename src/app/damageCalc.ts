import { PokemonType } from "./data/basicData";
import { MultiHitMove } from "./data/moves/MultiHitMove";
import { StatusEffect } from "./data/statusEffects";
import { typeChart } from "./data/typeChart";
import { Move } from "./data/types/Move";
import { Pokemon, Stats } from "./data/types/Pokemon";

export interface CalcPokemon extends Pokemon {
    level: number;
    status: StatusEffect;
}

export interface DamageResult {
    damage: number;
    percentage: number;
    hits: number;
    typeEffectMult: number;
    minTotal?: number;
    maxTotal?: number;
    minPercentage?: number;
    maxPercentage?: number;
}

export interface BattleState {
    multiBattle: boolean;
    criticalHit: boolean;
}

export function calculateDamage(
    move: Move,
    user: CalcPokemon,
    target: CalcPokemon,
    battleState: BattleState
): DamageResult {
    if (move.category === "Status") return { damage: 0, percentage: 0, hits: 0, typeEffectMult: 0 };

    // TODO: Handle abilities
    // if (target.damageState.disguise) {
    //     target.damageState.calcDamage = 1;
    //     return;
    // }

    // Get the move's type
    const type = move.type; // TODO: implement moves that can change type

    // Calculate base power of move
    const baseDmg = move.getPower(user);

    // In vanilla Tectonic, critical hit determination happens here
    // However, for calculation, it's determined by the UI

    // Calculate the actual damage dealt, and assign it to the damage state for tracking
    const [damage, typeEffectMult] = calculateDamageForHit(move, user, target, type, baseDmg, battleState);
    const percentage = damage / target.stats.hp;
    const hits = Math.ceil(1 / percentage);
    if (move instanceof MultiHitMove) {
        const minTotal = damage * move.minHits;
        const maxTotal = damage * move.maxHits;
        return {
            damage,
            percentage,
            hits,
            typeEffectMult,
            minTotal,
            maxTotal,
            minPercentage: minTotal / target.stats.hp,
            maxPercentage: maxTotal / target.stats.hp,
        };
    }
    return { damage, percentage, hits, typeEffectMult };
}

function calculateDamageForHit(
    move: Move,
    user: CalcPokemon,
    target: CalcPokemon,
    type: PokemonType,
    baseDmg: number,
    battleState: BattleState
): [number, number] {
    // Get the relevant attacking and defending stat values (after steps)
    const [attack, defense] = damageCalcStats(move, user, target);

    // Calculate all multiplier effects
    const [multipliers, typeEffectMult] = calcDamageMultipliers(move, user, target, battleState, type);

    // Main damage calculation
    let finalCalculatedDamage = calcDamageWithMultipliers(baseDmg, attack, defense, user.level, multipliers);
    finalCalculatedDamage = Math.max(Math.round(finalCalculatedDamage * multipliers.final_damage_multiplier), 1);
    finalCalculatedDamage = flatDamageReductions(finalCalculatedDamage);

    // TODO: Handle abilities
    // // Delayed Reaction
    // if (!battle.moldBreaker && target.shouldAbilityApply("DELAYEDREACTION", aiCheck)) {
    //     const delayedDamage = Math.floor(finalCalculatedDamage * 0.33);
    //     finalCalculatedDamage -= delayedDamage;
    //     if (delayedDamage > 0 && !aiCheck) {
    //         if (!target.effectActive("DelayedReaction")) {
    //             target.effects.DelayedReaction = [];
    //         }
    //         target.effects.DelayedReaction.push([2, delayedDamage]);
    //     }
    // }

    // TODO: Handle avatar logic
    // if (target.boss()) {
    //     // All damage up to the phase lower health bound is unmodified
    //     const unmodifiedDamage = Math.min(target.hp - target.avatarPhaseLowerHealthBound, finalCalculatedDamage);
    //     const modifiedDamage = finalCalculatedDamage - Math.max(unmodifiedDamage, 0);
    //     finalCalculatedDamage = unmodifiedDamage + Math.floor(modifiedDamage * (1 - AVATAR_OVERKILL_RESISTANCE));
    // }

    return [finalCalculatedDamage, typeEffectMult];
}

function calcDamageWithMultipliers(
    baseDmg: number,
    attack: number,
    defense: number,
    userLevel: number,
    multipliers: DamageMultipliers
): number {
    baseDmg = Math.max(Math.round(baseDmg * multipliers.base_damage_multiplier), 1);
    attack = Math.max(Math.round(attack * multipliers.attack_multiplier), 1);
    defense = Math.max(Math.round(defense * multipliers.defense_multiplier), 1);
    return calcBasicDamage(baseDmg, userLevel, attack, defense);
}

function calcBasicDamage(
    baseDamage: number,
    attackerLevel: number,
    userAttackingStat: number,
    targetDefendingStat: number
): number {
    const pseudoLevel = 15.0 + attackerLevel / 2.0;
    const levelMultiplier = 2.0 + 0.4 * pseudoLevel;
    return Math.floor(2.0 + (levelMultiplier * baseDamage * userAttackingStat) / targetDefendingStat / 50.0);
}

function damageCalcStats(move: Move, user: CalcPokemon, target: CalcPokemon): [number, number] {
    // Calculate user's attack stat
    // TODO: implement moves like foul play or body press
    const attacking_stat_holder = user;
    const attacking_stat: keyof Stats = move.category === "Physical" ? "attack" : "spatk";

    // TODO: implement abilities and weather
    // if (user.shouldAbilityApply("MALICIOUSGLOW", aiCheck) && battle.moonGlowing()) {
    //     attacking_stat_holder = target;
    // }

    // TODO: implement stat steps
    //let attack_step = attacking_stat_holder.steps[attacking_stat];

    // TODO: Critical hits ignore negative attack steps
    // attack_step = 0 if critical && attack_step < 0;
    // attack_step = 0 if target.hasActiveAbility("UNAWARE") && !battle.moldBreaker;
    const attack = attacking_stat_holder.stats[attacking_stat];

    // Calculate target's defense stat
    const defending_stat_holder = target;
    const defending_stat: keyof Stats = move.category === "Physical" ? "defense" : "spdef";
    // TODO: implement stat steps
    // let defense_step = defending_stat_holder.steps[defending_stat];
    // if (defense_step > 0 &&
    //     (ignoresDefensiveStepBoosts(user, target) || user.hasActiveAbility("INFILTRATOR") || critical)) {
    //     defense_step = 0;
    // }
    // defense_step = 0 if user.hasActiveAbility("UNAWARE");
    const defense = defending_stat_holder.stats[defending_stat];

    return [attack, defense];
}

// function pbCalcAbilityDamageMultipliers(
//     user: CalcPokemon,
//     target: CalcPokemon,
//     type: PokemonType,
//     baseDmg: number,
//     multipliers: DamageMultipliers,
//     aiCheck: boolean = false
// ): void {
//     // Global abilities
//     if (
//         (battle.pbCheckGlobalAbility("DARKAURA") && type === "DARK") ||
//         (battle.pbCheckGlobalAbility("FAIRYAURA") && type === "FAIRY")
//     ) {
//         if (battle.pbCheckGlobalAbility("AURABREAK")) {
//             multipliers.base_damage_multiplier *= 2 / 3.0;
//         } else {
//             multipliers.base_damage_multiplier *= 4 / 3.0;
//         }
//     }
//     if (battle.pbCheckGlobalAbility("RUINOUS")) {
//         multipliers.base_damage_multiplier *= 1.4;
//     }

//     // User or user ally ability effects that alter damage
//     user.eachAbilityShouldApply(aiCheck, (ability: any) => {
//         BattleHandlers.triggerDamageCalcUserAbility(ability, user, target, this, multipliers, baseDmg, type, aiCheck);
//     });
//     user.eachAlly((b: any) => {
//         b.eachAbilityShouldApply(aiCheck, (ability: any) => {
//             BattleHandlers.triggerDamageCalcUserAllyAbility(
//                 ability,
//                 user,
//                 target,
//                 this,
//                 multipliers,
//                 baseDmg,
//                 type,
//                 aiCheck
//             );
//         });
//     });

//     // Target or target ally ability effects that alter damage
//     if (!battle.moldBreaker) {
//         target.eachAbilityShouldApply(aiCheck, (ability: any) => {
//             BattleHandlers.triggerDamageCalcTargetAbility(
//                 ability,
//                 user,
//                 target,
//                 this,
//                 multipliers,
//                 baseDmg,
//                 type,
//                 aiCheck
//             );
//         });
//         target.eachAlly((b: any) => {
//             b.eachAbilityShouldApply(aiCheck, (ability: any) => {
//                 BattleHandlers.triggerDamageCalcTargetAllyAbility(
//                     ability,
//                     user,
//                     target,
//                     this,
//                     multipliers,
//                     baseDmg,
//                     type,
//                     aiCheck
//                 );
//             });
//         });
//     }
// }

// function pbCalcWeatherDamageMultipliers(
//     user: any,
//     target: any,
//     type: any,
//     multipliers: any,
//     checkingForAI: boolean = false
// ): void {
//     const weather = battle.pbWeather();
//     switch (weather) {
//         case "Sunshine":
//         case "HarshSun":
//             if (type === "FIRE") {
//                 let damageBonus = weather === "HarshSun" ? 0.5 : 0.3;
//                 if (battle.curseActive("CURSE_BOOSTED_SUN")) {
//                     damageBonus *= 2;
//                 }
//                 multipliers.final_damage_multiplier *= 1 + damageBonus;
//             } else if (applySunDebuff(user, type, checkingForAI)) {
//                 let damageReduction = 0.15;
//                 if (battle.pbCheckGlobalAbility("BLINDINGLIGHT")) {
//                     damageReduction *= 2;
//                 }
//                 if (battle.curseActive("CURSE_BOOSTED_SUN")) {
//                     damageReduction *= 2;
//                 }
//                 multipliers.final_damage_multiplier *= 1 - damageReduction;
//             }
//             break;
//         case "Rainstorm":
//         case "HeavyRain":
//             if (type === "WATER") {
//                 let damageBonus = weather === "HeavyRain" ? 0.5 : 0.3;
//                 if (battle.curseActive("CURSE_BOOSTED_RAIN")) {
//                     damageBonus *= 2;
//                 }
//                 multipliers.final_damage_multiplier *= 1 + damageBonus;
//             } else if (applyRainDebuff(user, type, checkingForAI)) {
//                 let damageReduction = 0.15;
//                 if (battle.pbCheckGlobalAbility("DREARYCLOUDS")) {
//                     damageReduction *= 2;
//                 }
//                 if (battle.curseActive("CURSE_BOOSTED_RAIN")) {
//                     damageReduction *= 2;
//                 }
//                 multipliers.final_damage_multiplier *= 1 - damageReduction;
//             }
//             break;
//         case "Eclipse":
//         case "RingEclipse":
//             if (type === "PSYCHIC" || (type === "DRAGON" && weather === "RingEclipse")) {
//                 const damageBonus = weather === "RingEclipse" ? 0.5 : 0.3;
//                 multipliers.final_damage_multiplier *= 1 + damageBonus;
//             }

//             if (battle.pbCheckOpposingAbility("DISTRESSING", user.index)) {
//                 multipliers.final_damage_multiplier *= 0.8;
//             }
//             break;
//         case "Moonglow":
//         case "BloodMoon":
//             if (type === "FAIRY" || (type === "DARK" && weather === "BloodMoon")) {
//                 const damageBonus = weather === "BloodMoon" ? 0.5 : 0.3;
//                 multipliers.final_damage_multiplier *= 1 + damageBonus;
//             }
//             break;
//     }
// }

function pbCalcStatusesDamageMultipliers(
    move: Move,
    user: CalcPokemon,
    target: CalcPokemon,
    multipliers: DamageMultipliers
): DamageMultipliers {
    // TODO: Handle abilities
    // const toil = battle.pbCheckOpposingAbility("TOILANDTROUBLE", user.index);
    // Burn
    if (
        user.status === "Burn" &&
        move.category === "Physical" &&
        !move.ignoreStatus("Burn")
        //!user.shouldAbilityApply("BURNHEAL", checkingForAI)
    ) {
        let damageReduction = 1.0 / 3.0;
        // TODO: Handle avatars
        // if (user.boss() && AVATAR_DILUTED_STATUS_CONDITIONS) {
        //     damageReduction = 1.0 / 5.0;
        // }
        // TODO: Handle curses
        // if (user.pbOwnedByPlayer() && battle.curseActive("CURSE_STATUS_DOUBLED")) {
        //     damageReduction *= 2;
        // }
        // TODO: Handle abilities
        // if (toil) {
        //     damageReduction *= 1.5;
        // }
        // if (user.hasActiveAbility("CLEANFREAK")) {
        //     damageReduction *= 2;
        // }
        damageReduction = Math.min(damageReduction, 1);
        multipliers.final_damage_multiplier *= 1.0 - damageReduction;
    }
    // Frostbite
    if (
        user.status === "Frostbite" &&
        move.category === "Special" &&
        !move.ignoreStatus("Frostbite")
        //!user.shouldAbilityApply("FROSTHEAL", checkingForAI)
    ) {
        let damageReduction = 1.0 / 3.0;
        // if (user.boss() && AVATAR_DILUTED_STATUS_CONDITIONS) {
        //     damageReduction = 1.0 / 5.0;
        // }
        // if (user.pbOwnedByPlayer() && battle.curseActive("CURSE_STATUS_DOUBLED")) {
        //     damageReduction *= 2;
        // }
        // if (toil) {
        //     damageReduction *= 1.5;
        // }
        // if (user.hasActiveAbility("CLEANFREAK")) {
        //     damageReduction *= 2;
        // }
        damageReduction = Math.min(damageReduction, 1);
        multipliers.final_damage_multiplier *= 1.0 - damageReduction;
    }
    // Numb
    if (user.status === "Numb") {
        let damageReduction = 1.0 / 4.0;
        // if (user.boss() && AVATAR_DILUTED_STATUS_CONDITIONS) {
        //     damageReduction = 3.0 / 20.0;
        // }
        // if (user.pbOwnedByPlayer() && battle.curseActive("CURSE_STATUS_DOUBLED")) {
        //     damageReduction *= 2;
        // }
        // if (toil) {
        //     damageReduction *= 1.5;
        // }
        // if (user.hasActiveAbility("CLEANFREAK")) {
        //     damageReduction *= 2;
        // }
        damageReduction = Math.min(damageReduction, 1);
        multipliers.final_damage_multiplier *= 1.0 - damageReduction;
    }
    // Dizzy
    if (
        target.status === "Dizzy"
        //!target.shouldAbilityApply(["MARVELSKIN", "MARVELSCALE"], checkingForAI)
    ) {
        const damageIncrease = 1.0 / 4.0;
        // if (target.boss() && AVATAR_DILUTED_STATUS_CONDITIONS) {
        //     damageIncrease = 3.0 / 20.0;
        // }
        // if (target.pbOwnedByPlayer() && battle.curseActive("CURSE_STATUS_DOUBLED")) {
        //     damageIncrease *= 2;
        // }
        // if (target.hasActiveAbility("CLEANFREAK")) {
        //     damageIncrease *= 2;
        // }
        multipliers.final_damage_multiplier *= 1.0 + damageIncrease;
        // Waterlog
    }
    if (
        target.status === "Waterlog"
        //!target.shouldAbilityApply(["MARVELSKIN", "MARVELSCALE"], checkingForAI)
    ) {
        const damageIncrease = 1.0 / 4.0;
        // if (target.boss() && AVATAR_DILUTED_STATUS_CONDITIONS) {
        //     damageIncrease = 3.0 / 20.0;
        // }
        // if (target.pbOwnedByPlayer() && battle.curseActive("CURSE_STATUS_DOUBLED")) {
        //     damageIncrease *= 2;
        // }
        // if (target.hasActiveAbility("CLEANFREAK")) {
        //     damageIncrease *= 2;
        // }
        multipliers.final_damage_multiplier *= 1.0 + damageIncrease;
    }

    // Fracture
    if (user.status === "Fracture") {
        multipliers.final_damage_multiplier *= 0.66;
    }
    return multipliers;
}

// function pbCalcProtectionsDamageMultipliers(
//     user: any,
//     target: any,
//     multipliers: any,
//     checkingForAI: boolean = false
// ): void {
//     // Aurora Veil, Reflect, Light Screen
//     if (!ignoresReflect() && !target.damageState.critical && !user.ignoreScreens(checkingForAI)) {
//         if (target.pbOwnSide.effectActive("AuroraVeil")) {
//             if (battle.pbSideBattlerCount(target) > 1) {
//                 multipliers.final_damage_multiplier *= 2 / 3.0;
//             } else {
//                 multipliers.final_damage_multiplier *= 0.5;
//             }
//         } else if (target.pbOwnSide.effectActive("Reflect") && physicalMove()) {
//             if (battle.pbSideBattlerCount(target) > 1) {
//                 multipliers.final_damage_multiplier *= 2 / 3.0;
//             } else {
//                 multipliers.final_damage_multiplier *= 0.5;
//             }
//         } else if (target.pbOwnSide.effectActive("LightScreen") && specialMove()) {
//             if (battle.pbSideBattlerCount(target) > 1) {
//                 multipliers.final_damage_multiplier *= 2 / 3.0;
//             } else {
//                 multipliers.final_damage_multiplier *= 0.5;
//             }
//         } else if (target.pbOwnSide.effectActive("DiamondField")) {
//             if (battle.pbSideBattlerCount(target) > 1) {
//                 multipliers.final_damage_multiplier *= 3 / 4.0;
//             } else {
//                 multipliers.final_damage_multiplier *= 2 / 3.0;
//             }
//         }

//         // Repulsion Field
//         if (baseDamage >= 100 && target.pbOwnSide.effectActive("RepulsionField")) {
//             if (battle.pbSideBattlerCount(target) > 1) {
//                 multipliers.final_damage_multiplier *= 2 / 3.0;
//             } else {
//                 multipliers.final_damage_multiplier *= 0.5;
//             }
//         }
//     }
//     // Partial protection moves
//     if (target.effectActive(["StunningCurl", "RootShelter", "VenomGuard"])) {
//         multipliers.final_damage_multiplier *= 0.5;
//     }
//     if (target.effectActive("EmpoweredDetect")) {
//         multipliers.final_damage_multiplier *= 0.5;
//     }
//     if (target.pbOwnSide.effectActive("Bulwark")) {
//         multipliers.final_damage_multiplier *= 0.5;
//     }
//     // For when bosses are partway piercing protection
//     if (target.damageState.partiallyProtected) {
//         multipliers.final_damage_multiplier *= 0.5;
//     }
// }

function pbCalcTypeBasedDamageMultipliers(
    user: CalcPokemon,
    target: CalcPokemon,
    type: PokemonType,
    multipliers: DamageMultipliers
): [DamageMultipliers, number] {
    let stabActive = false;
    // TODO: handle abilities
    // if (user.shouldAbilityApply("IMPRESSIONABLE", checkingForAI)) {
    //     let anyPartyMemberHasType = false;
    //     user.ownerParty.forEach((partyMember: any) => {
    //         if (partyMember.personalID !== user.personalID && type && partyMember.hasType(type)) {
    //             anyPartyMemberHasType = true;
    //         }
    //     });
    //     stabActive = anyPartyMemberHasType;
    // } else {
    stabActive = type && (user.type1 === type || user.type2 === type);
    //}
    // TODO: Handle curses
    // stabActive = stabActive && !(user.pbOwnedByPlayer() && battle.curses.includes("DULLED"));
    // TODO: handle abilities
    // stabActive = stabActive && !battle.pbCheckGlobalAbility("SIGNALJAM");

    // STAB
    if (stabActive) {
        const stab = 1.5;
        // TODO: Handle abilities
        // if (user.shouldAbilityApply("ADAPTED", checkingForAI)) {
        //     stab *= 4.0 / 3.0;
        // } else if (user.shouldAbilityApply("ULTRAADAPTED", checkingForAI)) {
        //     stab *= 3.0 / 2.0;
        // }
        multipliers.final_damage_multiplier *= stab;
    }

    // Type effectiveness
    // TODO: Handle moves that modify type
    // const typeMod = target.typeMod(type, target, this, checkingForAI);
    let effectiveness = typeChart[type][target.type1];
    if (target.type2) {
        effectiveness *= typeChart[type][target.type2];
    }
    multipliers.final_damage_multiplier *= effectiveness;

    // TODO: Misc effects like Charge
    // if (user.effectActive("Charge") && type === "ELECTRIC") {
    //     multipliers.base_damage_multiplier *= 2;
    //     if (!checkingForAI) {
    //         user.applyEffect("ChargeExpended");
    //     }
    // }

    // TODO: Volatile Toxin
    // if (target.effectActive("VolatileToxin") && type === "GROUND") {
    //     multipliers.base_damage_multiplier *= 2;
    // }

    // TODO: Turbulent Sky
    // if (user.pbOwnSide.effectActive("TurbulentSky")) {
    //     multipliers.final_damage_multiplier *= 1.3;
    // }
    return [multipliers, effectiveness];
}

// function pbCalcTribeBasedDamageMultipliers(
//     user: any,
//     target: any,
//     type: any,
//     multipliers: any,
//     checkingForAI: boolean = false
// ): void {
//     // Bushwacker tribe
//     if (user.hasTribeBonus("BUSHWACKER")) {
//         if (checkingForAI) {
//             const expectedTypeMod = battle.battleAI.pbCalcTypeModAI(type, user, target, this);
//             if (Effectiveness.resistant(expectedTypeMod)) {
//                 multipliers.final_damage_multiplier *= 1.5;
//             }
//         } else {
//             if (Effectiveness.resistant(target.damageState.typeMod)) {
//                 multipliers.final_damage_multiplier *= 1.5;
//             }
//         }
//     }

//     // Assassin tribe
//     if (user.hasTribeBonus("ASSASSIN") && user.firstTurn()) {
//         multipliers.final_damage_multiplier *= 1.2;
//     }

//     // Artillery tribe
//     if (user.hasTribeBonus("ARTILLERY") && !user.firstTurn()) {
//         multipliers.final_damage_multiplier *= 1.2;
//     }

//     // Mystic tribe
//     if (user.hasTribeBonus("MYSTIC") && user.lastRoundMoveType === 2) {
//         // Status
//         multipliers.final_damage_multiplier *= 1.25;
//     }

//     // Warrior tribe
//     if (user.hasTribeBonus("WARRIOR")) {
//         if (checkingForAI) {
//             const expectedTypeMod = battle.battleAI.pbCalcTypeModAI(type, user, target, this);
//             if (Effectiveness.super_effective(expectedTypeMod)) {
//                 multipliers.final_damage_multiplier *= 1.12;
//             }
//         } else {
//             if (Effectiveness.super_effective(target.damageState.typeMod)) {
//                 multipliers.final_damage_multiplier *= 1.12;
//             }
//         }
//     }

//     // Scavenger tribe
//     if (user.hasTribeBonus("SCAVENGER")) {
//         if (checkingForAI) {
//             if (user.hasGem()) {
//                 multipliers.final_damage_multiplier *= 1.25;
//             }
//         } else {
//             if (user.effectActive("GemConsumed")) {
//                 multipliers.final_damage_multiplier *= 1.25;
//             }
//         }
//     }

//     // Harmonic tribe
//     if (target.hasTribeBonus("HARMONIC")) {
//         multipliers.final_damage_multiplier *= 0.9;
//     }

//     // Charmer tribe
//     if (target.hasTribeBonus("CHARMER") && target.effectActive("SwitchedIn")) {
//         multipliers.final_damage_multiplier *= 0.8;
//     }

//     // Stampede tribe
//     if (target.hasTribeBonus("STAMPEDE") && target.effectActive("ChoseAttack")) {
//         multipliers.final_damage_multiplier *= 0.88;
//     }

//     // Noble tribe
//     if (target.hasTribeBonus("NOBLE") && target.effectActive("ChoseStatus")) {
//         multipliers.final_damage_multiplier *= 0.88;
//     }
// }

interface DamageMultipliers {
    base_damage_multiplier: number;
    attack_multiplier: number;
    defense_multiplier: number;
    final_damage_multiplier: number;
}

function calcDamageMultipliers(
    move: Move,
    user: CalcPokemon,
    target: CalcPokemon,
    battleState: BattleState,
    type: PokemonType
): [DamageMultipliers, number] {
    let multipliers: DamageMultipliers = {
        attack_multiplier: 1,
        base_damage_multiplier: 1,
        defense_multiplier: 1,
        final_damage_multiplier: 1,
    };
    // TODO: Handle abilities
    // multipliers = pbCalcAbilityDamageMultipliers(user, target, type, baseDmg, multipliers);
    // TODO: Handle weather
    // multipliers = pbCalcWeatherDamageMultipliers(user, target, type, multipliers);
    multipliers = pbCalcStatusesDamageMultipliers(move, user, target, multipliers);
    // TODO: Handle Protect-esque moves
    // multipliers = pbCalcProtectionsDamageMultipliers(user, target, multipliers);
    const typeResult = pbCalcTypeBasedDamageMultipliers(user, target, type, multipliers);
    multipliers = typeResult[0];
    const typeEffectMult = typeResult[1];
    // TODO: Handle tribes
    // multipliers = pbCalcTribeBasedDamageMultipliers(user, target, type, multipliers);

    // TODO: Item effects that alter damage
    // user.eachItemShouldApply(aiCheck, (item: any) => {
    //     BattleHandlers.triggerDamageCalcUserItem(item, user, target, this, multipliers, baseDmg, type, aiCheck);
    // });
    // target.eachItemShouldApply(aiCheck, (item: any) => {
    //     BattleHandlers.triggerDamageCalcTargetItem(item, user, target, this, multipliers, baseDmg, type, aiCheck);
    // });

    // TODO: Misc effects
    // if (target.effectActive("DeathMark")) {
    //     multipliers.final_damage_multiplier *= 1.5;
    // }

    // // Parental Bond's second attack
    // if (user.effects.ParentalBond === 1) {
    //     multipliers.base_damage_multiplier *= 0.25;
    // }
    // // Me First
    // if (user.effectActive("MeFirst")) {
    //     multipliers.base_damage_multiplier *= 1.5;
    // }
    // // Helping Hand
    // if (user.effectActive("HelpingHand") && !(this instanceof PokeBattle_Confusion)) {
    //     multipliers.base_damage_multiplier *= 1.5;
    // }
    // // Helping Hand
    // if (user.effectActive("Spotting") && !(this instanceof PokeBattle_Confusion)) {
    //     multipliers.base_damage_multiplier *= 1.5;
    // }
    // // Shimmering Heat
    // if (target.effectActive("ShimmeringHeat")) {
    //     multipliers.final_damage_multiplier *= 0.67;
    // }
    // // Echo
    // if (user.effectActive("Echo")) {
    //     multipliers.final_damage_multiplier *= 0.75;
    // }

    // // Mass Attack
    // if (battle.pbCheckGlobalAbility("MASSATTACK")) {
    //     const hpFraction = user.hp / user.totalhp;
    //     multipliers.final_damage_multiplier *= 1 - hpFraction;
    // }

    // Multi-targeting attacks
    if (move.isSpread() && battleState.multiBattle) {
        // TODO: Handle abilities
        // if (user.shouldAbilityApply("RESONANT", aiCheck)) {
        //     multipliers.final_damage_multiplier *= 1.25;
        // } else {
        multipliers.final_damage_multiplier *= 0.75;
        //}
    }

    // Battler properties
    // TODO: Handle avatar inherent buffs
    // multipliers.base_damage_multiplier *= user.dmgMult;
    // multipliers.base_damage_multiplier *= Math.max(0, 1.0 - target.dmgResist);

    // Critical hits
    if (battleState.criticalHit) {
        // TODO: Implement moves with increased critical hit damage
        multipliers.final_damage_multiplier *= 1.5;
    }

    // Random variance (What used to be for that)
    // TODO: handle selfhits
    //if (!(this instanceof PokeBattle_Confusion) && !(this instanceof PokeBattle_Charm)) {
    multipliers.final_damage_multiplier *= 0.9;
    //}

    // TODO: Move-specific final damage modifiers
    //multipliers.final_damage_multiplier = pbModifyDamage(multipliers.final_damage_multiplier, user, target);
    return [multipliers, typeEffectMult];
}

function flatDamageReductions(finalCalculatedDamage: number): number {
    // TODO: Abilities
    // if (target.shouldAbilityApply("DRAGONSBLOOD", aiCheck) && !battle.moldBreaker) {
    //     finalCalculatedDamage -= target.level;
    //     if (!aiCheck) {
    //         target.aiLearnsAbility("DRAGONSBLOOD");
    //     }
    // }

    // TODO: Field effects
    // if (battle.field.effectActive("WillfulRoom")) {
    //     finalCalculatedDamage -= 30;
    // }

    finalCalculatedDamage = Math.max(finalCalculatedDamage, 1);

    // TODO: Handle abilities
    // if (user.hasActiveAbility("NOBLEBLADE") && target.effectActive("ChoseStatus")) {
    //     finalCalculatedDamage = 0;
    // }

    return finalCalculatedDamage;
}
