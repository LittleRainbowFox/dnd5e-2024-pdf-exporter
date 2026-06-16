import { PDFBool, PDFDocument, PDFName, StandardFonts, TextAlignment, rgb } from "../vendor/pdf-lib.esm.min.js";

const MODULE_ID = "dnd5e-2024-pdf-exporter";
const TEMPLATE_PATH = `modules/${MODULE_ID}/assets/DnD_2024_Character-Sheet-fillable.pdf`;
const HEADER_ACTION = "dnd5e-2024-export-pdf";
const MAX_WEAPONS = 6;
const MAX_SPELLS = 30;

const CHECKBOXES = {
  "system.abilities.str": "Check Box str save",
  "system.abilities.dex": "Check Box dex save",
  "system.abilities.con": "Check Box con save",
  "system.abilities.int": "Check Box int save",
  "system.abilities.wis": "Check Box wis save",
  "system.abilities.cha": "Check Box cha save",
  "system.skills.acr": "Check Box acrobatics",
  "system.skills.ani": "Check Box animal handling",
  "system.skills.arc": "Check Box arcana",
  "system.skills.ath": "Check Box athletics",
  "system.skills.dec": "Check Box deception",
  "system.skills.his": "Check Box history",
  "system.skills.ins": "Check Box insight",
  "system.skills.itm": "Check Box intimidation",
  "system.skills.inv": "Check Box investigation",
  "system.skills.med": "Check Box medicine",
  "system.skills.nat": "Check Box nature",
  "system.skills.prc": "Check Box perception",
  "system.skills.prf": "Check Box perfomance",
  "system.skills.per": "Check Box persuasion",
  "system.skills.rel": "Check Box religion",
  "system.skills.slt": "Check Box sleight of hand",
  "system.skills.ste": "Check Box stealth",
  "system.skills.sur": "Check Box survival"
};

const ARMOR_PROFICIENCY_CHECKBOXES = {
  lgt: "Check Box light armor",
  light: "Check Box light armor",
  med: "Check Box medium armor",
  medium: "Check Box medium armor",
  hvy: "Check Box heavy armor",
  heavy: "Check Box heavy armor",
  shl: "Check Box shields",
  shield: "Check Box shields",
  shields: "Check Box shields"
};

const TOOL_LABELS = {
  calligrapher: "Calligrapher's Supplies",
  carpenter: "Carpenter's Tools",
  cartographer: "Cartographer's Tools",
  cobbler: "Cobbler's Tools",
  cook: "Cook's Utensils",
  glassblower: "Glassblower's Tools",
  jeweler: "Jeweler's Tools",
  leatherworker: "Leatherworker's Tools",
  mason: "Mason's Tools",
  painter: "Painter's Supplies",
  potter: "Potter's Tools",
  smith: "Smith's Tools",
  tinkerer: "Tinker's Tools",
  weaver: "Weaver's Tools",
  woodcarver: "Woodcarver's Tools",
  disguise: "Disguise Kit",
  forgery: "Forgery Kit",
  herbalism: "Herbalism Kit",
  navigator: "Navigator's Tools",
  poisoner: "Poisoner's Kit",
  thieves: "Thieves' Tools"
};

const WEAPON_MASTERY_LABELS = {
  battleaxe: "Battleaxe",
  blowgun: "Blowgun",
  club: "Club",
  dagger: "Dagger",
  dart: "Dart",
  flail: "Flail",
  glaive: "Glaive",
  greataxe: "Greataxe",
  greatclub: "Greatclub",
  greatsword: "Greatsword",
  halberd: "Halberd",
  handaxe: "Handaxe",
  handcrossbow: "Hand Crossbow",
  heavycrossbow: "Heavy Crossbow",
  javelin: "Javelin",
  lance: "Lance",
  lightcrossbow: "Light Crossbow",
  lighthammer: "Light Hammer",
  longbow: "Longbow",
  longsword: "Longsword",
  mace: "Mace",
  maul: "Maul",
  morningstar: "Morningstar",
  musket: "Musket",
  pike: "Pike",
  pistol: "Pistol",
  quarterstaff: "Quarterstaff",
  rapier: "Rapier",
  scimitar: "Scimitar",
  shortbow: "Shortbow",
  shortsword: "Shortsword",
  sickle: "Sickle",
  sling: "Sling",
  spear: "Spear",
  trident: "Trident",
  warhammer: "Warhammer",
  warpick: "War Pick",
  whip: "Whip"
};

const ABILITIES = {
  str: { score: "STR SCORE", mod: "STR MOD", save: "STR SAVE" },
  dex: { score: "DEX SCORE", mod: "DEX MOD", save: "DEX SAVE" },
  con: { score: "CON SCORE", mod: "CON MOD", save: "CON SAVE" },
  int: { score: "INT SCORE", mod: "INT MOD", save: "INT SAVE" },
  wis: { score: "WIS SCORE", mod: "WIS MOD", save: "WIS SAVE" },
  cha: { score: "CHA SCORE", mod: "CHA MOD", save: "CHA SAVE" }
};

const SKILLS = {
  acr: "ACROBATICS",
  ani: "ANIMAL HANDLING",
  arc: "ARCANA",
  ath: "ATHLETICS",
  dec: "DECEPTION",
  his: "HISTORY",
  ins: "INSIGHT",
  itm: "INTIMIDATE",
  inv: "INVESTIGATION",
  med: "MEDICINE",
  nat: "NATURE",
  prc: "PERCEPTION",
  prf: "PERFORMANCE",
  per: "PERSUASION",
  rel: "RELIGION",
  slt: "SLEIGHT OF HAND",
  ste: "STEALTH",
  sur: "SURVIVAL"
};

const TEXT_FIELD_FLAGS = {
  MULTILINE: 1 << 12,
  DO_NOT_SPELL_CHECK: 1 << 22,
  DO_NOT_SCROLL: 1 << 23,
  COMB: 1 << 24,
  RICH_TEXT: 1 << 25
};

const LARGE_TEXT_FIELDS = new Set([
  "CLASS FEATURES 1",
  "CLASS FEATURES 2",
  "SPECIES TRAITS",
  "FEATS",
  "WEAPON PROF",
  "TOOL PROF",
  "LANGUAGES",
  "EQUIPMENT",
  "APPEARANCE",
  "BACKSTORY & PERSONALITY"
]);

