export interface CreatorSponsorInfo {
  githubSponsorsUrl: string
  buyMeACoffeeUrl: string
  portfolioUrl: string
  developerName: string
}

export const CREATOR_LINKS: CreatorSponsorInfo = {
  githubSponsorsUrl: 'https://github.com/sponsors/janlofredy',
  buyMeACoffeeUrl: 'https://buymeacoffee.com/janlofredyx',
  portfolioUrl: 'https://janlofre.com',
  developerName: 'Janlofredy',
}

export interface SponsorCardData {
  id: string
  title: string
  badge: string
  tagline: string
  description: string
  icon: string
  url: string
  callToAction: string
  accentColor: string
}

export const SPONSOR_ITEMS: SponsorCardData[] = [
  {
    id: 'bmac',
    title: 'Buy Me a Coffee',
    badge: 'Creator Fuel',
    tagline: 'Fuel Late-Night Engineering & Sanctuary Polish',
    description: 'Enjoying this serene writing haven? Buy a warm cup of coffee to power future features, soundscapes, and updates.',
    icon: '☕',
    url: CREATOR_LINKS.buyMeACoffeeUrl,
    callToAction: 'Buy a Coffee',
    accentColor: '#f59e0b',
  },
  {
    id: 'github-sponsors',
    title: 'GitHub Sponsors',
    badge: 'Open Source Supporter',
    tagline: 'Support my open-source project',
    description: 'Help keep The Journal Library 100% free, local-first, and independently developed with zero trackers.',
    icon: '💖',
    url: CREATOR_LINKS.githubSponsorsUrl,
    callToAction: 'Sponsor on GitHub',
    accentColor: '#ec4899',
  },
  {
    id: 'portfolio',
    title: 'Crafted by Janlofredy',
    badge: 'Creator Portfolio',
    tagline: 'Explore more sovereign & tactile web crafts',
    description: 'Designed & developed with care. Visit janlofre.com to explore more open-source experiments, tools, and creations.',
    icon: '🌐',
    url: CREATOR_LINKS.portfolioUrl,
    callToAction: 'Visit janlofre.com',
    accentColor: '#38bdf8',
  },
]
