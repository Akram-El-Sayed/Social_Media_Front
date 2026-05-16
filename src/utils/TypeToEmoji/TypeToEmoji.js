export const REACTIONS = [
  { emoji: "👍", type: "like"  },
  { emoji: "❤️", type: "love"  },
  { emoji: "😂", type: "haha"  },
  { emoji: "😢", type: "sad"   },
  { emoji: "😡", type: "angry" },
];

export const typeToEmoji = Object.fromEntries(REACTIONS.map((r) => [r.type, r.emoji]));