Hooks.once("ready", () => {
  const module = game.modules.get(MODULE_ID);
  if (module) {
    module.api = {
      exportActor,
      exportSelectedToken,
      buildPdfFieldValues
    };
  }

  document.addEventListener("click", onApplicationV2HeaderClick, true);
  console.log(`${MODULE_ID} | Ready`);
});

Hooks.on("getActorDirectoryEntryContext", (_html, options) => {
  options.push({
    name: "Export D&D 2024 PDF",
    icon: '<i class="fas fa-file-pdf"></i>',
    condition: li => canExport(actorFromDirectoryEntry(li)),
    callback: li => exportActor(actorFromDirectoryEntry(li))
  });
});

Hooks.on("getActorSheetHeaderButtons", (app, buttons) => {
  const actor = actorFromApplication(app);
  if (!canExport(actor)) return;

  buttons.unshift({
    label: "PDF",
    class: HEADER_ACTION,
    icon: "fas fa-file-pdf",
    onclick: () => exportActor(actor)
  });
});

Hooks.on("getHeaderControlsApplicationV2", (application, controls) => {
  const actor = actorFromApplication(application);
  if (!canExport(actor)) return;

  controls.push({
    action: actionForActor(actor),
    icon: "fa-solid fa-file-pdf",
    label: "Export PDF",
    callback: () => exportActor(actor),
    onClick: () => exportActor(actor),
    ownership: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER
  });
});

async function exportSelectedToken() {
  const actor = canvas?.tokens?.controlled?.[0]?.actor;
  return exportActor(actor);
}

async function exportActor(actor) {
  if (!canExport(actor)) {
    ui.notifications.warn("Select or open a dnd5e character you can view.");
    return;
  }

  try {
    const detailOptions = detailSections(actor);
    const selectedDetailIds = await promptDetailSelection(actor, detailOptions);
    if (selectedDetailIds === null) return;

    ui.notifications.info(`Exporting ${actor.name} to PDF...`);
    const response = await fetch(TEMPLATE_PATH);
    if (!response.ok) throw new Error(`Could not load PDF template: ${response.status} ${response.statusText}`);

    const templateBytes = await response.arrayBuffer();
    const pdf = await PDFDocument.load(templateBytes);
    const form = pdf.getForm();
    rebuildFormFields(pdf, form);
    const fields = new Map(form.getFields().map(field => [field.getName(), field]));
    const values = buildPdfFieldValues(actor);
    const state = { hasWideText: false, missing: [] };

    for (const [name, value] of Object.entries(values)) setText(fields, name, value, state);
    fillProficiencyCheckboxes(fields, actor);
    fillWeapons(fields, actor, state);
    fillSpells(fields, actor, state);
    await appendFeatureDetailsPage(pdf, actor, detailOptions, selectedDetailIds);

    const bytes = await savePdf(pdf, state);
    downloadBytes(bytes, `${safeFileName(actor.name)}-dnd-2024.pdf`, "application/pdf");

    if (state.missing.length) console.debug(`${MODULE_ID} | Missing PDF fields`, state.missing);
    ui.notifications.info(`PDF exported for ${actor.name}.`);
  } catch (error) {
    console.error(`${MODULE_ID} | Export failed`, error);
    ui.notifications.error(`PDF export failed: ${error.message}`);
  }
}

function buildPdfFieldValues(actor) {
  const system = actor.system ?? {};
  const items = actorItems(actor);
  const classes = items.filter(item => item.type === "class");
  const subclasses = items.filter(item => item.type === "subclass");
  const race = firstItem(items, "race");
  const background = firstItem(items, "background");
  const currency = get(system, "currency", {});
  const traits = get(system, "traits", {});
  const details = get(system, "details", {});
  const attributes = get(system, "attributes", {});
  const classFeatures = availableClassFeatures(actor);
  const values = {
    Name: actor.name,
    Class: classSummary(classes, details),
    Subclass: subclasses.map(item => item.name).join(", "),
    Species: race?.name ?? cleanText(details.race ?? details.species ?? ""),
    Background: background?.name ?? cleanText(details.background ?? ""),
    Level: characterLevel(classes, details),
    "XP Points": "",
    "Armor Class": get(attributes, "ac.value", ""),
    "Current HP": "",
    "Max HP": get(attributes, "hp.max", ""),
    "Temp HP": "",
    "Max HD": hitDiceSummary(classes, attributes),
    "Spent HD": get(attributes, "hd.spent", ""),
    init: signed(get(attributes, "init.total", get(attributes, "init.mod", ""))),
    SPEED: movementSpeed(get(attributes, "movement", {})),
    SIZE: sizeLabel(get(traits, "size", get(system, "details.size", ""))),
    "PROF BONUS": signed(get(attributes, "prof", get(system, "prof", ""))),
    "PASSIVE PERCEPTION": get(system, "skills.prc.passive", ""),
    LANGUAGES: traitSummary(get(traits, "languages", {})),
    "WEAPON PROF": weaponProficiencySummary(get(traits, "weaponProf", {})),
    "TOOL PROF": toolProficiencySummary(system, items),
    EQUIPMENT: equipmentSummary(items),
    "CLASS FEATURES 1": featureNameSummary(classFeatures, 0),
    "CLASS FEATURES 2": featureNameSummary(classFeatures, 1),
    "SPECIES TRAITS": speciesTraitSummary(items, race),
    FEATS: featSummary(items),
    CP: get(currency, "cp", ""),
    SP: get(currency, "sp", ""),
    EP: get(currency, "ep", ""),
    GP: get(currency, "gp", ""),
    PP: get(currency, "pp", ""),
    "SPELLCASTING ABILITY": spellcastingAbilityLabel(system),
    "SPELLCASTING MOD": signed(get(attributes, "spell.mod", get(system, "spells.mod", ""))),
    "SPELL SAVE DC": get(attributes, "spell.dc", get(system, "spells.dc", "")),
    "SPELL ATTACK BONUS": signed(get(attributes, "spell.attack", get(system, "spells.attack", "")))
  };

  for (const [key, fields] of Object.entries(ABILITIES)) {
    values[fields.score] = get(system, `abilities.${key}.value`, "");
    values[fields.mod] = signed(get(system, `abilities.${key}.mod`, ""));
    values[fields.save] = signed(get(system, `abilities.${key}.save`, ""));
  }

  for (const [key, field] of Object.entries(SKILLS)) {
    values[field] = signed(get(system, `skills.${key}.total`, get(system, `skills.${key}.mod`, "")));
  }

  for (let level = 1; level <= 9; level += 1) {
    values[`LVL${level} TOTAL`] = get(system, `spells.spell${level}.max`, get(system, `spells.pact.max`, ""));
  }

  return values;
}

