import {
  Bot, BookOpen, ClipboardList, Gem, Glasses, MessageCircle, Music, Orbit, Rocket, Search, Shield, Star, Swords, Trophy, UserRound, Users, Utensils, Zap,
  type LucideIcon,
} from "lucide-react";

/** The few icons the menus and tool tiles use, by name, so navigation data stays plain strings. */
const ICONS: Record<string, LucideIcon> = {
  war: Swords,
  datacron: Gem,
  shield: Shield,
  planet: Orbit,
  raid: Zap,
  rocket: Rocket,
  chat: MessageCircle,
  me: UserRound,
  blue: Bot,
  search: Search,
  roster: Users,
  wins: Trophy,
  star: Star,
  music: Music,
  food: Utensils,
  game: Glasses,
  report: ClipboardList,
  guide: BookOpen,
};

export default function NavIcon({ name, size = 20 }: { name?: string; size?: number }) {
  const Icon = (name && ICONS[name]) || Star;
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />;
}
