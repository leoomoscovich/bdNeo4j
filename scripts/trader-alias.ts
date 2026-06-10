/**
 * Alias legibles y DETERMINISTAS para vendedores anónimos de CSFloat.
 * La API solo expone `username` si el stall es público; para el resto da un
 * obfuscated_id. Mismo id → siempre el mismo alias. Se marcan con aliased=true
 * para no hacerlos pasar por nombres reales.
 */

const ADJECTIVES = [
  "Silent", "Crimson", "Nordic", "Vivid", "Stoic", "Rapid", "Obsidian", "Lunar",
  "Feral", "Gilded", "Static", "Hollow", "Prime", "Vagrant", "Cobalt", "Ashen",
  "Mirage", "Vandal", "Drifting", "Ember", "Frosted", "Phantom", "Rogue", "Zenith",
];

const NOUNS = [
  "Falcon", "Viper", "Lynx", "Raven", "Mantis", "Jackal", "Orca", "Specter",
  "Badger", "Cobra", "Heron", "Wolf", "Puma", "Vulture", "Moth", "Kraken",
  "Hornet", "Fox", "Owl", "Stag", "Shark", "Gecko", "Bison", "Crane",
];

/** Hash FNV-1a simple y estable (no criptográfico, solo dispersión). */
function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function traderAlias(id: string): string {
  const h = fnv1a(id);
  const adj = ADJECTIVES[h % ADJECTIVES.length];
  const noun = NOUNS[Math.floor(h / ADJECTIVES.length) % NOUNS.length];
  const num = (h % 97).toString().padStart(2, "0");
  return `${adj}${noun}_${num}`;
}