function fillWeapons(fields, actor, state) {
  const weapons = actorItems(actor).filter(item => item.type === "weapon").slice(0, MAX_WEAPONS);

  weapons.forEach((weapon, index) => {
    const row = index + 1;
    setText(fields, `NAME - WEAPON ${row}`, weapon.name, state);
    setText(fields, `BONUS/DC - WEAPON ${row}`, weaponBonus(weapon), state);
    setText(fields, `DAMAGE/TYPE - WEAPON ${row}`, weaponDamage(weapon, actor), state);
    setText(fields, `NOTES - WEAPON ${row}`, weaponNotes(weapon), state);
  });
}

function fillSpells(fields, actor, state) {
  const spells = actorItems(actor)
    .filter(item => item.type === "spell")
    .sort((a, b) => Number(spellLevel(a)) - Number(spellLevel(b)) || a.name.localeCompare(b.name))
    .slice(0, MAX_SPELLS);

  spells.forEach((spell, index) => {
    const suffix = index === 0 ? "" : String(index - 1);
    setText(fields, `SPELL NAME${suffix}`, spell.name, state);
    setText(fields, `SPELL LEVEL${suffix}`, spellLevel(spell), state);
    setText(fields, `RANGE${suffix}`, spellRange(spell), state);
    setText(fields, `CASTING TIME${suffix}`, spellCastingTime(spell), state);
    setText(fields, `SPELL NOTES${suffix}`, spellNotes(spell), state);
    fillSpellCheckboxes(fields, spell, suffix);
  });
}

function fillSpellCheckboxes(fields, spell, suffix) {
  const checkboxSuffix = suffix ? ` ${suffix}` : "";
  if (spellRequiresConcentration(spell)) fields.get(`Check Box spell concentration${checkboxSuffix}`)?.check();
  if (spellIsRitual(spell)) fields.get(`Check Box spell ritual${checkboxSuffix}`)?.check();
  if (spellHasCostlyMaterial(spell)) fields.get(`Check Box spell material${checkboxSuffix}`)?.check();
}

function fillProficiencyCheckboxes(fields, actor) {
  for (const [path, fieldName] of Object.entries(CHECKBOXES)) {
    const allowValue = path.includes(".skills.");
    if (!hasProficiency(get(actor, path, {}), { allowValue })) continue;
    fields.get(fieldName)?.check();
  }

  for (const key of traitValues(get(actor.system ?? {}, "traits.armorProf", {}))) {
    const fieldName = ARMOR_PROFICIENCY_CHECKBOXES[String(key).toLowerCase()];
    if (fieldName) fields.get(fieldName)?.check();
  }
}

function actorItems(actor) {
  return Array.from(actor?.items ?? []);
}

function firstItem(items, type) {
  return items.find(item => item.type === type);
}

function actorFromApplication(app) {
  return app?.actor ?? app?.document?.actor ?? (app?.document?.documentName === "Actor" ? app.document : null);
}

function actorFromDirectoryEntry(li) {
  const element = li?.[0] ?? li;
  const id = li?.data?.("documentId")
    ?? li?.data?.("actorId")
    ?? element?.dataset?.documentId
    ?? element?.dataset?.actorId
    ?? element?.dataset?.entryId;
  return game.actors.get(id);
}

function canExport(actor) {
  return Boolean(actor?.type === "character" && actor?.isOwner);
}

function onApplicationV2HeaderClick(event) {
  const button = event.target?.closest?.(`[data-action^="${HEADER_ACTION}"]`);
  if (!button) return;

  const actor = actorFromAction(button.dataset.action) ?? actorFromApplication(applicationFromElement(button));
  if (!canExport(actor)) return;

  event.preventDefault();
  event.stopPropagation();
  exportActor(actor);
}

function actionForActor(actor) {
  return `${HEADER_ACTION}:${actor.uuid}`;
}

function actorFromAction(action) {
  if (!action?.startsWith(`${HEADER_ACTION}:`)) return null;
  const uuid = action.slice(HEADER_ACTION.length + 1);
  return globalThis.fromUuidSync?.(uuid) ?? null;
}

function applicationFromElement(element) {
  const applicationClass = foundry?.applications?.api?.ApplicationV2;
  if (!applicationClass?.instances) return null;

  for (const app of applicationClass.instances()) {
    if (app.element?.contains?.(element)) return app;
  }
  return null;
}

function setText(fields, name, value, state) {
  if (!fields.has(name)) {
    state.missing.push(name);
    return;
  }

  const text = normalizeValue(value);
  if (text.match(/[^\u0000-\u00ff]/)) state.hasWideText = true;
  fields.get(name).setText(text);
}

async function savePdf(pdf, state) {
  prepareRebuiltFieldsForAcrobat(pdf.getForm());
  const acroForm = pdf.getForm().acroForm;
  acroForm.dict.set(PDFName.of("NeedAppearances"), PDFBool.True);
  return pdf.save({ updateFieldAppearances: false });
}

function rebuildFormFields(pdf, form) {
  const layout = snapshotFormLayout(pdf, form);
  removeOriginalFormWidgets(pdf, form);
  recreateFormFields(pdf, form, layout);
}

