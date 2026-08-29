export type DiscCategory =
  | "all"
  | "blues-brothers"
  | "chicago-blues"
  | "stax-soul"
  | "delta-roots"
  | "community";

export type DiscTrack = {
  id: string;
  title: string;
  artist: string;
  category: "blues-brothers" | "chicago-blues" | "stax-soul" | "delta-roots" | "community";
  categoryLabel: string;
  youtubeId: string;
  album: string;
  year: number;
  duration: string;
  vibe: string;
  notes?: string;
  addedBy?: string;
  vinylColor: "amber" | "cyan" | "crimson" | "gold" | "emerald" | "purple" | "rust";
  tempo: "Driving Shuffle" | "High Energy" | "Slow & Smoky" | "Midtempo Groove" | "Jumping Stomp";
};

export type DiscSubmission = {
  id?: string;
  title: string;
  artist: string;
  youtubeUrl: string;
  submitterName?: string;
  category?: string;
  notes?: string;
};

export const DISC_CATEGORIES: Array<{ id: DiscCategory; label: string; icon: string; description: string }> = [
  { id: "all", label: "All Crates", icon: "◈", description: "The full galactic vinyl collection" },
  { id: "blues-brothers", label: "Blues Brothers", icon: "🕶️", description: "Jake & Elwood anthems and movie showstoppers" },
  { id: "chicago-blues", label: "Chicago Blues", icon: "🎷", description: "Chess Records legends and electric South Side shuffles" },
  { id: "stax-soul", label: "Stax & Soul", icon: "🎺", description: "Memphis horns, Motown grooves and soul power" },
  { id: "delta-roots", label: "Delta & Roots", icon: "🎸", description: "Acoustic slide, raw mojo and foundational blues" },
  { id: "community", label: "Guild Picks", icon: "⚡", description: "Tracks suggested and queued by guild members" },
];

