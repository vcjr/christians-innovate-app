export type Scripture = { reference: string; text: string };

/** Verses on fellowship and building, shown one a day on the home page (KJV). */
export const SCRIPTURES: Scripture[] = [
  {
    reference: "Ecclesiastes 4:9-10",
    text: "Two are better than one; because they have a good reward for their labour. For if they fall, the one will lift up his fellow: but woe to him that is alone when he falleth; for he hath not another to help him up.",
  },
  {
    reference: "Proverbs 27:17",
    text: "Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.",
  },
  {
    reference: "Hebrews 10:24-25",
    text: "And let us consider one another to provoke unto love and to good works: not forsaking the assembling of ourselves together, as the manner of some is; but exhorting one another.",
  },
  {
    reference: "Colossians 3:23",
    text: "And whatsoever ye do, do it heartily, as to the Lord, and not unto men.",
  },
  {
    reference: "Psalm 127:1",
    text: "Except the LORD build the house, they labour in vain that build it.",
  },
  {
    reference: "1 Peter 4:10",
    text: "As every man hath received the gift, even so minister the same one to another, as good stewards of the manifold grace of God.",
  },
  {
    reference: "Proverbs 16:3",
    text: "Commit thy works unto the LORD, and thy thoughts shall be established.",
  },
];

/** The verse for [date] (YYYY-MM-DD): it changes once a day, the same for everyone. */
export function scriptureFor(date: string): Scripture {
  const day = Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
  return SCRIPTURES[((day % SCRIPTURES.length) + SCRIPTURES.length) % SCRIPTURES.length];
}

export function bibleGatewayUrl(reference: string): string {
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(reference)}&version=KJV`;
}
