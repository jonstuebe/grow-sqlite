/**
 * Generates fun kebab-case device names like "brave-dolphin" or "swift-otter"
 */

const adjectives = [
  "brave",
  "clever",
  "swift",
  "gentle",
  "mighty",
  "happy",
  "cosmic",
  "golden",
  "silver",
  "crystal",
  "noble",
  "wild",
  "calm",
  "bold",
  "bright",
  "fluffy",
  "fuzzy",
  "sleepy",
  "speedy",
  "sneaky",
  "lucky",
  "plucky",
  "sparkly",
  "stellar",
  "super",
  "turbo",
  "ultra",
  "mega",
  "hyper",
  "atomic",
];

const animals = [
  "dolphin",
  "penguin",
  "otter",
  "fox",
  "owl",
  "panda",
  "koala",
  "wolf",
  "bear",
  "eagle",
  "hawk",
  "tiger",
  "lion",
  "whale",
  "seal",
  "rabbit",
  "deer",
  "moose",
  "falcon",
  "raven",
  "badger",
  "beaver",
  "hedgehog",
  "raccoon",
  "squirrel",
  "turtle",
  "octopus",
  "jellyfish",
  "starfish",
  "seahorse",
];

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generates a random device name in kebab-case format
 * @example "brave-dolphin", "swift-otter", "fluffy-penguin"
 */
export function generateDeviceName(): string {
  const adjective = randomElement(adjectives);
  const animal = randomElement(animals);
  return `${adjective}-${animal}`;
}
