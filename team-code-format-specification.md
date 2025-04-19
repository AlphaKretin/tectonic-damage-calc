# Pokémon Tectonic Team Code Format Specification

Version: 1.0  
Date: April 19, 2025

## 1. Introduction

This document specifies the data format used for serializing and deserializing Pokémon Tectonic team data. The format is designed to efficiently represent Pokémon teams as compact string-based codes that can be easily shared and stored.

## 2. Format Overview

The team data format represents a collection of Pokémon as a version-tagged, delimiter-separated series of base64-encoded binary chunks. Each chunk represents a single team member with its associated properties.

### 2.1 High-Level Structure

```
<version>!<mon1>!<mon2>!...!<monN>
```

Where:
- `<version>` is a string identifier of the Pokémon Tectonic game version. This follows semver, with development builds appending `-dev`.
- `!` is the delimiter character separating chunks
- `<monX>` is a base64-encoded binary representation of a single Pokémon's data

## 3. Encoding Process

### 3.1 Pokémon Data Representation

Each Pokémon in a team is represented by the following properties:

| Property    | Description                           | Constraints                |
|-------------|---------------------------------------|----------------------------|
| pokemon     | The Pokémon identifier                | Valid pokémon key          |
| moves       | Array of 4 move identifiers           | Valid move keys            |
| ability     | The ability identifier                | Valid ability key          |
| items       | Array of 2 held item identifiers      | Valid item key             |
| form        | The form index of the Pokémon         | Non-negative Integer       |
| level       | The Pokémon's level                   | Integer between 1 and 70   |
| sp          | Array of 5 style point values         | Integers between 0 and 20  |

Here, a key refers to the symbol representing an entity in Pokémon Tectonic's PBS data files. Form indices will be described in the next section.

### 3.2 Binary Structure

Each card is encoded as a binary chunk with the following structure:

- 16 bits (2 bytes) per value
- Values are stored as unsigned 16-bit integers in the following order:
  1. Pokémon index 
  2. Ability index
  3. Item 1 index
  4. Item 2 index
  5. Form index
  6. Move 1 index
  7. Move 2 index
  8. Move 3 index
  9. Move 4 index
  10. Level
  11. Style point - HP
  12. Style point - Attack and Special Attack
  13. Style point - Defense
  14. Style point - Special Defense
  15. Style point - Speed

Here, an index refers to the position of an entity in the ordering of Pokémon Tectonic's PBS data files. For PBS data with multiple files, e.g. moves and abilities, consider the `_new` file to be appended directly after the base file, ignoring all other files such as `_cut`. For example, if the index of the last move in `moves.txt` is 283, then the index of the first move in `moves_new.txt` is 284. For Pokémon forms, the form defined in the base `pokemon.txt` file is form 0, while any forms listed in `pokemonforms.txt` count up from 1.

If a value is undefined, it should be encoded as 65535, i.e. -1. It is expected that no list of entities will approach or exceed this number of entries, making this value safe to reserve.

Note that although the vast majority of Pokémon will be holding zero or one items, two slots are still reserved in encoding for the edge case otherwise. In these cases, the second item value will be undefined.

### 3.3 Encoding Algorithm

1. For each card in the team:
   a. Convert each property to its corresponding numeric index using the mapping scheme described above
   b. Create a binary buffer of 16-bit values
   c. Convert the binary buffer to a base64 string

2. Join all encoded card strings with the `!` delimiter character

3. Prepend the version identifier and a delimiter

## 4. Decoding Process

### 4.1 Decoding Algorithm

1. Split the input string by the `!` delimiter
2. Extract the version identifier (first chunk)
3. For each remaining chunk:
   a. Convert the base64 string to a binary buffer
   b. Read 16-bit values from the buffer
   c. Map index values back to their corresponding entities using the mapping scheme described above
   d. Construct a Pokémon object with the decoded properties

### 4.2 Default Values and Error Handling

- If a level value is missing or invalid, use 70, the maximum level in Pokémon Tectonic
- If style points are missing, use the default value of `[10, 10, 10, 10, 10]`
- If an entity index is invalid or not found, consider it undefined

## 5. Constraints and Limitations

- Pokémon level must be between 1 and 70
- Style points must be between 0 and 20
- Total style points must not exceed 50

## 6. Version Handling

The format supports multiple versions. As described in section 3.2, the mapping between data entities and PBS file indicies can change between versions. It is up to the implementation which versions of the game they maintain mappings for. 

## 7. Example

### 7.1 Example of an Encoded Team

```
3.2.1!AMMB1QB2//8AAAHhAQwBGQK/AEYACgAKAAoACgAK!ASwAqgBZ//8AAAAbBCQD+AAZAEYACgAKAAoACgAK!AnwA+wB+//8AAAHhA2sA8wFQAEYACgAKAAoACgAK!AiQBbwBfAGEAAAOWAlADpwGWAEYACgAKAAoACgAK!ATEAbP////8AAADQAuYAlgEsAEYACgAKAAoACgAK!A5sBoQBV//8AAAEuBBoCDAAbAEYACgAKAAoACgAK
```

### 7.2 Example of a Decoded Team

```json
[
    {
        "pokemon": "ESPEON",
        "ability": "OVERTHINKING",
        "items": ["EJECTPACK"],
        "form": 0,
        "moves": ["PSYCHIC", "CONFUSERAY", "SHADOWBALL", "MIASMA"],
        "level": 70,
        "sp": [10, 10, 10, 10, 10]
    },
    {
        "pokemon": "DELCATTY",
        "ability": "ABOVEITALL",
        "items": ["LEFTOVERS"],
        "form": 0,
        "moves": ["FAKEOUT", "BLACKOUT", "HYPOTHERMIATE", "EXTREMESPEED"],
        "level": 70,
        "sp": [10, 10, 10, 10, 10]
    },
    {
        "pokemon": "VOLCARONA",
        "ability": "DAWNFALL",
        "items": ["WILDCARD"],
        "form": 0,
        "moves": ["PSYCHIC", "SMOLDERRAVE", "BUGBUZZ", "HEATWAVE"],
        "level": 70,
        "sp": [10, 10, 10, 10, 10]
    },
    {
        "pokemon": "LILLIGANT",
        "ability": "HERBALIST",
        "items": ["AGILITYHERB", "INTELLECTHERB"],
        "form": 0,
        "moves": ["BLOSSOM", "MOONBLAST", "PUFFBALL", "PETALDANCE"],
        "level": 70,
        "sp": [10, 10, 10, 10, 10]
    },
    {
        "pokemon": "AGGRON",
        "ability": "ROCKHEAD",
        "items": [],
        "form": 0,
        "moves": ["EARTHQUAKE", "BEDROCKBREAKER", "SUPERPOWER", "HEAVYSLAM"],
        "level": 70,
        "sp": [10, 10, 10, 10, 10]
    },
    {
        "pokemon": "NIBELONG",
        "ability": "LONGODDS",
        "items": ["LOADEDDICE"],
        "form": 0,
        "moves": ["IRONHEAD", "SACREDLOTS", "DRAGONDANCE", "FAKEOUT"],
        "level": 70,
        "sp": [10, 10, 10, 10, 10]
    }
]

```

## 8. References

This specification is derived from the implementation in the `teamExport.ts` file, which provides the encoding and decoding functionality for the team code format.
