import {
  Bell, Bot, BookOpen, CircleCheck, CircleX, Church, Clock, ClipboardList, Coins, Dices, Disc3, FlaskConical, FolderOpen, Gem, Glasses, Guitar, Hourglass,
  KeyRound, Lightbulb, Link2, Lock, LockOpen, MessageCircle, Music, Music2, Orbit, Pause, Play, Radio, Repeat, Repeat1, Rocket, Scale, Search, Shield,
  Shuffle, SkipBack, SkipForward, Sparkles, Star, Swords, TrendingUp, Trophy, Tv, UserRound, Users, Utensils, Volume1, Volume2, VolumeX, Zap,
  type LucideIcon,
} from "lucide-react";

/** The icons the site uses, by name, so data and strings can carry a plain word instead of an emoji. */
const ICONS: Record<string, LucideIcon> = {
  war: Swords, datacron: Gem, gem: Gem, shield: Shield, planet: Orbit, raid: Zap, zap: Zap, rocket: Rocket, chat: MessageCircle, me: UserRound, user: UserRound,
  blue: Bot, search: Search, roster: Users, wins: Trophy, trophy: Trophy, star: Star, music: Music, sax: Music2, food: Utensils, game: Glasses, glasses: Glasses,
  report: ClipboardList, clipboard: ClipboardList, guide: BookOpen, bell: Bell, orb: Sparkles, flask: FlaskConical, scale: Scale, hourglass: Hourglass,
  clock: Clock, link: Link2, bulb: Lightbulb, key: KeyRound, trend: TrendingUp, lock: Lock, unlock: LockOpen, check: CircleCheck, cross: CircleX,
  folder: FolderOpen, disc: Disc3, tv: Tv, coins: Coins, prev: SkipBack, next: SkipForward, pause: Pause, play: Play, shuffle: Shuffle, repeat: Repeat,
  repeat1: Repeat1, mute: VolumeX, quiet: Volume1, loud: Volume2, guitar: Guitar, dice: Dices, radio: Radio, church: Church,
};

export default function NavIcon({ name, size = 16 }: { name?: string; size?: number }) {
  const Icon = (name && ICONS[name]) || Star;
  return <Icon className="ni" size={size} strokeWidth={1.8} aria-hidden="true" />;
}