function snapshotFormLayout(pdf, form) {
  const pages = pdf.getPages();
  const layout = [];

  for (const field of form.getFields()) {
    const type = typeof field.getText === "function"
      ? "text"
      : typeof field.isChecked === "function"
        ? "checkbox"
        : null;
    if (!type) continue;

    const acroField = field.acroField;
    const flags = fieldFlags(acroField);
    const alignment = acroField.getQuadding?.();

    for (const widget of acroField.getWidgets()) {
      const page = form.findWidgetPage(widget);
      layout.push({
        name: field.getName(),
        type,
        pageIndex: pages.indexOf(page),
        rect: widget.getRectangle(),
        flags,
        alignment
      });
    }
  }

  return layout;
}

function removeOriginalFormWidgets(pdf, form) {
  const widgetDictsByPage = new Map();

  for (const field of form.getFields()) {
    for (const widget of field.acroField.getWidgets()) {
      const page = form.findWidgetPage(widget);
      if (!widgetDictsByPage.has(page)) widgetDictsByPage.set(page, new Set());
      widgetDictsByPage.get(page).add(widget.dict);
    }
  }

  for (const [page, widgetDicts] of widgetDictsByPage.entries()) {
    const annots = page.node.Annots();
    if (!annots) continue;

    for (let index = annots.size() - 1; index >= 0; index -= 1) {
      if (widgetDicts.has(annots.lookup(index))) annots.remove(index);
    }
  }

  form.acroForm.dict.set(PDFName.of("Fields"), pdf.context.obj([]));
  form.acroForm.dict.delete(PDFName.of("NeedAppearances"));
}

function recreateFormFields(pdf, form, layout) {
  const pages = pdf.getPages();

  for (const entry of layout) {
    const page = pages[entry.pageIndex];
    if (!page) continue;

    if (entry.type === "text") {
      const field = form.createTextField(entry.name);
      configureTextField(field, entry);
      field.addToPage(page, {
        ...entry.rect,
        borderWidth: 0,
        textColor: rgb(0, 0, 0)
      });
      field.setFontSize(0);
      removeFieldVisuals(field, { removeAppearance: true });
    } else if (entry.type === "checkbox") {
      const field = form.createCheckBox(entry.name);
      field.addToPage(page, {
        ...entry.rect,
        borderWidth: 0
      });
      removeFieldVisuals(field);
    }
  }
}

function configureTextField(field, entry) {
  if (entry.flags & TEXT_FIELD_FLAGS.MULTILINE) field.enableMultiline();
  else field.disableMultiline();

  if (entry.flags & TEXT_FIELD_FLAGS.DO_NOT_SPELL_CHECK) field.disableSpellChecking();
  else field.enableSpellChecking();

  if (entry.flags & TEXT_FIELD_FLAGS.DO_NOT_SCROLL) field.disableScrolling();
  else field.enableScrolling();

  field.disableRichFormatting();

  if (entry.flags & TEXT_FIELD_FLAGS.COMB) field.enableCombing();
  else field.disableCombing();

  if (!LARGE_TEXT_FIELDS.has(entry.name)) field.setAlignment(TextAlignment.Center);
  else if (entry.alignment === 1) field.setAlignment(TextAlignment.Center);
  else if (entry.alignment === 2) field.setAlignment(TextAlignment.Right);
  else field.setAlignment(TextAlignment.Left);
}

function removeFieldVisuals(field, { removeAppearance = false } = {}) {
  for (const widget of field.acroField.getWidgets()) {
    widget.getOrCreateBorderStyle().setWidth(0);
    const appearance = widget.getOrCreateAppearanceCharacteristics();
    appearance.dict.delete(PDFName.of("BG"));
    appearance.dict.delete(PDFName.of("BC"));
    if (removeAppearance) widget.dict.delete(PDFName.of("AP"));
  }
}

function prepareRebuiltFieldsForAcrobat(form) {
  for (const field of form.getFields()) {
    const isText = typeof field.getText === "function";
    if (isText) field.setFontSize(0);
    removeFieldVisuals(field, { removeAppearance: isText });
  }
}

function fieldFlags(acroField) {
  const flags = acroField.dict.get(PDFName.of("Ff"));
  return Number(flags?.asNumber?.() ?? flags?.numberValue ?? 0);
}

function downloadBytes(bytes, filename, mimeType) {
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function get(object, path, fallback = "") {
  const value = foundry.utils.getProperty(object, path);
  return value ?? fallback;
}

function normalizeValue(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "boolean") return value ? "Yes" : "";
  if (Array.isArray(value)) return value.map(normalizeValue).filter(Boolean).join(", ");
  if (typeof value === "object") {
    if ("value" in value) return normalizeValue(value.value);
    if ("label" in value) return normalizeValue(value.label);
    return "";
  }
  return cleanText(String(value));
}

function cleanText(text) {
  return decodeEntities(stripFoundryLinks(String(text)))
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripFoundryLinks(text) {
  return text
    .replace(/[@&][A-Za-z]+(?:\[[^\]]*])(?:\{([^}]*)})?/g, (_match, label) => {
      if (label) return label;
      const bracket = _match.match(/\[([^\]]*)]/)?.[1] ?? "";
      const readable = bracket.split("|")[0].split("=").pop() ?? bracket;
      return readable.replace(/([a-z])([A-Z])/g, "$1 $2");
    })
    .replace(/\s+([.,;:!?])/g, "$1");
}

function decodeEntities(text) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

function signed(value) {
  const normalized = normalizeValue(value);
  if (normalized === "") return "";
  const number = Number(normalized);
  if (!Number.isFinite(number)) return normalized;
  return number >= 0 ? `+${number}` : String(number);
}

function classSummary(classes, details) {
  const fromItems = classes
    .map(item => {
      const levels = get(item.system ?? {}, "levels", "");
      return levels ? `${item.name} ${levels}` : item.name;
    })
    .join(" / ");
  return fromItems || cleanText(details.class ?? "");
}

function characterLevel(classes, details) {
  const explicit = get(details, "level", "");
  if (explicit !== "") return explicit;

  const level = classes.reduce((total, item) => total + Number(get(item.system ?? {}, "levels", 0)), 0);
  return level || "";
}

function hitDiceSummary(classes, attributes) {
  const explicit = get(attributes, "hd.max", "");
  if (explicit !== "") return explicit;

  return classes
    .map(item => {
      const levels = get(item.system ?? {}, "levels", "");
      const hitDie = get(item.system ?? {}, "hitDice", "");
      return hitDie ? `${levels || 1}${hitDie}` : "";
    })
    .filter(Boolean)
    .join(" / ");
}