export const CURATED_DISCS: DiscTrack[] = [
  {
    id: "disc-everybody-needs-somebody",
    title: "Everybody Needs Somebody to Love",
    artist: "The Blues Brothers",
    category: "blues-brothers",
    categoryLabel: "Blues Brothers",
    youtubeId: "EHV0zs0kVGg",
    album: "The Blues Brothers (Original Soundtrack)",
    year: 1980,
    duration: "3:24",
    vibe: "The defining Palace Hotel Ballroom encore. We're so glad to see so many of you lovely people here tonight!",
    vinylColor: "gold",
    tempo: "High Energy",
  },
  {
    id: "disc-soul-man",
    title: "Soul Man",
    artist: "The Blues Brothers",
    category: "blues-brothers",
    categoryLabel: "Blues Brothers",
    youtubeId: "FTWH1Fdkjow",
    album: "Briefcase Full of Blues",
    year: 1978,
    duration: "3:02",
    vibe: "Play it Steve! The raw Stax power that launched the Brothers' first platinum record.",
    vinylColor: "cyan",
    tempo: "Driving Shuffle",
  },
  {
    id: "disc-sweet-home-chicago",
    title: "Sweet Home Chicago",
    artist: "The Blues Brothers",
    category: "blues-brothers",
    categoryLabel: "Blues Brothers",
    youtubeId: "euJ22UqLD5Y",
    album: "The Blues Brothers (Original Soundtrack)",
    year: 1980,
    duration: "7:56",
    vibe: "106 miles to Chicago, full tank of gas, half a pack of cigarettes, it's dark and we're wearing sunglasses.",
    vinylColor: "amber",
    tempo: "Driving Shuffle",
  },
  {
    id: "disc-think-aretha",
    title: "Think",
    artist: "Aretha Franklin & The Blues Brothers Band",
    category: "blues-brothers",
    categoryLabel: "Blues Brothers",
    youtubeId: "RTXszRHc0qs",
    album: "The Blues Brothers (Original Soundtrack)",
    year: 1980,
    duration: "3:15",
    vibe: "Mrs. Murphy lays down the law at the Soul Food Cafe. You better think about what you're trying to do to me!",
    vinylColor: "crimson",
    tempo: "High Energy",
  },
  {
    id: "disc-shake-a-tail-feather",
    title: "Shake a Tail Feather",
    artist: "Ray Charles & The Blues Brothers Band",
    category: "blues-brothers",
    categoryLabel: "Blues Brothers",
    youtubeId: "qdbrIrFxas0",
    album: "The Blues Brothers (Original Soundtrack)",
    year: 1980,
    duration: "2:49",
    vibe: "Live from Ray's Music Exchange. Do the twist, the fly, the swim and the monkey!",
    vinylColor: "emerald",
    tempo: "Jumping Stomp",
  },
  {
    id: "disc-minnie-the-moocher",
    title: "Minnie the Moocher",
    artist: "Cab Calloway & The Blues Brothers Band",
    category: "blues-brothers",
    categoryLabel: "Blues Brothers",
    youtubeId: "250MMq0fTrU",
    album: "The Blues Brothers (Original Soundtrack)",
    year: 1980,
    duration: "3:23",
    vibe: "Curtis buys the band time at the Palace Hotel. Hi-de-hi-de-hi-de-hi, ho-de-ho-de-ho-de-ho!",
    vinylColor: "purple",
    tempo: "Midtempo Groove",
  },
  {
    id: "disc-boom-boom",
    title: "Boom Boom",
    artist: "John Lee Hooker",
    category: "chicago-blues",
    categoryLabel: "Chicago Blues",
    youtubeId: "Ig90UsFv1Wc",
    album: "The Blues Brothers (Maxwell Street Scene)",
    year: 1980,
    duration: "3:38",
    vibe: "Filmed live on Maxwell Street in Chicago outside the Soul Food Cafe. Boom boom boom boom!",
    vinylColor: "rust",
    tempo: "Midtempo Groove",
  },
  {
    id: "disc-mannish-boy",
    title: "Mannish Boy",
    artist: "Muddy Waters",
    category: "chicago-blues",
    categoryLabel: "Chicago Blues",
    youtubeId: "bSfqNEvykv0",
    album: "Hard Again",
    year: 1977,
    duration: "5:23",
    vibe: "The undisputed godfather of electric Chicago blues. Everything's gonna be alright this mornin'.",
    vinylColor: "amber",
    tempo: "Driving Shuffle",
  },
  {
    id: "disc-got-my-mojo-working",
    title: "Got My Mojo Working",
    artist: "Muddy Waters",
    category: "chicago-blues",
    categoryLabel: "Chicago Blues",
    youtubeId: "-SBmury81Ws",
    album: "At Newport 1960 (Chess Records)",
    year: 1960,
    duration: "4:08",
    vibe: "Electrifying Chess Records stomp with blazing harmonica and unstoppable South Side swing.",
    vinylColor: "gold",
    tempo: "High Energy",
  },
  {
    id: "disc-smokestack-lightnin",
    title: "Smokestack Lightnin'",
    artist: "Howlin' Wolf",
    category: "chicago-blues",
    categoryLabel: "Chicago Blues",
    youtubeId: "VMUt8KdDtTY",
    album: "Moanin' in the Moonlight (Chess Records)",
    year: 1956,
    duration: "3:07",
    vibe: "Hypnotic one-chord Chicago trance with Hubert Sumlin's legendary guitar riff and the Wolf's primal howl.",
    vinylColor: "rust",
    tempo: "Slow & Smoky",
  },
  {
    id: "disc-messin-with-the-kid",
    title: "Messin' with the Kid",
    artist: "Junior Wells & Buddy Guy",
    category: "chicago-blues",
    categoryLabel: "Chicago Blues",
    youtubeId: "cWTieCjUhVw",
    album: "Hoodoo Man Blues",
    year: 1965,
    duration: "2:54",
    vibe: "Chicago harp master Junior Wells and Buddy Guy's biting Fender Stratocaster in pure harmony.",
    vinylColor: "cyan",
    tempo: "Jumping Stomp",
  },
  {
    id: "disc-damn-right-buddy-guy",
    title: "Damn Right, I've Got the Blues",
    artist: "Buddy Guy",
    category: "chicago-blues",
    categoryLabel: "Chicago Blues",
    youtubeId: "QUKC-RHuJhQ",
    album: "Damn Right, I've Got the Blues",
    year: 1991,
    duration: "4:30",
    vibe: "Pure Chicago fire from the master of South Side bends and dynamic stage fury.",
    vinylColor: "crimson",
    tempo: "Driving Shuffle",
  },
  {
    id: "disc-wang-dang-doodle",
    title: "Wang Dang Doodle",
    artist: "Koko Taylor",
    category: "chicago-blues",
    categoryLabel: "Chicago Blues",
    youtubeId: "qyUHkY0K8HE",
    album: "Koko Taylor (Chess Records)",
    year: 1965,
    duration: "3:00",
    vibe: "Queen of the Blues Koko Taylor backed by Willie Dixon's ferocious rhythm section.",
    vinylColor: "emerald",
    tempo: "Jumping Stomp",
  },
  {
    id: "disc-hold-on-im-comin",
    title: "Hold On, I'm Comin'",
    artist: "Sam & Dave",
    category: "stax-soul",
    categoryLabel: "Stax & Soul",
    youtubeId: "6JElrEbAcwY",
    album: "Hold On, I'm Comin' (Stax Records)",
    year: 1966,
    duration: "2:36",
    vibe: "The Memphis sound produced by Isaac Hayes with Booker T. & the M.G.'s providing the thunder.",
    vinylColor: "gold",
    tempo: "High Energy",
  },
  {
    id: "disc-dock-of-the-bay",
    title: "(Sittin' On) The Dock of the Bay",
    artist: "Otis Redding",
    category: "stax-soul",
    categoryLabel: "Stax & Soul",
    youtubeId: "rTVjnBo96Ug",
    album: "The Dock of the Bay (Stax Records)",
    year: 1968,
    duration: "2:45",
    vibe: "Timeless soul masterpiece recorded just days before Otis's tragic flight. Whistling out to the bay.",
    vinylColor: "cyan",
    tempo: "Midtempo Groove",
  },
  {
    id: "disc-green-onions",
    title: "Green Onions",
    artist: "Booker T. & the M.G.'s",
    category: "stax-soul",
    categoryLabel: "Stax & Soul",
    youtubeId: "0oox9bJaGJ8",
    album: "Green Onions (Stax Records)",
    year: 1962,
    duration: "2:54",
    vibe: "The coolest Hammond M3 organ groove in galactic history, featuring Steve Cropper on guitar and Duck Dunn on bass.",
    vinylColor: "emerald",
    tempo: "Midtempo Groove",
  },
  {
    id: "disc-born-under-a-bad-sign",
    title: "Born Under a Bad Sign",
    artist: "Albert King & Stevie Ray Vaughan",
    category: "stax-soul",
    categoryLabel: "Stax & Soul",
    youtubeId: "SeLddbrzsHk",
    album: "In Session (Stax Records)",
    year: 1983,
    duration: "4:15",
    vibe: "If it wasn't for bad luck, I wouldn't have no luck at all. Legendary dual blues summit.",
    vinylColor: "purple",
    tempo: "Driving Shuffle",
  },
  {
    id: "disc-thrill-is-gone",
    title: "The Thrill Is Gone",
    artist: "B.B. King",
    category: "stax-soul",
    categoryLabel: "Stax & Soul",
    youtubeId: "SgXSomPE_FY",
    album: "Completely Well",
    year: 1969,
    duration: "5:26",
    vibe: "Lucille sings with heartbreaking vibrato and lush strings. The definitive modern blues track.",
    vinylColor: "amber",
    tempo: "Slow & Smoky",
  },
  {
    id: "disc-id-rather-go-blind",
    title: "I'd Rather Go Blind",
    artist: "Etta James",
    category: "stax-soul",
    categoryLabel: "Stax & Soul",
    youtubeId: "Bcus42ihkTI",
    album: "Tell Mama (Chess Records)",
    year: 1968,
    duration: "2:35",
    vibe: "Recorded at Fame Studios in Muscle Shoals for Chess. One of the most passionate vocal performances ever cut to vinyl.",
    vinylColor: "crimson",
    tempo: "Slow & Smoky",
  },
  {
    id: "disc-pride-and-joy",
    title: "Pride and Joy",
    artist: "Stevie Ray Vaughan & Double Trouble",
    category: "delta-roots",
    categoryLabel: "Delta & Roots",
    youtubeId: "kfjXp4KTTY8",
    album: "Texas Flood (Live at Montreux)",
    year: 1983,
    duration: "3:39",
    vibe: "Unrelenting Texas shuffle with heavy gauge strings and blistering Strat tone inspired by Chicago legends.",
    vinylColor: "gold",
    tempo: "High Energy",
  },
  {
    id: "disc-she-caught-the-katy",
    title: "She Caught the Katy",
    artist: "The Blues Brothers",
    category: "blues-brothers",
    categoryLabel: "Blues Brothers",
    youtubeId: "o5xexv-dMrM",
    album: "The Blues Brothers (Original Soundtrack)",
    year: 1980,
    duration: "4:10",
    vibe: "The opening credits theme as Jake walks out of Joliet Prison to Elwood in the Bluesmobile.",
    vinylColor: "amber",
    tempo: "Midtempo Groove",
  },
  {
    id: "disc-peter-gunn",
    title: "Peter Gunn Theme",
    artist: "The Blues Brothers Band",
    category: "blues-brothers",
    categoryLabel: "Blues Brothers",
    youtubeId: "9DgFOsEs-kE",
    album: "The Blues Brothers (Original Soundtrack)",
    year: 1980,
    duration: "3:19",
    vibe: "Driving detective bassline and blazing horn section as the Bluesmobile outruns the Illinois State Police.",
    vinylColor: "cyan",
    tempo: "Driving Shuffle",
  },
  {
    id: "disc-rawhide",
    title: "Theme from Rawhide",
    artist: "The Blues Brothers",
    category: "blues-brothers",
    categoryLabel: "Blues Brothers",
    youtubeId: "RdR6MN2jKYs",
    album: "The Blues Brothers (Original Soundtrack)",
    year: 1980,
    duration: "2:38",
    vibe: "Live behind chicken wire at Bob's Country Bunker. Rollin', rollin', rollin', keep them doggies rollin'!",
    vinylColor: "rust",
    tempo: "Driving Shuffle",
  },
  {
    id: "disc-gimme-some-lovin",
    title: "Gimme Some Lovin'",
    artist: "The Blues Brothers",
    category: "blues-brothers",
    categoryLabel: "Blues Brothers",
    youtubeId: "-aqZmPInK3o",
    album: "The Blues Brothers (Original Soundtrack)",
    year: 1980,
    duration: "3:06",
    vibe: "Steve Cropper's guitar rhythm and the horn section in top gear.",
    vinylColor: "gold",
    tempo: "High Energy",
  },
  {
    id: "disc-jailhouse-rock",
    title: "Jailhouse Rock",
    artist: "The Blues Brothers",
    category: "blues-brothers",
    categoryLabel: "Blues Brothers",
    youtubeId: "hjLruk4uZzQ",
    album: "The Blues Brothers (End Credits)",
    year: 1980,
    duration: "3:17",
    vibe: "The prison yard finale with the entire band and inmates jumping to the beat.",
    vinylColor: "cyan",
    tempo: "High Energy",
  },
  {
    id: "disc-flip-flop-fly",
    title: "Flip, Flop & Fly",
    artist: "The Blues Brothers",
    category: "blues-brothers",
    categoryLabel: "Blues Brothers",
    youtubeId: "zkXf41oH0dI",
    album: "Briefcase Full of Blues",
    year: 1978,
    duration: "3:35",
    vibe: "Jump blues classic with Jake's full-throttle vocals and blazing harmonica solo.",
    vinylColor: "crimson",
    tempo: "Jumping Stomp",
  },
  {
    id: "disc-born-in-chicago",
    title: "Born in Chicago",
    artist: "The Paul Butterfield Blues Band",
    category: "chicago-blues",
    categoryLabel: "Chicago Blues",
    youtubeId: "nNkNuVRhkks",
    album: "The Paul Butterfield Blues Band",
    year: 1965,
    duration: "3:10",
    vibe: "I was born in Chicago, 1941. Mike Bloomfield's blistering electric guitar and Butterfield's harp.",
    vinylColor: "emerald",
    tempo: "Driving Shuffle",
  },
  {
    id: "disc-my-babe",
    title: "My Babe",
    artist: "Little Walter",
    category: "chicago-blues",
    categoryLabel: "Chicago Blues",
    youtubeId: "duRp_avXtMM",
    album: "The Best of Little Walter (Chess Records)",
    year: 1955,
    duration: "2:40",
    vibe: "The defining amplified Chicago blues harmonica track written by Willie Dixon.",
    vinylColor: "purple",
    tempo: "Midtempo Groove",
  },
  {
    id: "disc-cross-road-blues",
    title: "Cross Road Blues",
    artist: "Robert Johnson",
    category: "delta-roots",
    categoryLabel: "Delta & Roots",
    youtubeId: "Kxi4XkIVWLQ",
    album: "King of the Delta Blues Singers",
    year: 1936,
    duration: "2:41",
    vibe: "The mythical midnight meeting at the crossroads that gave birth to modern blues and rock.",
    vinylColor: "rust",
    tempo: "Slow & Smoky",
  },
];

export function parseYouTubeId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const hostname = url.hostname.toLowerCase();

    if (hostname.includes("youtu.be")) {
      const pathname = url.pathname.slice(1).split("/")[0]?.split("?")[0];
      if (pathname && /^[a-zA-Z0-9_-]{11}$/.test(pathname)) {
        return pathname;
      }
    }

    if (hostname.includes("youtube.com") || hostname.includes("youtube-nocookie.com")) {
      const v = url.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) {
        return v;
      }

      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" || parts[0] === "v" || parts[0] === "shorts") {
        const id = parts[1]?.split("?")[0];
        if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
          return id;
        }
      }
    }
  } catch {
    const match = trimmed.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/i);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

export async function getDiscsCatalog(): Promise<DiscTrack[]> {
  return CURATED_DISCS;
}
