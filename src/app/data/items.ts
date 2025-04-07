import loadedItems from "public/data/items.json";
import { Ability } from "./types/Ability";

interface LoadedItem {
    id: string;
    name: string;
    description: string;
    flags: string[] | null;
}

function loadItem(item: LoadedItem): Ability {
    const newFlags = item.flags || [];
    return { ...item, flags: newFlags };
}

export const items: Record<string, Ability> = Object.fromEntries(
    Object.entries(loadedItems).map(([id, ability]) => [id, loadItem(ability)])
);