function movementSpeed(movement) {
  return normalizeValue(movement.walk ?? movement.value ?? "");
}

function sizeLabel(size) {
  const value = normalizeValue(size);
  return configLabel(CONFIG.DND5E?.actorSizes?.[value], value);
}

function traitSummary(trait) {
  const values = traitValues(trait);
  const custom = cleanText(trait?.custom ?? "");
  return semicolonList([...values.map(value => traitLabel(value)), custom]);
}

function semicolonList(values) {
  const cleaned = values
    .map(value => cleanText(value))
    .filter(Boolean)
    .map(value => value.replace(/[;\s]+$/g, ""));
  return cleaned.length ? `${cleaned.join("; ")};` : "";
}

function traitValues(trait) {
  const value = trait?.value ?? [];
  if (value instanceof Set) return Array.from(value);
  if (Array.isArray(value)) return value;
  if (typeof value === "object" && value !== null) return Object.keys(value).filter(key => value[key]);
  return value ? [value] : [];
}

function equipmentSummary(items) {
  return semicolonList(items
    .filter(item => ["equipment", "consumable", "tool", "loot", "backpack", "container"].includes(item.type))
    .map(item => {
      const quantity = get(item.system ?? {}, "quantity", 1);
      return quantity > 1 ? `${quantity}x ${item.name}` : item.name;
    }));
}

function featureNameSummary(features, page) {
  const midpoint = Math.ceil(features.length / 2);
  const slice = page === 0 ? features.slice(0, midpoint) : features.slice(midpoint);
  return semicolonList(slice.map(feature => feature.name));
}

function availableClassFeatures(actor) {
  const items = actorItems(actor);
  const classes = items.filter(item => item.type === "class");
  const level = Number(characterLevel(classes, actor.system?.details ?? {})) || 0;
  const entries = items
    .filter(item => ["class", "subclass"].includes(item.type))
    .flatMap(item => parseFeatureEntries(item, level));

  return uniqueBy(entries, entry => `${entry.source}:${entry.level}:${entry.name}`)
    .sort((a, b) => a.level - b.level || a.sourceOrder - b.sourceOrder || a.name.localeCompare(b.name));
}

function parseFeatureEntries(item, characterLevel) {
  const html = get(item.system ?? {}, "description.value", "");
  if (!html) return [];

  const sourceOrder = item.type === "class" ? 0 : 1;
  const blocks = htmlBlocks(html);
  const entries = [];
  let current = null;

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    const heading = featureHeading(block.text, blocks[index + 1]?.text, item.type);

    if (heading) {
      if (current) entries.push(current);
      current = {
        name: heading.name,
        level: heading.level,
        source: item.name,
        sourceType: item.type,
        sourceOrder,
        description: ""
      };
      continue;
    }

    if (current) current.description = [current.description, block.text].filter(Boolean).join(" ");
  }

  if (current) entries.push(current);

  return entries
    .filter(entry => entry.level <= characterLevel)
    .filter(entry => !isAdministrativeFeature(entry.name))
    .map(entry => ({ ...entry, description: cleanFeatureDescription(entry.description) }));
}

function htmlBlocks(html) {
  const container = document.createElement("div");
  container.innerHTML = html;
  const selectors = "h1,h2,h3,h4,h5,h6,p,li,dt,dd";
  return Array.from(container.querySelectorAll(selectors))
    .map(element => ({ tag: element.tagName.toLowerCase(), text: cleanText(element.textContent ?? "") }))
    .filter(block => block.text);
}

function featureHeading(text, nextText, itemType) {
  const classMatch = text.match(/^(?:level|lvl)\s*(\d+)\s*[:\-–—]\s*(.+)$/i)
    ?? text.match(/^(\d+)(?:st|nd|rd|th)[-\s]+level\s*[:\-–—]\s*(.+)$/i);
  if (classMatch) return { level: Number(classMatch[1]), name: cleanFeatureName(classMatch[2]) };

  if (itemType === "subclass") {
    const levelMatch = nextText?.match(/^(\d+)(?:st|nd|rd|th)[-\s]+level\b/i);
    if (levelMatch) return { level: Number(levelMatch[1]), name: cleanFeatureName(text) };
  }

  return null;
}

function cleanFeatureName(name) {
  return name.replace(/\s*\(.+?\)\s*$/g, "").replace(/\s+/g, " ").trim();
}

