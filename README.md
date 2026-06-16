# D&D 2024 PDF Exporter

Foundry VTT v14 module for exporting `dnd5e` character actors to the bundled fillable D&D 2024 PDF character sheet.

Author: **HornedPriestess**

Version `0.7.0` expects the revised PDF template with descriptive checkbox field names.

## Compatibility

- Foundry VTT v14
- DnD5e system 5.3.3
- D&D 2024 character actors

## Install

Install using this manifest URL:

```text
https://raw.githubusercontent.com/LittleRainbowFox/dnd5e-2024-pdf-exporter/main/module.json
```

Or download the release zip and extract it into:

```text
FoundryVTT/Data/modules/dnd5e-2024-pdf-exporter
```

Then enable **D&D 2024 PDF Exporter** in the target world.

## Use

- Open a character sheet and click the PDF header control.
- Or right-click a character in the Actor Directory and choose **Export D&D 2024 PDF**.

Fallback macro:

```js
game.modules.get("dnd5e-2024-pdf-exporter").api.exportSelectedToken();
```

For a named actor:

```js
game.modules.get("dnd5e-2024-pdf-exporter").api.exportActor(game.actors.getName("Character Name"));
```

## Current coverage

The module fills identity, class/species/background, level, proficiency bonus, HP, AC, speed, size, abilities, saves, skills, save/skill/armor proficiency checkboxes, currency, equipment, equipment training and proficiencies, tool proficiencies, up to six weapons, spellcasting stats, spell slots, and up to thirty spells.

PDF field appearance is left to the original sheet template. The module only fills field values and checkboxes.
Exports are saved with `NeedAppearances` enabled and without regenerating field appearances, so the PDF viewer should use the original template's Auto font size, Helvetica font, alignment, and multiline settings.

Class and subclass features are parsed from the actor's class/subclass item descriptions. The sheet receives feature names up to the character's current level, and extra PDF pages are appended with feature descriptions.

PDF checkbox mapping is intentionally not filled yet because the official PDF uses generic names like `Check Box37`; those need visual verification against real exported sheets before they should be trusted.

## Release Notes

### 0.7.0

- Prepared the module for public GitHub distribution.
- Added Foundry manifest metadata for repository, manifest, and release download URLs.
- Declared DnD5e system compatibility metadata.