function cleanFeatureDescription(description) {
  return description
    .split("\n")
    .map(line => line.replace(/^\d+(?:st|nd|rd|th)[-\s]+level.*feature$/i, "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function isAdministrativeFeature(name) {
  return /^(rogue subclass|subclass|ability score improvement|epic boon)$/i.test(name);
}

function speciesTraitSummary(items, race) {
  const raceName = race?.name ? [race.name] : [];
  const raceFeatures = items
    .filter(item => item.type === "feat")
    .filter(item => normalizeValue(get(item.system ?? {}, "type.value", "")).includes("race"))
    .map(item => item.name);
  return semicolonList([...raceName, ...raceFeatures]);
}

function featSummary(items) {
  return semicolonList(items
    .filter(item => item.type === "feat")
    .filter(item => normalizeValue(get(item.system ?? {}, "type.value", "")).includes("feat"))
    .map(item => featDisplayName(item.name)));
}

function featDisplayName(name) {
  return cleanText(name).replace(/\s*;\s*.+$/g, "").trim();
}

function spellcastingAbilityLabel(system) {
  const ability = normalizeValue(get(system, "attributes.spellcasting", ""));
  if (!ability) return "";
  return configLabel(CONFIG.DND5E?.abilities?.[ability], ability);
}

function configLabel(entry, fallback = "") {
  const label = entry?.label ?? entry?.abbreviation ?? entry ?? fallback;
  if (typeof label === "string") return game.i18n.localize(label);
  return normalizeValue(label) || normalizeValue(fallback);
}

async function appendFeatureDetailsPage(pdf, actor, sections = detailSections(actor), selectedIds = null) {
  sections = sections
    .map(section => ({
      ...section,
      entries: selectedIds ? section.entries.filter(entry => selectedIds.has(entry.id)) : section.entries
    }))
    .filter(section => section.entries.length);
  if (!sections.length) return;

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageSize = [595.28, 841.89];
  const margin = 34;
  const bodySize = 8.5;
  let page = pdf.addPage(pageSize);
  let y = page.getHeight() - margin;

  const addPage = () => {
    page = pdf.addPage(pageSize);
    y = page.getHeight() - margin;
  };

  const drawLine = (text, size = 10, chosenFont = font, color = rgb(0.1, 0.1, 0.1)) => {
    if (y < margin + size + 6) addPage();
    page.drawText(text, { x: margin, y, size, font: chosenFont, color });
    y -= size + 5;
    return true;
  };

  for (const section of sections) {
    if (y < margin + 90) addPage();
    drawLine(`${actor.name}: ${section.title}`, 16, bold);
    y -= 6;

    for (const entry of section.entries) {
      if (y < margin + 80) addPage();
      drawLine(entry.heading, 11, bold);
      if (entry.source) drawLine(entry.source, 8, font, rgb(0.35, 0.35, 0.35));

      for (const line of wrapTextByWidth(entry.description || "No description found.", font, bodySize, page.getWidth() - margin * 2)) {
        drawLine(line, bodySize);
      }
      y -= 7;
    }

    y -= 12;
  }
}

function detailSections(actor) {
  const items = actorItems(actor);
  const classFeatures = availableClassFeatures(actor).map(feature => ({
    id: `class:${feature.source}:${feature.level}:${feature.name}`,
    heading: `Level ${feature.level}: ${feature.name}`,
    source: feature.source,
    description: feature.description
  }));
  const speciesTraits = speciesTraitDetails(items);
  const feats = featDetails(items);
  const weaponMasteries = weaponMasteryDetails(actor);

  return [
    { title: "Class Features", entries: classFeatures },
    { title: "Species Traits", entries: speciesTraits },
    { title: "Feats", entries: feats },
    { title: "Weapon Mastery", entries: weaponMasteries }
  ].filter(section => section.entries.length);
}

function promptDetailSelection(actor, sections) {
  if (!sections.length) return Promise.resolve(new Set());
  if (!globalThis.Dialog) {
    ui.notifications.warn("PDF detail selector is unavailable; exporting all detail descriptions.");
    return Promise.resolve(new Set(sections.flatMap(section => section.entries.map(entry => entry.id))));
  }

  const content = `
    <form class="${MODULE_ID}-detail-select">
      <p>Select descriptions to append after the character sheet.</p>
      ${sections.map(section => `
        <fieldset>
          <legend>${escapeHtml(section.title)}</legend>
          ${section.entries.map(entry => `
            <label>
              <input type="checkbox" name="detail" value="${escapeHtml(entry.id)}" checked>
              ${escapeHtml(entry.heading)}
            </label>
          `).join("")}
        </fieldset>
      `).join("")}
    </form>
    <style>
      .${MODULE_ID}-detail-select { max-height: 560px; overflow: auto; }
      .${MODULE_ID}-detail-select p { margin: 0 0 8px; }
      .${MODULE_ID}-detail-select fieldset { border: 1px solid rgba(160, 145, 120, 0.45); margin: 8px 0; padding: 8px; }
      .${MODULE_ID}-detail-select legend { font-weight: 700; padding: 0 4px; }
      .${MODULE_ID}-detail-select label { display: block; margin: 4px 0; }
      .${MODULE_ID}-detail-select input { margin-right: 6px; }
    </style>
  `;

  return new Promise(resolve => {
    let settled = false;
    const finish = value => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const selectedIds = html => {
      const root = html?.[0] ?? html;
      return new Set(Array.from(root.querySelectorAll("input[name='detail']:checked")).map(input => input.value));
    };

    new globalThis.Dialog({
      title: `${actor.name}: PDF details`,
      content,
      buttons: {
        export: {
          label: "Export",
          callback: html => finish(selectedIds(html))
        },
        cancel: {
          label: "Cancel",
          callback: () => finish(null)
        }
      },
      default: "export",
      close: () => finish(null)
    }).render(true);
  });
}

function speciesTraitDetails(items) {
  return items
    .filter(item => item.type === "feat")
    .filter(item => normalizeValue(get(item.system ?? {}, "type.value", "")).includes("race"))
    .map(item => itemDetailEntry(item));
}

function featDetails(items) {
  return items
    .filter(item => item.type === "feat")
    .filter(item => normalizeValue(get(item.system ?? {}, "type.value", "")).includes("feat"))
    .map(item => itemDetailEntry(item, featDisplayName(item.name)));
}

function weaponMasteryDetails(actor) {
  const masteryKeys = new Set(traitValues(get(actor.system ?? {}, "traits.weaponProf.mastery", {})).map(value => String(value).toLowerCase()));
  if (!masteryKeys.size) return [];

  return actorItems(actor)
    .filter(item => item.type === "weapon")
    .filter(item => {
      const baseItem = String(get(item.system ?? {}, "type.baseItem", "")).toLowerCase();
      const identifier = String(get(item.system ?? {}, "identifier", "")).toLowerCase();
      return masteryKeys.has(baseItem) || masteryKeys.has(identifier);
    })
    .map(item => {
      const baseItem = String(get(item.system ?? {}, "type.baseItem", get(item.system ?? {}, "identifier", ""))).toLowerCase();
      const mastery = normalizeValue(get(item.system ?? {}, "mastery", ""));
      const suffix = mastery ? ` (${titleCaseIdentifier(mastery)})` : "";
      return itemDetailEntry(item, `${weaponMasteryLabel(baseItem)}${suffix}`);
    });
}

function itemDetailEntry(item, heading = item.name) {
  return {
    id: detailItemId(item, heading),
    heading: cleanText(heading),
    source: itemSourceLabel(item),
    description: itemDescription(item)
  };
}

function detailItemId(item, heading = item.name) {
  return `${item.type}:${item.uuid ?? item.id ?? item._id ?? cleanText(heading)}`;
}

function itemSourceLabel(item) {
  const type = configLabel(CONFIG.DND5E?.itemTypes?.[item.type], item.type);
  const source = cleanText(get(item.system ?? {}, "source.book", get(item.system ?? {}, "source.custom", "")));
  return [type, source].filter(Boolean).join(" - ");
}

function itemDescription(item) {
  const html = get(item.system ?? {}, "description.value", "");
  if (!html) return "";
  const container = document.createElement("div");
  container.innerHTML = html;
  return cleanFeatureDescription(cleanText(container.textContent ?? html));
}

function wrapTextByWidth(text, font, size, maxWidth) {
  const lines = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) > maxWidth) {
        if (line) lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function uniqueBy(values, getKey) {
  const seen = new Set();
  return values.filter(value => {
    const key = getKey(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function hasProficiency(entry, { allowValue = true } = {}) {
  if (entry === null || entry === undefined) return false;
  if (typeof entry === "boolean") return entry;
  if (typeof entry === "number") return entry > 0;
  if (typeof entry === "string") return /^(true|yes|proficient|expertise|\d+)$/i.test(entry) && Number(entry || 0) !== 0;

  const values = [
    entry.hasProficiency,
    entry.proficient,
    entry.proficiency,
    entry.prof,
    entry.multiplier,
    entry.prof?.hasProficiency,
    entry.prof?.proficient,
    entry.prof?.value,
    entry.prof?.multiplier,
    entry.proficiency?.hasProficiency,
    entry.proficiency?.value,
    entry.proficiency?.multiplier
  ];

  if (allowValue) values.push(entry.value);

  return values.some(value => proficiencyValue(value, { allowValue }));
}

function toolProficiencySummary(system, items) {
  const fromItems = items
    .filter(item => item.type === "tool" || isToolLikeItem(item))
    .map(item => item.name);

  const fromSystem = Object.entries(system.tools ?? {})
    .filter(([, entry]) => hasProficiency(entry, { allowValue: true }))
    .map(([key, entry]) => toolEntryLabel(key, entry))
    .filter(Boolean);

  const toolProf = get(system, "traits.toolProf", {});
  const fromTraits = [
    ...traitValues(toolProf).map(value => toolLabel(value)),
    cleanText(toolProf?.custom ?? "")
  ].filter(Boolean);

  return semicolonList(uniqueBy([...fromSystem, ...fromTraits, ...fromItems].filter(Boolean), value => value));
}

function weaponProficiencySummary(weaponProf) {
  const proficiencies = traitSummary(weaponProf);
  const mastery = traitValues(weaponProf?.mastery ?? {})
    .map(value => weaponMasteryLabel(value))
    .filter(Boolean);
  const masteryText = mastery.length ? `Mastery: ${mastery.join(", ")}` : "";
  return semicolonList([proficiencies, masteryText]);
}

function proficiencyValue(value, { allowValue = true } = {}) {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    if (/^(true|yes|proficient|expertise)$/i.test(value)) return true;
    const number = Number(value);
    return Number.isFinite(number) && number > 0;
  }
  if (typeof value === "object") {
    return proficiencyValue(value.hasProficiency, { allowValue })
      || proficiencyValue(value.proficient, { allowValue })
      || (allowValue && proficiencyValue(value.value, { allowValue }))
      || proficiencyValue(value.multiplier, { allowValue });
  }
  return false;
}

function isToolLikeItem(item) {
  const system = item.system ?? {};
  const candidates = [
    item.type,
    get(system, "type.value", ""),
    get(system, "type.subtype", ""),
    get(system, "category", ""),
    get(system, "toolType", ""),
    get(system, "baseItem", "")
  ].map(value => normalizeValue(value).toLowerCase());

  return candidates.some(value => /\b(tool|artisan|instrument|gaming|vehicle|thieves)\b/.test(value));
}

function toolEntryLabel(key, entry) {
  const label = entry?.label ?? entry?.name ?? entry?.title ?? toolLabel(key);
  const text = cleanText(label);
  return looksLikeDocumentReference(text) ? "" : text;
}

function looksLikeDocumentReference(text) {
  return /^(Compendium|Actor|Item|Scene|JournalEntry|Macro|RollTable)\./.test(text) || /^[A-Za-z0-9_-]{16,}$/.test(text);
}

function toolLabel(key) {
  const mapped = TOOL_LABELS[String(key).toLowerCase()];
  if (mapped) return mapped;

  const configs = [
    CONFIG.DND5E?.toolProficiencies,
    CONFIG.DND5E?.tools,
    CONFIG.DND5E?.toolIds
  ];
  for (const config of configs) {
    const label = configLabel(config?.[key], "");
    if (label) return label;
  }
  return titleCaseIdentifier(key);
}

function weaponMasteryLabel(key) {
  const normalized = String(key ?? "").toLowerCase();
  return WEAPON_MASTERY_LABELS[normalized] ?? titleCaseIdentifier(key);
}

function titleCaseIdentifier(value) {
  return String(value ?? "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, character => character.toUpperCase());
}

function traitLabel(key) {
  const configs = [
    CONFIG.DND5E?.weaponProficiencies,
    CONFIG.DND5E?.toolProficiencies,
    CONFIG.DND5E?.languages
  ];
  for (const config of configs) {
    const label = configLabel(config?.[key], "");
    if (label) return label;
  }
  return key;
}

function weaponBonus(item) {
  return signed(
    get(item, "labels.toHit",
      get(item.system ?? {}, "attackBonus",
        get(firstActivity(item), "attack.bonus", "")))
  );
}

function weaponDamage(item, actor) {
  const label = normalizeValue(get(item, "labels.damage", ""));
  if (label && /[+-]\s*\d/.test(label)) return label;

  const parts = get(item.system ?? {}, "damage.parts", []);
  if (Array.isArray(parts) && parts.length) {
    return parts.map(part => damageFormulaWithBonus(part.join(" "), item, actor)).join(", ");
  }

  const activity = firstActivity(item);
  const activityParts = get(activity, "damage.parts", []);
  if (Array.isArray(activityParts) && activityParts.length) {
    return activityParts
      .map(part => damageFormulaWithBonus(normalizeValue(part.formula ?? part.number ?? part), item, actor))
      .join(", ");
  }

  return label ? damageFormulaWithBonus(label, item, actor) : "";
}

function damageFormulaWithBonus(formula, item, actor) {
  const text = normalizeValue(formula);
  if (!text || /[+-]\s*\d/.test(text)) return text;

  const bonus = weaponDamageBonus(item, actor);
  if (!bonus) return text;

  const match = text.match(/^(.+?)(\s+[A-Za-z][A-Za-z\s/-]*)$/);
  if (!match) return `${text} ${signed(bonus)}`;
  return `${match[1]} ${signed(bonus)}${match[2]}`;
}

function weaponDamageBonus(item, actor) {
  const explicit = firstNumber(
    get(item.system ?? {}, "damage.bonus", ""),
    get(item.system ?? {}, "magicalBonus", ""),
    get(item.system ?? {}, "bonus.damage", ""),
    get(firstActivity(item), "damage.bonus", "")
  );
  const ability = weaponDamageAbility(item);
  const abilityMod = Number(get(actor.system ?? {}, `abilities.${ability}.mod`, 0)) || 0;
  return abilityMod + explicit;
}

function weaponDamageAbility(item) {
  const explicit = normalizeValue(
    get(item.system ?? {}, "ability",
      get(firstActivity(item), "ability",
        get(firstActivity(item), "attack.ability", "")))
  );
  if (explicit && explicit !== "none") return explicit;

  const properties = Array.from(get(item.system ?? {}, "properties", []));
  const actionType = normalizeValue(get(item.system ?? {}, "actionType", get(firstActivity(item), "type.value", "")));
  if (properties.includes("fin") || ["rwak", "rsak", "ranged"].includes(actionType)) return "dex";
  return "str";
}

function firstNumber(...values) {
  for (const value of values) {
    const number = Number(normalizeValue(value));
    if (Number.isFinite(number) && number !== 0) return number;
  }
  return 0;
}

function weaponNotes(item) {
  const properties = Array.from(get(item.system ?? {}, "properties", []));
  const range = rangeSummary(get(item.system ?? {}, "range", {}));
  return [range, properties.join(", ")].filter(Boolean).join("; ");
}

function firstActivity(item) {
  const activities = get(item.system ?? {}, "activities", {});
  return Object.values(activities ?? {})[0] ?? {};
}

function spellLevel(spell) {
  const level = get(spell.system ?? {}, "level", "");
  return Number(level) === 0 ? "0" : level;
}

function spellRange(spell) {
  const range = rangeSummary(get(spell.system ?? {}, "range", {}));
  if (range) return range;

  return rangeSummary(get(firstActivity(spell), "range", {}));
}

function spellCastingTime(spell) {
  const activation = get(spell.system ?? {}, "activation", {});
  const value = normalizeValue(activation.value);
  const type = normalizeValue(activation.type);
  if (value || type) return [value, type].filter(Boolean).join(" ");

  const activityActivation = get(firstActivity(spell), "activation", {});
  return [activityActivation.value, activityActivation.type].map(normalizeValue).filter(Boolean).join(" ");
}

function spellNotes(spell) {
  return spellIsPrepared(spell) ? "Prepared" : "Not prepared";
}

function spellIsPrepared(spell) {
  const preparation = get(spell.system ?? {}, "preparation", {});
  if (preparation.prepared === true) return true;
  if (preparation.prepared === false) return false;

  const mode = normalizeValue(preparation.mode).toLowerCase();
  if (["always", "atwill", "innate", "pact"].includes(mode)) return true;
  if (mode === "prepared") return Boolean(preparation.prepared);

  return Boolean(get(spell.system ?? {}, "prepared", false));
}

function spellRequiresConcentration(spell) {
  return Boolean(
    get(spell.system ?? {}, "duration.concentration", false)
    || get(firstActivity(spell), "duration.concentration", false)
    || spellHasProperty(spell, "concentration", "conc")
  );
}

function spellIsRitual(spell) {
  return Boolean(
    get(spell.system ?? {}, "ritual", false)
    || get(spell.system ?? {}, "components.ritual", false)
    || spellHasProperty(spell, "ritual")
  );
}

function spellHasCostlyMaterial(spell) {
  const system = spell.system ?? {};
  const materials = get(system, "materials", {});
  const explicitCost = firstNumber(
    get(materials, "cost", ""),
    get(materials, "value.cost", ""),
    get(system, "components.material.cost", "")
  );
  if (explicitCost > 0) return true;

  const materialText = [
    get(materials, "value", ""),
    get(materials, "text", ""),
    get(materials, "description", ""),
    get(system, "components.material", "")
  ].map(normalizeValue).filter(Boolean).join(" ");

  return hasMaterialComponent(spell) && /\b\d[\d,]*\+?\s*(?:gp|gold(?:\s+pieces?)?)\b/i.test(materialText);
}

function hasMaterialComponent(spell) {
  const system = spell.system ?? {};
  return Boolean(
    get(system, "components.material", false)
    || spellHasProperty(spell, "material", "m")
    || normalizeValue(get(system, "materials.value", ""))
  );
}

function spellHasProperty(spell, ...names) {
  return propertyValues(get(spell.system ?? {}, "properties", get(spell.system ?? {}, "components", {})))
    .some(value => names.includes(String(value).toLowerCase()));
}

function propertyValues(properties) {
  if (!properties) return [];
  if (properties instanceof Set) return Array.from(properties);
  if (Array.isArray(properties)) return properties;
  if (typeof properties === "object") {
    return Object.entries(properties)
      .filter(([, value]) => value === true || value === 1 || value === "true")
      .map(([key]) => key);
  }
  return [properties];
}

function rangeSummary(range) {
  const value = normalizeValue(range.value);
  const units = normalizeValue(range.units);
  if (value && units) return `${value} ${units}`;
  return value || units;
}

function componentSummary(components) {
  if (!components) return "";
  if (components instanceof Set) return Array.from(components).join(", ");
  if (Array.isArray(components)) return components.join(", ");
  if (typeof components === "object") {
    return Object.entries(components)
      .filter(([, value]) => value === true)
      .map(([key]) => key.toUpperCase())
      .join(", ");
  }
  return normalizeValue(components);
}

function safeFileName(name) {
  return cleanText(name).replace(/[\\/:*?"<>|]+/g, "-") || "character";
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
