# Changelog

This project uses semantic versioning while it is under active development.

## 1.45.0 — 2026-10-18

- **Web research can now be kept.** Under a B-Lue3 answer that came from a web search, **Add these counters to the guild list** turns the answer into proper counters (enemy squad, your squad, how to run it, and the page it came from). Each one is checked by the site (real units, a squad that fits the mode, a source the search actually found) and goes to the officer review queue. Nothing is public until an officer publishes it, so the next person who searches for that squad finds it free, with no question used.
- **The Ask page is tidier.**
  - B-Lue3's answers show headings and dividers properly (no more `###` and `---`).
  - The conversation flows down the page instead of sitting in a scrolling box inside the page.
  - The questions-left line is one compact line, and the officer-only details are folded under "Officer info".

## 1.44.0 — 2026-10-18

- **Two new buttons under every counter: "Swap a unit" and "I have a better counter".**
  - **Swap a unit:** pick who to take out, search for who to put in, say why (optional) and whether you tried it or it is just an idea. It becomes a new version of the counter with that one change.
  - **I have a better counter:** opens the add form with the enemy already filled in.
  - Both go to an officer for a check and **point back at the counter they would improve**, so the review queue shows "A suggestion to improve: …". The existing counter stays live until an officer decides. Nothing changes for other members until then.

## 1.43.0 — 2026-10-18

- **Fill the counter list in one go (officers).** On the review page, **Research the popular squads** has B-Lue3 search the web, one after another, for the 30 enemy squads members meet most (Lord Vader, Darth Revan, Jedi Knight Revan, Grand Master Yoda and so on) in the mode you pick. Every counter he finds goes into the review queue with its source page, and nothing is published until an officer says so. It shows progress as it goes, can be stopped, and stops cleanly if the weekly research allowance runs out (raise `BLUE_RESEARCH_LIMIT` in Vercel to do more in one go).
- **"Add to the list" when a search finds nothing.** In Find a counter, the empty result now has an **Add a counter you know** button that opens the form for that squad. When B-Lue3 finds nothing in the guild's knowledge, his reply has an **Add one you know to the guild list** button that takes you to the same form with the enemy filled in. Adding is free and goes to an officer for a check.

## 1.42.1 — 2026-10-18

- **Web search in B-Lue3 now answers.** "Search the web with B-Lue3" was running the web search and B-Lue3's own lookups together, which Google's model can't do reliably, so it ran out of steps and came back empty. The web search now runs on its own, like the officer counter research does, and only when a member taps the button. Everyday questions no longer attempt a web search first, which is faster and cheaper.
- **You can see it working.** The search button turns into a spinner reading "Searching the web… up to 30 seconds" and B-Lue3's reply line says what he is doing, instead of looking like nothing happened.
- **Dougie's Discs:** the Dougie's Discs picture is back under the header, the header text is no longer cut off on a phone, and the jukebox controls have more room.
- **Who's online on a phone** is now a small round button with the count, and it steps aside while a menu is open, so it no longer covers the menus.

## 1.42.0 — 2026-10-18

- **A Launch checklist for officers** (Officers → Launch checklist, or `/officer/launch`) showing the live numbers behind day one: whether B-Lue3's AI and web search are on, how many counters members can actually find, how many are waiting for review or still to import from Saved squads, tips and ideas published, how many members have signed in this week and linked Discord, anyone waiting on "Help me, Obi-Wan", and which Discord channels and widget are set up. Each line is green, amber or red, says what it means in plain words and links to where to fix it.

## 1.41.2 — 2026-10-18

- **Who's online: the other two lists are more useful.**
  - **"Last seen in the game"** now covers the last 24 hours instead of 3, so more members show with a "3 h ago" style time. The game's own activity data is refreshed hourly, so it can lag a little.
  - **On Discord:** officers now see a one-line hint (Server Settings → Widget → Enable Server Widget) in the panel until that list is switched on. Discord only shares who is online through that widget.

## 1.41.1 — 2026-10-18

- **Who's online is easier to trust.** The panel now has an **"On the site earlier today"** list (who was seen in the last day, and how long ago), so you can tell "Dougie was here 12 minutes ago" from "Dougie never connected". If the list can't load, it says so with the error instead of "Looking…" forever. It also re-checks the moment you come back to the tab or the app (an iPad pauses a page's timers when it is in the background, which made people drop off the list).

## 1.41.0 — 2026-10-18

- **"Help me, Obi-Wan, you're my only hope to get logged in."** A new button on the front page, the sign-in panel, the help page, the sign-in problem notice and the Gig and members-only doors. Someone who can't get in types their in-game name (and, if they like, their Discord name and what is happening) and taps send. Officers see it under **Officers → Sign-in links** with a **Find them** button, make a personal link and tap **Done**. If an officer channel is set up in Discord, it is posted there too.
- **Sign-in tracker for the site admin** (Officers → Sign-in tracker in the control panel, or `/admin/signin`): over the last 30 days, how many started signing in, how many got in, how many needed their ally code, stalled for 7+ seconds, gave up, hit an error or asked for help, plus which kinds of device and browser struggle (for example "In-app browser"). Nobody is identified; it only counts.

## 1.40.1 — 2026-10-18

- **The Home control panel is more compact on an iPad.** In landscape (with the menu open) and in portrait it now sits in two columns, your standing and review count on the left and the setup checklist on the right, instead of one tall stack, so Ask B-Lue3 is higher on the screen.

## 1.40.0 — 2026-10-18

- **Officers can now sign a member in without Discord.** For someone like a member whose Discord login page won't load, an officer opens **Officers → Sign-in links**, picks the member, and gets a one-time link plus a ready-to-send message. The member taps the link, taps **Sign me in**, and is in (for about three months on that device). The link works once and lasts two days; link previews in chat can't use it up.
- **A refresh button that only refreshes this site.** It is the round-arrow icon next to Sign in on the front page and on Home, a "Refresh the site" button at the bottom of the left menu, and a button on the sign-in panel, the help page and the Gig and members-only doors. It forgets this site's saved pages and background worker and reloads, like closing and reopening the app, without touching other tabs or apps. You stay signed in and keep your settings.
- **Help page:** a new step says to log in to discord.com first (in another tab) and then tap Sign in, which skips Discord's login pages, and points to the officer link as the fallback.

## 1.39.0 — 2026-10-18

- **A plain-English "Signing in, step by step" help page** (`/help/sign-in`), written for people who aren't comfortable with computers: five short steps in big text (use Safari or Chrome, tap once, check the Discord name, Authorise, type your ally code once) and what to do about a white screen, a password or emailed-code prompt, or being signed in to the wrong Discord account.
- It is linked from the front page, the "Opening Discord…" panel, the sign-in problem notice, the Gig door and the ally-code step.
- On the ally-code step, the site now says which Discord account you're on and offers **"sign in with a different one"**, and the "Where do I find my ally code?" tip is open by default.

## 1.38.0 — 2026-10-18

- **"Who's online" is now on the Home page too**, in the header next to the welcome line, with the live count. (On phones the floating pill steps aside on Home so it isn't shown twice.)
- **Sign-in fixes, after a member reported a white screen on his phone:**
  - Tapping Sign in now opens a clear **"Opening Discord…"** panel and ignores extra taps. Tapping it many times used to start the sign-in over and over and could break it.
  - If nothing happens after a few seconds, or the page is open inside an app's built-in browser (Discord, Facebook, Instagram…), the panel says to **open the site in Safari or Chrome** and has a button to copy the link.
  - First-time sign-ins now go to Discord's approval screen in one step instead of trying silently, failing and retrying, which is a likely cause of the blank page. Returning members still skip it.
  - The panel also explains that Discord asking for an email and password is Discord's own sign-in.

## 1.37.0 — 2026-10-18

- **New "Who's online" button.** On a laptop it is at the bottom of the left menu; on a phone it is a small pill just above the tab bar. It shows a green dot and how many members have the site open right now. Tap it to see:
  - **On the site now**, updated about every minute,
  - **On Discord now**, if the guild's Discord server has its widget switched on (otherwise this part stays hidden),
  - **In the game recently**, from the game's own last-activity time (so it can lag a little).
- Anyone can tick **Appear offline on this device** in that panel. Only names are shown, never where someone is.

## 1.36.0 — 2026-10-17

- **The logged-out front page has its identity back.** The Blues Brothers logo and name sit at the top with a Sign in button; the full Blues Brothers banner is back under it (shown whole on a phone); and the two real buttons, **Sign in with Discord** and **Thinking of joining?**, are large and full width.
- **Collapsible sections on a phone:** Join us (open by default), Check your stats, How we get on, news and Field guides each fold to a one-line summary so the page is short; on a laptop they are open boxes as before.
- The four guild numbers sit in one compact row.

## 1.35.2 — 2026-10-17

- **The doorman droid picture is also on the "members only" door**, so a visitor who hits a members page sees the same door as the Gig page.

## 1.35.1 — 2026-10-17

- **The doorman droid is back on The Gig is In Session door**, as a wide picture under the header with the neon sign, the droid and the queue all in view.

## 1.35.0 — 2026-10-17

- **The front page, the "members only" door and The Gig is In Session now match the rest of the site**: the slim glass header, frosted boxes and the themed background, so there is one look from the first visit. Same content, same sign-in buttons; the front page keeps its stats, how to join, ally-code check, war record and news.
- Fixed an empty dark strip down the left side of these pages for visitors (it was room kept for the member menu).

## 1.34.0 — 2026-10-17

- **Field guides and the officer Announcement editor now match the rest of the site** (slim glass header, themed background). The guides themselves are unchanged. The logged-out front page and "The Gig is In Session" door keep their own artwork on purpose.

## 1.33.0 — 2026-10-17

- **The Guild and Operations pages now match the rest of the site**: the slim glass header, the same frosted link cards and your themed background, instead of the old tall banner. Operations still shows the live facts (war status, tickets today, guild power) on each card, and its Counters card now goes to Ask → Find a counter.

## 1.32.0 — 2026-10-17

- **Ask page release 4: asking the guild is now part of Find a counter.**
  - When the guild has no counter for the squad you searched, you can **ask the guild right there** (add a note if it helps). It goes to the counters channel in Discord as before.
  - A new **Members asking for a counter** list sits under the finder. Tap **I know a counter** to add one with the enemy already filled in; cancel your own request any time.
  - **You get told:** when an officer checks a counter for something you asked about, you're mentioned in Discord, and get a notification on your phone if you have notifications on.

## 1.31.0 — 2026-10-17

- **Ask page release 3: a clearer counter card and an easier way to add one.**
  - **The counter card** now leads with the answer: **Use** (your squad to bring, highlighted) first, then **Against** (who you face), then the how-to, which folds to three lines with **Read more**. A green **You can run this** or an orange **Not yet** (and exactly what you still need, like "Admiral Piett: R3 → R5") shows at the top, worked out from your own roster. "I use this" and the sources sit in a quiet footer.
  - **Adding a counter is four short steps:** 1) who are you facing (mode pills and the enemy squad), 2) what beats it, 3) how you run it, 4) how you know it works (four plain choices: I beat it with this, I saw it done, I read it, untested idea). Squads are rows of chips filled from one search box, and **your own strongest units** are one tap away under "From your roster". Opening moves, Datacron dates and links are tucked under "More detail". The Send button waits until both squads are full and you have said how to run it, and says what is missing.
  - Officers still check every counter before others see it.

## 1.30.1 — 2026-10-17

- **The old Saved squads link now redirects properly** (a real server redirect to Ask → Find a counter), so bookmarks and shared links land without a blank flash.

## 1.30.0 — 2026-10-17

- **Ask page release 2: one place for counters.** **Saved squads is retired as a separate page.** Opening it (or an old link) takes you to Ask → **Find a counter**, and the menu now says "Find a counter" instead. You can **add a counter right there** (+ Add a counter, with the enemy leader already filled in), and remove your own saved squads from the results.
- **Officers can bring the old saved squads into the review queue.** A new notice on the review page offers it (only while some are waiting). Each comes in as a candidate with its original author kept. The older list only said "GAC", not 5v5 or 3v3, so those come in as 5v5 with a note asking the reviewer to confirm, and a squad saved for both comes in once for Territory War and once for GAC. Run it twice and nothing is duplicated.
- Once an imported counter is published, it shows once (in the checked list), not again under "Saved by members".

## 1.29.0 — 2026-10-17

- **The Ask page, release 1: ask, or find a counter.** The Ask page is on the new look and has two tabs. **Ask B-Lue3** is the chat as before (in a glass frame, orange Ask button). **Find a counter** is new: pick the enemy squad's leader, optionally a mode (Territory War, GAC 5v5, GAC 3v3), and see the counters officers have checked and the squads members have saved, each with whether you can run it. It is free and never uses a question. If the guild has nothing, two buttons appear: **Ask B-Lue3 to search the web** (uses a question, and fills the chat for you) or **Ask the guild for a counter**.
- **How B-Lue3 answers** (free guild knowledge, then web search, then AI, with what each costs and your questions left) stays in view in a side column on a laptop, and under the page on a phone. The order and the warning are unchanged.
- Counters, Saved squads and the Knowledge pages are untouched. Later releases bring them together.

## 1.28.0 — 2026-10-17

- **More and Credits on the new look.** More drops the big picture banner for the slim header and the themed background: Account (My page, theme, add to home screen, Discord, sign out), Notifications, Off duty and the officer links are all glass cards with the blue glow, two across on a laptop. Credits has the same header, glass cards for 1Zero9 Studio and the open-source projects, and glass notes for Mission From God and the property notice. Both read on the light theme.

## 1.27.1 — 2026-10-17

- **Quieter server logs.** The database connection now states its security mode outright (the same one it was already using), so the driver's repeated "SECURITY WARNING: SSL modes…" notice stops appearing. Nothing changes for members.

## 1.27.0 — 2026-10-17

- **A usage log for the site admin.** A private page (`/admin/usage`, linked from the control panel's Officers tab, admin only) shows who uses the site and from where: members using it in the last 14 days, who has gone quiet, who has not been seen yet, the countries, US states and cities the band is in (useful for meet-ups), and the latest visits. Needs one new table; recording begins from this release.

## 1.26.1 — 2026-10-17

- **The B-Lue3 ask box just says "Game questions only."** (the line about questions being recorded is gone).

## 1.26.0 — 2026-10-17

- **Favourites in the laptop menu.** The items under Home (My page, Ask B-Lue3, Guild chat, Feedback) stay fixed. Every other page now has a **star** that shows when you point at it: click it and the page is pinned to a **Favourites** list right under the fixed items; click the filled star (in Favourites or in its own group) to unpin. Your favourites are kept on that device, in the order you pinned them. Officer pages can only be pinned by officers.

## 1.25.0 — 2026-10-17

- **Guardrails on B-Lue3.**
  - **Game questions only.** Before anything is spent, a free filter stops obvious misuse: code and programming requests, "write me a poem/email/essay", attempts to change his rules or read his instructions, off-topic subjects (money, weather, homework) and tricks to get round the question limit. The AI is also told to refuse anything outside Star Wars: Galaxy of Heroes, this guild and this site. Refused questions do not use up the weekly allowance.
  - **Switch-off for misuse.** The guild leader can cut a member off from B-Lue3; a cut-off member gets a clear message and nothing is answered.
- Needs two new database tables, added by a migration on the next production build, and one server setting.

## 1.24.1 — 2026-10-17

- **B-Lue3's pop-up is easy to read.** When you tap B-Lue3, the page behind now dims and blurs, and the pop-up is a solid card with an orange edge and an orange Ask button (dark on Deep and Classic, white on Rebel). Before, the page's words showed through it.

## 1.24.0 — 2026-10-17

- **The officer pages on the new look.** The roster report, Discord sync and the review queue use the slim header and themed picture instead of tall banners, and the same glass frames.
  - **Roster report:** glass tiles (active, need attention, archive), a glass search bar, and the table in a glass frame with rows that highlight on hover and an orange tint for anyone needing attention. On a phone the table scrolls sideways.
  - **Discord sync:** tiles, drift cards, the audit trail and the link pop-up follow the theme, with orange for the main actions and red outlines for demote and unlink.
  - **Review queue:** header with a link back to Knowledge.

## 1.23.0 — 2026-10-17

- **Guild chat on the new look.** Slim header and themed picture, and the chat sits in one glass frame: channel tabs as pills (the open one orange), the messages in the middle, an orange Send button, and the read-only note when posting is off. It fits the screen height on a laptop and sits clear above the dock on a phone. Colours follow the theme, so messages read on the light theme too.

## 1.22.0 — 2026-10-17

- **The Wins on the new look.** Slim header and themed picture instead of the tall banner; the four weekly counts (Galactic Legends, Ultimates, Relic level-ups, Members levelled up) are glass tiles, two across on a phone; each day is a glass panel where the big wins (legends, ultimates, Relic 7+) glow orange and the routine ones are quiet rows, with "more upgrades" folding underneath. A link to Guild activity sits at the foot.

## 1.21.0 — 2026-10-17

- **Overview on the new look.** The big hero picture, the site bar and the long footer are gone; it opens with the slim header and the same glass frames as the rest of the site. Guild health tiles (members, power, tickets, needs attention) sit in a row (two across on a phone), then the Guild Wire beside the Discord box, then Wall of Fame and the watchlist, then who has just joined. The Wire's items and the leaderboards follow the theme, with orange for the action buttons.

## 1.20.0 — 2026-10-17

- **An identity bar on phone Home.** The emblem and "Blues Brothers · Guild hub" now sit across the very top (tap it for Home), with the My page icon at the right. "Welcome, name" and the guild numbers sit right under it. Laptops already have the logo in the sidebar.

## 1.19.0 — 2026-10-17

- **Mission From God inside the new frame.** The old site bar is replaced by the slim header and the themed picture, and the game sits in one framed panel instead of filling the whole screen with big gaps above it. The game itself (intro, datapad, trading) is unchanged and keeps its dark console look.
- **Fixed the "How to play" pop-up.** It was squeezed into a narrow column inside the intro panel; it is now a centred full-screen pop-up with the same look as before.

## 1.18.1 — 2026-10-17

- **Both brothers show on a phone.** The Home picture was cropped to a slice, cutting off the second man. On a phone it now sits at the foot of the page at a size that fits both brothers and the car, and fades up into the sky colour. The boxes sit over the sky, not their faces.

## 1.18.0 — 2026-10-17

- **Soul Food Cantina on the new look.** The tall banner is replaced by the slim header and the themed picture. The cantina's own dark "kitchen" panel stays (the recipe cards, tap-droid beer advisor and submit-a-recipe form), but its huge duplicate title is gone, so you reach the sandwiches straight away. It is tighter on a phone.

## 1.17.0 — 2026-10-17

- **A calmer phone.**
  - **The dock has sub-menus.** Tap Knowledge, Guild or More and a glass menu rises above the dock: Knowledge (Counters, Tips, Ideas, Saved squads, Field guides), Guild (Guild chat, Roster, Who has, Activity, Wins, Overview, plus the War room pages), and More (My page, Feedback, Notifications, Off duty, and the officer tools for officers). Tap a link, tap outside or press Escape to close. Home and Ask still go straight to their page.
  - **Home folds up.** On a phone, War room, Act now and The Wins are each one tappable line with a short summary ("Won vs Rebel Scum · 2 callouts open · 2,430 of 29,400 tickets", "5 things need you"). Tap to open. Laptops are unchanged.
  - **Less crowding on other pages:** page intros are cut to two lines, number tiles are smaller, and the footer links on Home are hidden.

## 1.16.0 — 2026-10-17

- **Dougie's Discs on the new look.** The tall banner is gone, replaced by the slim header and the themed picture. The jukebox itself (turntable, screen, Spin and queue) stays a dark hi-fi, as it should. Under it, "Speakeasy Quotes & Analog Drops" and "Digging in Dougie's Vinyl Crate" are glass frames that follow the theme: orange selected crate, orange Sleeves/Compact switch, glass quote cards, and the dark record sleeves keep their coloured labels and light text. It reads on the light theme now (before, the shelf headings and filters were pale on white).

## 1.15.0 — 2026-10-17

- **A floating glass dock on phones and tablets.** The bottom tab bar is now a rounded, frosted-glass pill that floats above the page (Home, Ask, Knowledge, Guild, More), with a soft capsule behind the page you are on. It is clear glass on Rebel and tinted glass on Deep and Classic. B-Lue3's icon and the announcement sit just above it.
- **Arsenal on the new look.** The coverage tiles, each collection (Galactic Legends and the rest) and every unit card are the same see-through frames with the blue hover glow, orange progress bars, and clear text on the light theme.

## 1.14.0 — 2026-10-17

- **The Datacron vault on the new look.** The four number tiles, the tabs (Guild Datacron Vault, Active Sets & Meta Codex, TW Command Synergies, Reroll & Farming Advisor), the search and filter bar, every datacron card, the table view, the leaderboard and the signature roster are all the same see-through frames with a blue glow on hover, and they now read properly on the light theme (before, gold and pale text vanished on white).
- **Tabs are pills** with the chosen one in orange; the active filter is orange; Cards/Table is an orange toggle. Gold, purple and cyan cards keep their tier colour on the border, with darker names on the light theme.
- **On a phone** the tabs scroll sideways and the cards and filters stack.

## 1.13.0 — 2026-10-17

- **Territory Battles on the new look, top to bottom.**
  - **Callouts:** each is a glass card with the unit and what it needs, a big orange "3/5 ready" count and a progress bar, who is ready and who is closest, and a green outline and "All filled" once it is done. Blue glow on hover.
  - **The plan, phase by phase:** glass cards with clear "Three star" (green) and "Hold" (orange) tags.
  - **Officer tools:** the folded "Officer planning tools" box, the star optimiser (phase buttons, zone cards, star toggles, GP boxes, the orange Optimise button, the Discord export) and the per-planet command tool (strategy tags for preload, three star, hold and skip) all use the same frames and follow the theme, light and dark.
  - On a phone the planner and planet rows stack in one column.

## 1.12.0 — 2026-10-17

- **The Territory War planner on the new look.** The officer command tool sits in one glass frame: the plan name and a clear ACTIVE / DRAFT pill, the status and "Clone" controls, then the modes (Prepare, Match-up, Defence, Attack, Workload, Discord, Templates) as pills with the current one in orange and a red count of problems on Defence. Zones, commands, defenders and the offence reserve are all glass rows that follow the theme (light and dark), with orange for the main buttons and blue on hover.
- **Better on a phone:** the zone list stacks above the zone, the side panels drop underneath, and the mode pills scroll sideways.
- The planner's drag and drop and every action work as before. Only the look changed.

## 1.11.0 — 2026-10-17

- **My page is now right under Home** in the menu (it left the "You" group).
- **A My page icon at the top right of Home on a phone** (and tablet), with an orange dot when you have a check-in to do.
- **My page fixed for the light theme.** The B-Lue3 briefing was a dark box with dark text on Rebel, and several links and the notification tick were pale colours on a white page. Every box on My page now follows the theme: the briefing is orange-tinted glass with an orange button, the question buttons, roster report, counters, callouts, wins and notifications are glass frames with readable text, and it has the slim header and the picture behind it like the other pages.

## 1.10.0 — 2026-10-17

- **War room pages on the new look.** Raids, Territory War, Territory Battles, Datacrons and Arsenal now use the slim header and the themed picture instead of the tall banner, with the same see-through frames and blue hover glow as the rest of the site. The number tiles (tickets, members, scores) are a row of glass tiles; the live-war strip, the matchup (Blues Brothers vs the opponent), the last result, the notes and the empty states are glass too; and the page footers are one quiet row of links.
- **Raids in full:** the raid tabs are pills (the chosen one orange), the standings are tidy rows with rank, name and damage, and the search sits in the same frame.
- The deeper tools inside Territory War, Territory Battles and the Datacron vault keep their own layouts for now. They sit inside the new frames; I will bring them across one at a time.

## 1.9.0 — 2026-10-17

- **Roster and "Who has…?" get the new look.** The tall banner is replaced by the slim header (with the active and new-member counts). "Who has…?" is a glass box with an orange **Search** button, and its answer lists holders in neat columns. Fresh arrivals, search and sort, and the leaving list are all the same see-through frames with the blue hover glow.
- **Member cards on the roster are tidier:** a round badge (green for the leader, orange for officers, blue for members), name, level and time in the band, then four number tiles (power, legends, tickets, relics) and "Open card". Anyone on the check-in list gets an orange edge. On a phone each card is full width with all four numbers.
- **The member pop-up follows the theme** (it was always dark). Power over a billion now reads "1.24B" instead of "1240M".

## 1.8.0 — 2026-10-17

- **A legend on the member cards.** The list has a key at the top: a coloured dot and edge for each member (green = Pillar, blue = Steady, yellow = 1 thing to look at, orange = Needs a nudge) and "the orange number is how many things to look at". Each tile now shows the top thing to watch in words, and a card has its own key too.
- **Faster, and a record.** Cards are now saved in the database. Opening one is instant when it was worked out in the last 6 hours; older ones are rebuilt and saved. Opening the member list rebuilds every card in the background when the newest is over 12 hours old. **Refresh** (on a card) and **Refresh all** (on the list) rebuild from live data on demand.
- **Over time.** Every saved card is kept, and each card shows an "Over time" history: date, verdict, strengths and watch-outs, and power, so you can see who is slipping or improving.
- Needs one new database table (`MemberCardSnapshot`), added by a migration on the next production build.

## 1.7.0 — 2026-10-17

- **Member cards for officers.** New page **Officers → Member cards**: search the roster, open anyone, and get one card that pulls everything together.
  - **The verdict first:** "Pillar of the band", "Pulling their weight" or "Needs a nudge", then **What they bring** (top third for power, Galactic Legends, relic units, all raids joined, tickets on target, growing, long-standing, shares counters and tips) and **Keep an eye on** (quiet for days, low tickets, missed raids, skipped the war, power down or well below average, old roster data).
  - **Then the detail:** power with rank, the guild average and a trend line; the roster (legends, relic units, Relic 9, 7★, ultimates, datacrons); raid tickets and the last few raids with rank and damage, and the current war; their contribution (counters added and used, tips, ideas, feedback, upgrades in 30 days); and recent activity.
- Officers only. Linked from the control panel's Officers tab and the Officers menu.

## 1.6.1 — 2026-10-17

- **Feedback moved up the menu,** to sit right under Guild chat at the top, so it is always in view. It is no longer inside the Guild group.

## 1.6.0 — 2026-10-17

- **Guild activity: a feed like the game's guild chat.** New page **Guild activity** (Guild menu and the control panel shortcuts). One line per thing, newest first, with the time on the right ("17h", "3d"): "Teepeeteet promoted Gungan Phalanx to 7-Star", "Jim increased Ben Solo's gear to level XIII", relics, new units, Galactic Legends and ultimates. Stars and new units show in green, the big ones (relic 7+, legends, ultimates) in orange. Filter by Stars, Gear, Relics, Legends & ultimates or New units, or by member.
- **Two new kinds of win are now picked up** from roster checks: **star promotions** and **gear level-ups** (units still on gear; relic units count as relics). They feed the Wins page's "Progress" lines too.
- It is built from roster checks, not the game's chat, so it runs a day or two behind. Zeta upgrades are not detected yet.

## 1.5.0 — 2026-10-17

- **Saved squads gets the new look.** The tall banner is gone; a slim header and the page's themed background take its place. The enemy-leader search and an orange **+ Add a counter** share a row.
- **Each counter is a clear card:** the name, who it beats, the mode and who saved it; the squad as unit chips (leader highlighted, relic needs shown small); how to run it; then a green **You can run this now** or an orange **You're not there yet** with what is missing; and who in the guild is ready or closest. Glow on hover, **Remove** is a small pill.
- **"Not on the list?"** is now an orange box beside the cards (above them on a phone) with a button straight to Ask B-Lue3.

## 1.4.0 — 2026-10-17

- **Tips and Ideas get the new look.** Cards sit two across on a laptop in the same see-through glass as Counters, with a blue glow on hover. Each has its type and topic as small tags, then the title, the words, and a footer with who wrote it, when, and how they know. **This helped** is an orange pill that turns green once you have tapped it; tips still waiting for an officer have an orange dashed edge.
- **Find things faster.** A search box plus a **topic** filter (Raids, Territory War, Farming and the rest) sit above the cards.
- The "Add what you know" form uses the same orange button as the rest of the site.

## 1.3.2 — 2026-10-17

- **A tighter Home on phones.** The control panel now starts as the small pulsing "Setup 1 of 3" button (tap it to open; once you open or close it yourself, it remembers). The new-player welcome is one slim row with scrolling name chips instead of a tall card. The result: Ask B-Lue3 and the first war-room panel are on the first screen. Laptops are unchanged.

## 1.3.1 — 2026-10-17

- **The menu starts folded.** Every group (Knowledge, Guild, War room and the rest) is closed when you arrive, so people can explore by opening what they want. The group holding the page you are on opens by itself, and Home, Ask B-Lue3 and Guild chat stay in view at the top.

## 1.3.0 — 2026-10-17

- **A guild feedback and to-do board.** New page **Feedback** (in the Guild menu and the control panel shortcuts). Any member can add a **feature request, feedback or "something's broken"** with a short title and some detail (5 a day each). The whole guild can read the list and tap **+1** on what they want too, which floats the popular ones up.
- **Officers tick things off.** Each item shows a status: New, Planned, In progress, **Done** (ticked and struck through, with the date) or Not doing. Officers change the status from a dropdown, can add a **note to the guild** ("Shipped in 1.3, try it") and can remove an item. Members can take back their own post while it is still New.
- Tabs show **To do**, **Done** and **All** with counts. Needs one new database table pair (`FeedbackItem`, `FeedbackVote`), added by a migration on the next production build.

## 1.2.1 — 2026-10-17

- **"Wanted" is gone; the box now says exactly what it is.** It is titled **Members asking for a counter**, with one line: "Know a squad that beats one of these? Add it and the member who asked is helped." Each request reads **"How do I beat Lord Vader?"**, then the mode and any detail, then who asked. The button is **I know a counter**; for your own it is **Cancel request**.
- **Asking is plainer too.** The button is **Ask for a counter**, the form explains what happens ("Tell us which enemy squad is beating you…"), the field is "Enemy squad leader (who is beating you?)" and the submit button is **Send request**. Confirmations use the same words.

## 1.2.0 — 2026-10-17

- **Take your own request off the Wanted list.** Requests you made ("asked by you") now have a **Remove** button instead of "I have one". It goes straight away and a green message confirms it. Only the person who asked, or an officer, can remove a request.

## 1.1.2 — 2026-10-17

- **Asking the guild for a counter now finishes properly.** After you press Ask for help, the form closes and clears itself, and a green message says it was added to the Wanted list (it fades after a few seconds, or tap ×). Before, the form stayed open with the leader still typed in, which looked unfinished and invited a double send. The submit button is orange like the other calls to action.

## 1.1.1 — 2026-10-17

- **Fixed the black box on phones.** When you type a unit name (Ask the guild for a counter, saving a squad and similar), the suggestions list was dark on every theme, so on Rebel the names were dark on dark and unreadable. It now follows the theme (white on Rebel, navy on Deep and Classic), and the box is full width.

## 1.1.0 — 2026-10-16

- **Counters / Knowledge gets the new look, and becomes the template for every page.**
  - The tall picture banner is gone. A slim frosted header now holds the title, one line about the page, and "Review queue" for officers. The page's picture sits quietly behind it, per theme.
  - **Tabs and "+ Add what you know"** share one line (the button is orange, the call to action). Search, mode and "I need a counter" share the next.
  - **Wanted: can you help?** moved into a column beside the counters, staying in view as you scroll, with orange "I have one" buttons. On a tablet or phone it sits above the counters.
  - **Each counter card** is see-through glass with a blue glow on hover. Who you face and what to use are two clear halves, and "This is what I use" is a pill.
  - **Fixed:** the page ran off the right edge on wide screens (tabs and search were cut off).

## 1.0.0 — 2026-10-16

- **Resize the Home boxes.** Each box now has a small corner handle (bottom right, shows when you hover). Drag it to make the box wider, narrower, taller or shorter. It snaps to the grid, a dashed outline shows where it will land, and the other boxes slide out of the way. If you make a box smaller than its content, it scrolls inside. **Double-click the corner** to fit the box back to its content.
- **Tidy up.** A new button under the boxes slides everything up into the gaps, keeping your columns and sizes.
- The war room box wraps its three panels (Territory War, Territory Battles, Raids) as you make it narrower. Sizes are saved on that device with the rest of your layout, and "Reset layout" clears both.

## 0.99.1 — 2026-10-16

- **A "Squads" tab in the control panel.** Open the panel (expand arrow, top right of Home) and pick **Squads**. It lists the counter squads you saved, each with the enemy leader, the mode, the units, and a green **Ready** or an orange **Not yet** (with the first thing missing, like "Padmé Amidala: R5 → R7"), worked out from your own roster. Under that are the counters you marked "This is what I use". Buttons jump to save a squad or find counters. If you have none yet it says how to add one.

## 0.99.0 — 2026-10-16

- **The top-right box on Home is now a control panel.** Small, it still shows your name, your standing and check-in, and the setup steps (officers also get a "waiting for your check" nudge). Press the expand arrow and it opens into a panel with tabs:
  - **Overview:** your power, raid tickets and how many B-Lue3 questions you have left, plus your guild check-in.
  - **Setup:** the three setup steps (when you have not dismissed them).
  - **Shortcuts:** one-tap links to Ask B-Lue3, Add what you know, Guild chat, Who has…?, Territory War, Raids, The Wins and Notifications; the theme switch; "Reset Home layout"; and "Replay announcement".
  - **Officers** (officers only): Review queue (with the count), Announcement, Roster report and Discord sync.
- The panel remembers whether it was open and which tab you were on, on that device. The × still folds it to the small button.

## 0.98.1 — 2026-10-16

- **The Ask button is orange on Rebel too.** The light themes were forcing every submit button blue; Ask B-Lue3's button now keeps its orange.

## 0.98.0 — 2026-10-16

- **Say hello and Hit it are Rebel orange** now, to match Ask B-Lue3 (and they follow the theme).
- **The Home boxes are a little wider** (7 of the 12 grid columns, up from 6), and the new-player welcome card lines up with them. The brothers stay clear on the right.

## 0.97.3 — 2026-10-16

- **Ask B-Lue3 is Rebel orange** instead of gold: the border, title, + button and Ask button. It follows the theme, a bright orange on Deep and Classic and a deeper burnt orange on Rebel so it still reads on the light boxes.

## 0.97.2 — 2026-10-16

- **The announcement shows once per visit.** It floats in the first time you open Home, and not again when you move around the site or refresh. Come back four or more hours later (or the next day) and it shows again. Saving a new version still shows it to everyone straight away.

## 0.97.1 — 2026-10-16

- **The announcement waits until you are ready.** It is off until an officer ticks "Show the announcement" on Officers → Announcement and saves. Nothing floats over Home before then, and saving with the box unticked keeps it as a draft.

## 0.97.0 — 2026-10-16

- **Officers can edit the announcement on the site.** New page **Officers → Announcement** (also "Edit announcement" on the card itself). Change the small label, headline, message, button words and link, an optional quote and the seconds on screen, with a live preview, then **Save and show to everyone**. Every save shows it again, once, to each member. A switch turns it off. The button link must be a page on this site (like /chat) or an https link.
- **The announcement now looks like the other boxes:** see-through frosted glass that follows the theme (dark on Deep and Classic, white on Rebel), a blue glow on hover, and the banner only faintly behind the words.
- Needs one new database table (`Announcement`), added by a migration that runs on the next production build.

## 0.96.0 — 2026-10-16

- **The banner is off Home.** It did not work in the layout.
- **A floating announcement.** A moment after Home opens, a card slides in at the bottom right with the banner faintly behind the words: "We're getting the band back together!", a gold **Hit it!** button to Guild chat, and a Blues Brothers quote. A thin gold bar counts down 20 seconds, it waits while you point at it, and you can close it. Each member sees it once per announcement on each device.
- To make a new announcement, change the words and the `id` in `web/lib/announcement.ts` (set `enabled` to false to switch it off).

## 0.95.1 — 2026-10-16

- **The new "Blues Brothers in a Cosmic Banner" is in.** It is wide enough to run edge to edge, so on a laptop it fills the whole strip at the top of Home (the emblem, the name, the hovering car and both brothers), and it opens the front page for visitors too. Phones show the whole banner.
- **The "Welcome to the guild" box moved down,** under the banner, so it no longer covers the brothers.
- The banner files have new names so everyone sees the new picture straight away instead of a cached copy of the old one.

## 0.95.0 — 2026-10-16

- **Ask B-Lue3 is gold,** so it stands apart from the blue boxes (gold border, gold title, gold Ask button).
- **A wider banner, not a stretched one.** On a laptop the Home banner now runs the full width of the page. The banner keeps its true shape in the middle and its soft edges melt into a blurred glow made from its own colours. Phones still show the whole banner.

## 0.94.1 — 2026-10-16

- **The Blues Brothers banner is on the members' Home too.** It sits at the top, in the same left half as the boxes, with the whole banner showing so the name and the brothers are never cut off. On a phone it runs full width. The welcome card for new players lines up under it.

## 0.94.0 — 2026-10-16

- **The Blues Brothers have a logo.** The twin fedoras and sunglasses emblem is now the sidebar logo, the site header logo, the browser tab icon, the iPhone home-screen icon and the app icon when the site is installed on a phone.
- **A banner on the front page.** Visitors who are not signed in now open on the full-width "Blues Brothers" banner (the name, the brothers and the hovering police car), with the welcome words and the Discord button underneath. On a phone the whole banner shows, so the name is never cut off.
- The full-size originals are kept in `design/logos`.

## 0.93.3 — 2026-10-16

- **More of the background shows through the boxes.** They are about half see-through now, with a light blur so the words stay easy to read. The new-player welcome card is lighter too.

## 0.93.2 — 2026-10-16

- **The new-player welcome stays until you close it.** No more timer.
- **The grid behind the left menu is a touch fainter.**

## 0.93.1 — 2026-10-16

- **A fine grid behind the left menu,** in blue lines on Deep and Classic and in grey on Rebel. The menu text sits clearly on top.

## 0.93.0 — 2026-10-16

- **A proper welcome for new players.** The banner is now a card: "Welcome to the Blues Brothers!", with each newcomer on their own tile (a coloured initials badge, their name, when they joined and their power). A yellow **Say hello** button takes you to Guild chat. It stays for 45 seconds and waits while you point at it, or you can close it.

## 0.92.1 — 2026-10-16

- **The "Welcome to the guild" box stays put.** No more timer. It sits top right until you close it with the ×, then folds into the small "Setup" button (which brings it back). Your choice is remembered on that device.

## 0.92.0 — 2026-10-16

- **Put the boxes anywhere on Home.** Drag a box by its grip and it follows you across the page, left, right, up or down. A dashed outline shows where it will snap on the grid, and a faint grid appears while you drag. If you drop it on another box, that box slides down out of the way. The arrow keys move a focused grip one step at a time.
- Your layout is kept on that device and "Reset layout" puts it back. On a narrow screen the boxes simply stack, as before.

## 0.91.0 — 2026-10-16

- **Move the boxes on Home.** Each box (Ask B-Lue3, war room, Act now, the Wins) has a small grip in its top right corner that shows when you hover. Drag it up or down with a mouse or a finger, or focus it and use the arrow keys. Your order is remembered on that device, and "Reset layout" puts it back.
- **The boxes are more solid,** so the words are easier to read over the picture.

## 0.90.0 — 2026-10-16

- **A picture for each look.** Home now has a full-page background that changes with the theme: Rebel shows the Bluesmobile on Hoth, Deep shows the brothers at Tatooine twilight, and Classic shows them by the landspeeder in the hangar. The picture stays put while the page scrolls.
- **The frames sit in the left half** (Ask B-Lue3, the war room, Act now, the Wins) so the brothers stay clear on the right. The welcome, the numbers and the setup pill sit over the sky along the top.
- The pictures are compressed to about 150 KB each. The full-size originals are kept in `design/backgrounds`.

## 0.89.0 — 2026-10-16

- **Home is now a clean set of frames on a plain ground.** The photograph is gone from Home, so nothing fights the boxes. Top: "Welcome, name", the guild numbers and the setup pill. Under that, the new-player welcome. Below, two columns: Ask B-Lue3, the war room and the Wins on the left, and Act now on the right. When nothing needs doing, the Wins move to the right.
- Boxes still light up on hover and the Setup pill still pulses. The picture can come back later: Home just needs it passed to the page frame.

## 0.88.1 — 2026-10-16

- **The guild numbers lost their box** and now line up with "Welcome, name", written straight onto the picture.
- **The new-player welcome is bigger and brighter:** a blue banner with a party icon, "Welcome Juggernaut2000 and Dex to the Blues Brothers!", names in gold. It fades away after 25 seconds, or you can close it.

## 0.88.0 — 2026-10-16

- **No more wasted space on Home.** The black bar across the top is gone and the picture now runs from the top of the page down the whole right side, with the sign and both brothers. The cards sit below it, full width, side by side.
- **"Welcome, Dex" uses the same clear font** as the rest of the page.
- **Boxes light up when you hover** (a blue glow, amber for "Act now"), and each line in the war room strip highlights.
- **"Setup 1 of 3" pulses** until all three steps are done.
- **Guild chat moved to the menu**, right under Home, with a green dot that pulses. The wide chat card at the bottom of Home is gone.

## 0.87.0 — 2026-10-16

- **Home uses the empty parts of the picture.** "Welcome, name" and the guild numbers now sit top left. The ask bar moved down into the open space under them, so the sign and the brothers are clear.
- **New players are welcomed in a banner at the top:** "Welcome new players … to the Blues Brothers". The "New members" card is gone, since the banner replaces it.
- **The setup pill sits top right,** and its box drops down from it for 12 seconds as before.
- **The war room is a bare strip on the picture** at the foot of the first screen, and the cards below are smaller.

## 0.86.0 — 2026-10-16

- **The picture comes first.** On a laptop, the first screen is the Blues Brothers sign and both brothers, with the headline and ask bar on the left. The war room panel and the cards start just below, a scroll away. The picture is also lighter behind the words.
- **The welcome box is timed.** It shows for 12 seconds (a thin bar counts it down), then folds into a small "Setup 1 of 3" pill in the corner. It waits while you hover or tap it, and the pill brings it back. A small amber dot on the pill means a check-in is needed.
- **Guild chat is one slim row** that opens when you tap it.

## 0.85.0 — 2026-10-15

- **A calmer Home.** One focus now: the headline and the ask bar. The four number tiles became one quiet line of numbers, the ask box lost its frame, and Territory War, Territory Battles and Raids share one slim panel with a coloured dot instead of three cards. "Act now" only appears when something needs doing. The chat card only shows when chat is on, and Discord and Guild chat are two small links at the bottom.
- **A shorter sidebar.** The groups fold. Knowledge, Guild and War room start open; Off duty, You and Officers stay folded until you are on one of their pages. Tap a group's name to open or close it.

## 0.84.2 — 2026-10-15

- **First visit is clearer.** Under the headline there is now one line saying who B-Lue3 is and what to ask him. B-Lue3's floating icon steps off Home on a laptop (the ask box is right there), so he no longer sits on top of it. When nothing needs doing, "Act now" lists three ways to help (add a counter, share a tip, suggest an idea) instead of an empty box.

## 0.84.1 — 2026-10-15

- **One look for every box on Home.** The stat tiles, ask box, welcome box and all the cards are now the same frosted-glass panel over the picture, so nothing looks like a different system.
- **The ask box moved up beside the welcome box**, under the headline, instead of running the full width of the page. The cards start higher, and "Act now" shrinks out of the way when nothing needs doing.

## 0.84.0 — 2026-10-15

- **Home layout fixes.** The sidebar now scrolls on its own, with your name and the theme switch always visible at the bottom. B-Lue3's floating icon can no longer sit on top of the sidebar. The welcome box lines up with the card column under it and matches the headline's height.
- **Clearer Home.** The headline now says what to do: "Ask B-Lue3. Add what you know." The next step in the checklist is highlighted. "Act now" is only loud when something needs doing, and shrinks to one line when nothing does. The Territory Battle callouts no longer repeat the card above. Lists are capped so the cards in a row line up.
- **Easier to read.** The picture sits further back behind the words, the small capital labels are bigger, the ask suggestions sit under the box on the left with a "Try:" label, and Ask B-Lue3 in the sidebar has an icon instead of an unexplained dot.

## 0.83.2 — 2026-10-15

- **The picture is now the page's background**, not a banner block that pushes everything down. The headline, numbers, welcome box and cards start at the top of the page and sit over the fixed picture. The ask bar and cards no longer run off the right edge on a wide screen.

## 0.83.1 — 2026-10-15

- **Home is one tidy grid.** The headline and numbers sit at the top of the banner, with a single welcome box (your standing and the get-started steps) beside the brothers so the sign stays visible. The ask bar is one slim line, the war room strip (Territory War, Territory Battles, Raids) moved up under it, and the cards below no longer leave gaps.

## 0.83.0 — 2026-10-15

- **Home is built for a phone.** The welcome to the guild, your standing and the get-started steps now live inside the banner at the top and can be dismissed. On a phone the big AI box is gone: B-Lue3's floating icon is the way in. On a laptop it is one slim ask bar, with how B-Lue3 answers (and what it costs) folded away under it.
- **A bigger banner.** The picture is taller so the sign and both brothers show, with the numbers on it instead of boxes underneath.
- **Deep is the default look** for anyone who has not picked one. Choices already made are kept.

## 0.82.0 — 2026-10-14

- **Every page has the same banner as Home.** Ask B-Lue3, Knowledge, Guild and More now open with the slim picture banner and the page's own title and a line of explanation. Territory War, Territory Battles, Raids, the roster, the Wins, Counters, Field Guides, My page and the other older pages have their big picture headers cut down to the same slim shape.
- **The old floating header is gone for members.** The sync pill, version and Open Discord button no longer float over the pictures. Open Discord is on Home and under More.

## 0.81.1 — 2026-10-14

- **B-Lue3's quick ask box is tidied.** The Ask button no longer sticks out past the edge, and "Meet B-Lue3" is a plain play button instead of a tiny picture with a label stuck under it.

## 0.81.0 — 2026-10-14

- **B-Lue3 is a floating chat icon you can move anywhere.** Drag him around the screen and he stays where you leave him, on this device. Tap him for a quick ask box (free from the guild's knowledge first) with a link to the full Ask page, the Meet B-Lue3 clip and a "Put me back in the corner" button. With the keyboard, focus him and use the arrow keys (hold Shift for bigger steps). He starts in the bottom corner, above the tab bar on a phone, and steps aside on the Ask page.
- **The Home banner shows the sign and both brothers.** It is a little taller than the last one, with the welcome words and the guild numbers at the top.

## 0.80.2 — 2026-10-14

- **A slimmer Home banner.** The picture is about half the height, so it sets the scene without taking over the page. The sign still shows. B-Lue3 still stands on its lower edge.
- **The guild numbers moved onto a bar under the banner** (members, guild power, tickets today, Galactic Legends), so they read clearly on any picture.

## 0.80.1 — 2026-10-14

- **A bigger, fuller Home banner.** The picture now fills the whole width and shows the sign large, with the guild numbers over its left side.
- **B-Lue3 stands on the banner.** He is no longer boxed into the ask card. He sits beside the headline and hangs over the banner's lower edge, with his "Meet B-Lue3" play button underneath. The banner has room for other icons to do the same.
- Long names and messages now wrap inside their card instead of stretching the page.

## 0.80.0 — 2026-10-14

- **A proper desktop layout.** On a laptop the sidebar now lists every page in groups (Knowledge, Guild, War room, Off duty, You, and Officers if you are one), so nothing is hidden behind a menu. Phones keep the five tabs.
- **Edge-to-edge banner with the whole picture.** The Home banner spans the full width and shows the whole cantina scene, sign included. The scene fades into the banner behind the headline and the guild numbers (members, power, tickets today, Galactic Legends).
- **A ground behind the pages.** Stars in **Deep**, a grid in **Classic**, plain in **Rebel**.
- **Home puts the important things where you can see them.** "Act now" sits beside the ask box: the counters the guild is asking for and the open Territory Battle callouts. Below: **new members**, **achievements** (the wins), and **guild chat** with an Open Discord button. At the bottom, a status row for Territory War (the last finished war), Territory Battles (open callouts) and raids (tickets and the last raid).
- **Tips and Ideas have their own pages** (`/knowledge/tips`, `/knowledge/ideas`) so the sidebar can link straight to them.

## 0.79.0 — 2026-10-14

- **How B-Lue3 answers is now impossible to miss.** Three clear steps with big cost labels: **Free** (the guild's own knowledge), **Uses 1 question** (a web search, only if you tap it) and **Uses 1 question** (the AI). The AI steps carry an **AI** tag. It shows on Home and on the Ask page, with how many questions you have left this week.
- **A plain warning about the AI.** "AI can be wrong. Check in game before you commit a squad. Nothing the AI finds is shared with the guild until an officer has checked it." The web-search button and every AI answer carry a short version of it too.
- **"Meet B-Lue3" is back.** The short clip of B-Lue3 plays from his picture on Home and on the Ask page, not just on My page.

## 0.78.1 — 2026-10-14

- **If the Discord sign-in doesn't finish, you're told.** Cancelling on Discord, a timeout or a hiccup used to drop you back on the front page with no message. Now the top of the page says the sign-in didn't finish, that nothing was changed, and gives a button to try again and a way to ask an officer.

## 0.78.0 — 2026-10-14

- **The older pages follow your theme.** Territory War, Territory Battles, Raids, the roster, the Wins, Counters, Field Guides, My page and the rest now go light in **Rebel** and navy in **Deep**, instead of staying dark next to the new navigation.
- **Dougie's Discs and the Cantina stay dark on purpose.** They are the off-duty corner and look best as dark rooms.
- **Pictures sit properly beside the sidebar.** The big banner pictures used to run underneath it on a laptop; they now fit the space.
- The version number no longer shows in the header for signed-in members.

## 0.77.0 — 2026-10-14

- **A proper first sign-in.** After you sign in with Discord for the first time, you now get one clear page: three steps (Discord, ally code, you're in), a single box for your 9-digit ally code, and a "Where do I find it?" hint. Before, the ally code box sat further down the front page.
- **The code sets itself out.** Type the digits and the dashes appear (123-456-789).
- **If it doesn't work, it says what to do next.** Not recognised: check the digits. Not in the guild yet or someone else is linked: a button to the Discord so an officer can sort it. Your Discord sign-in timed out: a button to sign in again.
- When it works you see a short welcome and go straight to your home page.

## 0.76.0 — 2026-10-14

- **Add what you know.** The Knowledge page now has one button for adding a **counter**, a **tip** or an **idea**. Tips and ideas are plain words: "spend raid tickets at reset", "we should plan TW defence on Thursday". Say where it applies and how you know.
- **Checked before shown.** An officer reads each tip and idea and publishes or rejects it. You can see your own while it waits. Everyone else only sees published ones.
- **"This helped."** Mark a tip or idea that helped you, so the useful ones are easy to spot.
- **B-Lue3 can quote them.** For how-to questions he now looks at published tips and ideas, names who wrote them, and says they are guild advice, not official game facts.
- Counters, calls for help and the search order are unchanged. Officers find tips and ideas in the same review queue as counters.

## 0.75.0 — 2026-10-14

- **A new front door for members.** Signed-in members now see five sections: **Home**, **Ask B-Lue3**, **Knowledge**, **Guild** and **More**. On a phone they sit in a bar along the bottom; on a laptop they are a sidebar. Every page you already used is still there, just grouped.
- **Home tells you what to do.** A welcome picture, a box to ask B-Lue3, a short "Get started" list, the counters the guild is asking for, and what's new. The old dashboard (power, tickets, Wall of Fame, the Wire) is now **Guild overview**, under Guild.
- **B-Lue3 has his own page.** It says how he answers: the guild's own knowledge first (free), the web only when you tap it, AI for everything else.
- **Pick your look.** Rebel (light, the default), Deep (navy) or Classic (the original dark). Choose it under More, or at the bottom of the sidebar.
- Older pages keep their dark look for now and will move across one by one.

## 0.74.0 — 2026-10-14

- **B-Lue3 checks the guild's own database first, and that's free.** Ask how to beat a squad ("how do I beat Lord Vader in Territory War?", "counter for night sisters") or "who has Jabba?" and the answer comes straight from the guild's counters and rosters, with no AI and none of your weekly questions used. It works even when your five are gone, and the answer says so.
- **If the database has nothing**, he says so and gives you a clear choice: a **Search the web with B-Lue3** button that says it uses one question, or ask the guild for help. The AI is never used without you tapping it.
- Anything else (like "what should I farm next?") still goes to the AI. A failed AI call is still given back.

## 0.73.2 — 2026-10-14

- **B-Lue3's answers are easier to read.** Bold, italics, bullets and numbered lists now show properly instead of as stray `**` and `*` symbols.

## 0.73.1 — 2026-10-14

- **Fixed: web search answers coming back empty.** B-Lue3 was running out of room while thinking, before he could write the answer. He now has far more room, so questions that need a web search should come back with sources.

## 0.73.0 — 2026-10-14

- **Research with B-Lue3 (officers).** On the counter review page, pick a game mode and an enemy squad's leader and press Research. B-Lue3 searches the web, and every counter he finds goes into the review queue with its source page. He can't publish anything, and the site checks each one before filing: real characters, the right squad size for the mode, and a source page that the search really found. Anything that fails is listed with the reason.

## 0.72.3 — 2026-10-14

- **Fixed "I came up empty on that one."** When B-Lue3 searched the web he could use up all his steps looking things up and never write an answer. He now always writes one, and if a web search still ends with nothing, he answers from the guild's own data and says the search didn't work.

## 0.72.2 — 2026-10-14

- **You can see where you stand with B-Lue3.** Above the questions there's now a row of dots for how many you have left this week, when it resets (Monday), and a badge showing whether web search is on. When you've used them all, the buttons and box are greyed out with the reset day, instead of failing.
- **Fixed:** trying again after hitting the limit kept adding to your count, so it never recovered. A blocked try no longer uses anything up.
- Officers also see the real limit and how many are used, with a button to reset their own count.

## 0.72.1 — 2026-10-14

- **B-Lue3 is straight about web search.** If the web search doesn't work for a question, he now says "I couldn't search the web just now, try again in a few minutes" instead of claiming he can't search at all. Officers also see why it failed.

## 0.72.0 — 2026-10-14

- **A counter knowledge base of our own.** New page: **Counter knowledge base** (open it from the Counters page). Search by team, character or mode. Each counter shows the enemy squad, the squad to use, how to run it, what it needs (zetas, omicrons, relic), where it came from, the date checked, and how many guildmates use it. Territory War, Grand Arena 5v5 and 3v3 are kept strictly apart.
- **Anyone can add a counter**, and say how they know it works. Officers check every one before it goes live, on a new review page that also shows what's covered and what needs another look.
- **"This is what I use"**: one tap on any counter, so the ones the guild actually relies on stand out.
- **"I need a counter"**: ask the guild for help with a squad. It appears on a Wanted list and, once a Discord channel is connected, is posted there. It's marked answered when a counter for that squad is published.
- **Counters from the Datacron era end:** a counter that needs a Datacron is flagged, and once the Datacron has ended it's shown as "don't rely on this" and B-Lue3 won't use it.
- **B-Lue3 uses it.** He looks here first, says which game mode each counter is for and how many guildmates use it, and can file a counter he finds on the web (with its source) for officers to review.
- It starts empty: nothing is made up. It fills from members, officers and imports.

## 0.71.3 — 2026-10-14

- **A failed B-Lue3 question no longer uses up your weekly five.** When something goes wrong behind the scenes you get the question back.
- **Faster fallback.** If the web search takes too long, B-Lue3 now gives up on it after 30 seconds and answers from the guild's data instead of timing out.
- Officers now see the reason in the error message, to help fix problems.

## 0.71.2 — 2026-10-14

- **Fixed: B-Lue3's typing box didn't appear even with the switch on.** The setting was being read too strictly, so a hidden space or line break in the value turned it off. It now accepts on, ON, true, yes or 1 however it was pasted.

## 0.71.1 — 2026-10-14

- **Easier to diagnose when B-Lue3's typing box is missing.** If the AI switch isn't on, officers now see a short note on My Page saying what the server has it set to.

## 0.71.0 — 2026-10-14

- **B-Lue3 can now search the web for counters.** Ask "how do I beat Lord Vader?" and he checks what the guild has saved first, then looks up current counters online, tells you they come from the web and aren't guild-tested, names the source (links shown under the answer), says whether it's for Territory War or Grand Arena, and checks the team against your roster.
- **A clear warning on every answer:** "B-Lue3 can get it wrong. Check in game before you commit a squad." The same warning is in the small print under the box, and the Counters page has a new "Not on the list? Ask B-Lue3" box.

## 0.70.4 — 2026-10-14

- **"Ask B-Lue3" everywhere.** The home page tile, the menus and the home note now use the full name instead of "Blue".
- **The three starter questions stand out.** On My Page they're now large blue buttons with icons (stacked on a phone), and the Ask button next to the typing box is bright blue too.

## 0.70.3 — 2026-10-14

- **The droid's name is spelled B-Lue3** everywhere on the site, and Blue introduces himself that way.

## 0.70.2 — 2026-10-14

- **Fixed: "Ask Blue" on the home page note** took you to Counters (or another page) instead of Blue. It now opens the Ask Blue box on My Page.

## 0.70.1 — 2026-10-14

- **Blue welcomes new members.** On the green Welcome banner, Blue's face now has a play button. Tapping it plays his clip over the page, and at the end there's a "Say hello in chat" button. Tapping the names still goes straight to chat.

## 0.70.0 — 2026-10-14

- **Meet B-Lue3.** Tap Blue's picture on My Page (the play badge) and he appears over the page in a 10-second clip, with sound, waving and showing off a hologram screen. When it ends there's a button to ask him a question. The clip only loads when you tap it.

## 0.69.1 — 2026-10-13

- **New members get the top spot.** A green "Welcome to the band" banner now sits right under your status line on the home page, naming anyone who joined in the last three weeks and linking to chat to say hello. It disappears when no one is new.

## 0.69.0 — 2026-10-13

- **A much shorter home page on phones** (about 4,400 px down to about 2,400). The tool buttons are one line each, the stat cards and Blue's note are smaller, the Guild Wire shows its three newest items with the rest under "Older news", and "Legends & watchlist" and "New crew welcomes" are fold-aways. Laptops are unchanged.

## 0.68.3 — 2026-10-13

- **Dougie's Discs on a phone:** the buttons across the top of the jukebox (Dig in Crate, Turntable / Video Clip, Drop a Record) now sit in three tidy rows instead of being squeezed and cut off.

## 0.68.2 — 2026-10-13

- **No more emoji on the site.** The jukebox, datacrons, guides, counters, Discord sync, the Territory War lock, the sign-in page and the theme switch now use clean icons that match the rest of the site. The only emoji left are in the text you copy to paste into Discord.

## 0.68.1 — 2026-10-13

- **Officers can find their tools on a phone.** The phone menu now has an **Officer Deck** section near the top (roster report, Discord sync, the Territory War war room and Territory Battle planning), instead of an "Officers" section at the bottom. The laptop Officer Deck menu also links to the war room and battle planning.
- **Proper icons instead of emoji** in the menus and the tool tiles on the home page and Operations.

## 0.68.0 — 2026-10-13

- **Blue is on the home page.** Under your status line there is now a short note from B-Lue3 (what you're needed for, or your closest next finish) with an **Ask Blue** link. It costs nothing to show.
- **Ask Blue is easy to find:** it has a tile in the tool grid (which also gains Raids), and an entry in the Roster menu and the phone menu.
- **My Page:** Blue's card is tidier on phones, with the droid beside the heading and the text running full width below it.

## 0.67.2 — 2026-10-13

- **Blue's allowance is now 5 questions per member per week** (resets on Monday), to keep the AI cost small. The roster report and preset briefing on My Page stay free and unlimited.

## 0.67.1 — 2026-10-13

- **Blue can run on Google Gemini.** Add a Gemini API key and switch Blue on; no other AI service is needed.

## 0.67.0 — 2026-10-13

- **Meet B-Lue3, "Blue".** The guild's operations droid now lives on **My Page**. Members can type a question ("who has Darth Revan?", "which counter can I run into Revan?", "what am I needed for?") or tap one of three suggestions. Blue looks things up in the guild's own data (rosters, saved counters, Territory Battle callouts, Territory War orders) before answering, and says so when it doesn't know. It can see across the whole guild, like an officer, but only reports what helps the member asking, and it is read-only: it can't change plans or post anywhere. It lives on the site only, not in Discord.
- **Blue is switched off until the AI key is added.** Until then My Page keeps the three preset questions and the roster report, which work without any AI. Each member gets 25 questions a day.
- **My Page** has Blue's briefing at the top (what you are needed for right now) and a roster report: leaders you can field, the ones you're closest to, and saved counters you can run or nearly can.
- **Faster pages.** Pages that check the roster for squad leaders and Territory Battle callouts now read only the units they need, so My Page and the callouts load several times faster (about 9 seconds down to 1.4 locally).
- Territory Battle callouts now match members by player rather than by name.

## 0.66.4 — 2026-10-13

- **Laptop screens: the useful part comes first.** The banner at the top of most pages filled the whole screen on a laptop, so things like "Your job this war" and the Operations tools started below the fold. Banners are now about a third shorter, and the home page banner drops its intro text and buttons (the tool buttons sit right underneath instead), so the status strip and buttons show on the first screen.
- **Tidier alignment.** The Operations tiles are four across, and the Territory War orders card and the officer fold-aways line up with the rest of the page.

## 0.66.3 — 2026-10-13

- **A Sign in button on the front page.** Members arriving at the site for the first time had no sign-in button on the first screen; on a phone it was only inside the menu. The front page now opens with **Sign in with Discord** and, next to it, "Thinking of joining?" for recruits, which jumps to what the guild asks for.
- **The entry requirements sit two by two** on a phone, and the note at the bottom no longer says to look "at the top".

## 0.66.2 — 2026-10-13

- **Dougie's Discs is about a third of its length on a phone** (about 5,400 px, down from about 15,500). The record crate opens as a compact list instead of a full sleeve per record: title and artist with the running time, and Spin, Next and Queue buttons underneath. The Sleeves view is still one tap away, and on a laptop it still opens on the sleeves.
- **Fixed a blank gap** under the crate search box on phones, and the four movie-quote buttons now sit two by two.

## 0.66.1 — 2026-10-13

- **The Wins is a third of its length** (about 4,100 px on a phone, down from about 13,300). The last three days show in full; earlier days fold away under "Earlier". Within a day the big wins (Galactic Legends, ultimates, Relic 7 and up) always show, a few routine upgrades follow, and the rest are behind "N more upgrades".

## 0.66.0 — 2026-10-13

- **The Roster is one row per member on a phone.** Rank, name (with Officer or Leader where it applies, level and time in the guild), power and Galactic Legends on a single line, instead of a full trading card each. About a fifth of its former length (about 4,900 px, down from about 22,750). Tap a row for the full card, exactly as before; on a laptop it is still the trading cards.
- **Who has…? is at the top of the Roster page**, above the new-arrivals strip, since it is the most useful thing on the page.
- **"Until the next gig" folds away** so the list of members who left is there if you want it but is not in the way.

## 0.65.2 — 2026-10-13

- **Operations is one screen of tools.** Seven short tiles (Territory War, Territory Battles, Counters, Raids, Datacrons, Arsenal, Who has…?), each with one line saying what it is for and one live fact, instead of two sets of cards describing the same six tools. About a third of its former length on a phone.
- **Members only, like the tools it links to.** Visitors who are not signed in used to see this page and then hit a wall on every link; they now get the normal sign-in prompt. The Discord sync tile shows only for officers.

## 0.65.1 — 2026-10-13

- **Shorter datacron cards.** Each card now shows the level, the character, the set, the owner and whether it is Territory War ready. The ability text and rolled stats fold away behind "Ability and stats". The vault is less than half its former length on a phone (about 5,600 px, down from about 12,000).

## 0.65.0 — 2026-10-13

- **Guild Arsenal is a fifth of its length** on a phone (about 2,700 px, down from 11,800). Each group (Galactic Legends, core characters, capital ships) folds away, with the first one open; each unit is a short card with how many members own it and how many are at 7★ and R5+. Tap a unit for the full list of who has it, as before.
- **Raids is a third of its length** (about 2,000 px, down from 6,200). The three placeholder boxes ("Roster pass next" and the like) are gone, the explanation of what the game will not tell us is a small fold-away, and the results show the top 10 with a "Show all" button.
- **Fixed the raid tabs.** The three tabs all said "ORDER66"; each is a different run, so they now say which raid and the date it ended.

## 0.64.0 — 2026-10-13

- **Territory War: "Your job this war".** The page now opens on your own orders: which squad to defend and where, and which enemy squad to attack, taken from the plan the officers mark Active. If there are no orders yet, or you are not in the plan, it says so in a line, with links to Counters and the TW guide.
- **Shorter and clearer.** The page is about a fifth of its former length on a phone. The dashes-and-zeros summary only shows during a live war, and the "Officer sign-in required" box is gone for members.
- **The planner, assignments and roster board are for officers**, in one "Officer war room" fold-away. Officers still plan exactly as before; marking a plan Active is what publishes each member's orders.

## 0.63.0 — 2026-10-13

- **Datacrons no longer go on forever.** The vault showed all 433 datacrons at once, which made the page over 169,000 pixels tall on a phone. It now opens on the 151 Level 9 super-weapons, shows 12 at a time with a "Show more" button, and the stat tiles sit two by two. Search and the other filters work as before.
- **Territory Battles is about you now.** Members see what the guild needs from them (the callouts) and, once the officers mark a plan Active, the plan phase by phase in plain words (Pre-load, Go for 3★, Hold, with the squad and any note). The page is about a fifth of its former length on a phone.
- **The star calculator and the per-planet planner are for officers**, tucked into one "Officer planning tools" fold-away at the bottom. Members no longer see sliders and "0M deployed", and the page no longer loads every roster for them.

## 0.62.0 — 2026-10-11

- **A home page built around the tools.** Right under the banner there is now a **status strip** (your name, GP and raid tickets, with a clear note and a link to My Page if you need to check in) and a **grid of big buttons**: My Page, Guild Chat, The Wins, Who has…?, Roster, Counters, Territory War, Territory Battles, Operations and Field Guides. On a phone it is a two-column grid you can reach with a thumb.
- **Shorter on a phone.** The four guild stats sit two-by-two, the clocks fit on one row, and the page is about a third shorter overall.
- **Cleaner for members.** The officer password box, the "Needs attention" count and the Pending/Sent labels on the Guild Wire are now for officers only. The empty "Upcoming missions" cards ("Awaiting schedule", "No active war") are gone, since Territory War and Territory Battles have their own buttons. Your cantina card only shows when you still need to link.
- **Menus.** "Who has…?" is now in the phone menu and the Roster dropdown, and the Officer Deck no longer appears in the top menu for people who aren't officers.

## 0.61.3 — 2026-10-11

- **Guild clocks on the home page.** Under the "Comlink connected" tag you now see the current time in Arizona, Texas / Chicago (the same Central time, so one clock), New York and Dublin, kept up to date as you watch and following daylight saving automatically.
- **The "Comlink connected" tag no longer collides with the logo** on shorter screens; the hero now keeps clear of the header.

## 0.61.2 — 2026-10-11

- **Tidier top-right header.** The sync status, version, theme switch, your name and the Discord button now sit together on one dark panel, so they stay readable when they land on a bright part of the hero picture (the neon sign was washing them out). Once you scroll, the panel steps aside and the normal header bar takes over.

## 0.61.1 — 2026-10-11

- **Faster page loads for signed-in members.** Every page was looking up who you are, whether you're an officer, and the guild summary for the header more than once, one after another, and each lookup is a trip to the database. They are now done once per page view and run side by side, and the home page no longer waits for the officer check before loading the rest. No change to what anyone can see.

## 0.61.0 — 2026-10-11

- **Counter library for Territory War and GAC.** Pick an enemy squad by its leader and see the counter squads the guild trusts for it. Each counter shows the squad (units and minimum relic), how to run it, and who added it, plus **whether you can run it right now** (or exactly what you're missing), **who in the guild can**, and who is closest. Any signed-in member can add a counter; its author or an officer can remove it (members can add up to 20 a day).
- **In Discord:** `/counter enemy:<leader>` gives the same answer privately, with name autocomplete. Run the "Register Discord commands" workflow once to install it.
- The library starts empty on purpose: counters change with the game's meta, so the guild keeps it current. Readiness is worked out in the database from the stored rosters, so answers come back in about a second.
- On the site at `/counters`, and in the mobile and Roster menus.

## 0.60.2 — 2026-10-11

- **Fixed `/whohas` replying "The application did not respond".** Discord only waits 3 seconds, and the lookup took about 5, because it loaded every member's full roster to find one unit. The database now picks out just that unit (about half a second), and the command also tells Discord "thinking…" straight away and sends the answer when it is ready, so a slow start can't cause a timeout. The Roster page's "Who has…?" search is faster for the same reason.

## 0.60.1 — 2026-10-11

- The Discord application's public key can be set as `DISCORD_PUBLIC_KEY` as well as `DISCORD_APP_PUBLIC_KEY`, and stray spaces or line breaks around it are ignored. (Discord's endpoint check failed because the key was saved under the other name.)

## 0.60.0 — 2026-10-11

- **"Who has…?"** Members can ask who in the guild has any unit (all 411 in the game) and how far they've taken it, ranked by stars, then relic level, then gear, with an optional minimum star level.
  - **On the site:** a search box at the top of the Roster page with name suggestions as you type.
  - **In Discord:** a `/whohas` slash command with name autocomplete and an optional `min_stars`. The reply is private to the person who asked, and only linked, current guild members get an answer.
- The Discord command is served by a signed interactions endpoint (`/api/discord/interactions`), so it needs no always-on connection. Requests are verified against the application's public key (`DISCORD_APP_PUBLIC_KEY`); anything unsigned is refused.
- Added a "Register Discord commands" GitHub workflow that installs the command in the server on demand.
- The roster loader now also records gear level.

## 0.59.0 — 2026-10-11

- **Guild chat now sits at the top of the home page.** Signed-in members get a "Guild chat" panel directly under the hero, in the first screen on phones and laptops. Collapsed, it shows the last two messages and a reply box; **Open chat** expands a live conversation in place, **Full screen** goes to the chat page, and the choice is remembered on that device.
- The members' hero is shorter so the panel isn't pushed below the fold. The old "Discord stays live" card is now a small "Prefer the app?" link to Discord.
- Under the hood the chat page and the home panel share one message list and one loader, so they always show the same thing.

## 0.58.3 — 2026-10-11

- **Chat warning is more reliable.** The "Discord isn't sharing people's message text" banner now only appears when every member message in the channel is blank, so a lone sticker, GIF or poll can no longer trigger it by mistake.
- **The dashboard's "Discord stays live" panel is now a live chat preview**: the last three messages from #general with a button to open the chat (and a smaller link to Discord). If Discord can't be reached within 2.5 seconds the panel simply shows the button, so the page never waits on it. The old Discord-presence widget still shows if `DISCORD_WIDGET_ENABLED=true`.

## 0.58.2 — 2026-10-11

- **Security and tooling: Prisma 7.9.1 → 7.10.0** (client, Postgres adapter and CLI), plus patched `fast-uri` and `source-map-js`. The remaining flagged packages (`mysql2`, `deepmerge-ts`) are pinned inside Prisma's command-line tooling and Prisma has not released a fix, so they are pinned to patched versions with npm `overrides`. The production security audit now reports **0 vulnerabilities**. Neither package is used by the running site (it uses PostgreSQL through `@prisma/adapter-pg`).
- Checked against the real database: `prisma migrate status` ("13 migrations, schema up to date"), live queries through the new client, typecheck, lint, all 100 tests and a production build.

## 0.58.1 — 2026-10-11

- **Security: upgraded Next.js from 16.3.1 to 16.3.8** (and `eslint-config-next` to match). 16.3.1 was affected by several published advisories, three of them critical remote-code-execution issues (two of which involve Windows-hosted servers and the image optimiser, and one `next/og`), plus cache-poisoning and request-forgery issues in the image optimiser. The security audit no longer lists Next.js. No code changes were needed; typecheck, lint, all 100 tests and a full production build pass.

## 0.58.0 — 2026-10-11

- **Push notifications.** Members can turn on notifications from My Page (and a link in Chat) and choose what buzzes their phone or desktop: **the Droid's posts** (Territory War results, milestones and anniversaries, the weekly question, news, welcomes and farewells, the Sunday roundup) and **chat messages sent from the site**. Settings apply per device; "Send me a test" checks it works.
- Works on Android and desktop browsers, and on iPhone in the installed app (the page explains this and what to do). Chrome's incognito mode doesn't support push.
- Built on a service worker (`public/sw.js`) that only shows notifications and caches nothing, a `PushSubscription` table (additive migration), and `web-push` with VAPID keys. Dead subscriptions are removed automatically, notifications go only to current guild members, and bursts of chat are limited to one notification per channel per 30 seconds.
- **Limit:** messages typed directly in Discord can't trigger a notification, because the site has no always-on connection to Discord; people still using Discord are notified by Discord itself.
- Needs `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and `VAPID_SUBJECT` in Vercel (generate with `node scripts/generate-vapid.mjs`); without them the settings say notifications aren't switched on and nothing is sent.

## 0.57.0 — 2026-10-11

- **Guild Chat** (`/chat`): the Discord #general channel on the site, for signed-in members and officers. Messages (including the Droid's automatic posts, mentions, links and images) show with names and avatars and refresh every few seconds while the page is open; members can reply from the site, and the reply appears in Discord under their own name and avatar. Discord stays the source of truth (moderation, deleted messages, history) and the site stores nothing.
- Safeguards: only allowlisted channels can be read or posted to (officers' channels are not on it); posts can't ping `@everyone` or anyone else; one message every 2 seconds and 15 a minute per member, 1,000 characters; names Discord would refuse are tidied; message text is never treated as HTML; only Discord's own image hosts are shown.
- More channels are switched on with `DISCORD_CHAT_CHANNELS` (for example `general,the-wins,tw`); posting to a channel needs its webhook (`DISCORD_TW_WEBHOOK_URL`, `DISCORD_TW_STATS_WEBHOOK_URL`; #general and #the-wins reuse the existing ones). Without a webhook a channel is read-only.
- Needs the bot's **Message Content Intent** switched on and View Channel + Read Message History on each channel; the page says so if Discord is hiding message text.

## 0.56.0 — 2026-10-11

- **Proper unit names everywhere** from the game's own data (411 names via `scripts/build-unit-names.mjs`), replacing tidied internal ids in Wins, My Page and callouts; the callout picker now offers every unit.
- Stat tiles use a tidy two-column grid on phones; the My Page hero image loads with priority.

## 0.55.0 — 2026-10-10

- **Star Wars news**: a "What's happening in the galaxy" section on the public front page (headlines from Google News' public RSS search, hourly, up to two about Galaxy of Heroes tagged "Game") and a Friday afternoon news post in #general. `CURATED_NEWS=off` switches the post off; "Post now" gained a `news` option.

## 0.54.0 — 2026-10-10

- **Roster advice on My Page**: the squads the guild builds Territory War around, checked against your own roster by squad leader, with the exact gap and a flag when the guild is thin on a squad (fewer than 15 members can field it).

## 0.53.0 — 2026-10-10

- **Member milestones and joining anniversaries in #general**: a first Relic 9 (new win kind `FIRST_R9`), a 5th or 10th Galactic Legend, and "N years with the band". They share a small allowance (two per 20 hours), never post overnight and are never repeated.

## 0.52.2 — 2026-10-10

- Links in Discord posts no longer get a double slash when `SITE_URL` ends with `/`; one shared `siteUrl()` builds every link.

## 0.52.1 — 2026-10-10

- Added a manual **Post now** for the curated posts: a protected `/api/cron/post-now` route and a "Post now" GitHub workflow (preview by default).

## 0.52.0 — 2026-10-10

- **Weekly conversation starter in #general**: one "Question of the week" from 46 curated prompts that rotate through squads, war, fun, The Blues Brothers and this-or-that, in a Wednesday-evening/Thursday window (UK daylight), never repeating until all are used. `CURATED_PROMPTS=off` switches it off.

## 0.51.0 — 2026-10-10

- **Weekly public stats post** (numbers only, members as x/50, this week's achievements, guild totals, the latest Territory War result and the entry bar) and a one-off **vacancy post** ("We're putting the band back together") when the guild goes from full to having a seat.

## 0.50.1 — 2026-10-10

- The public channel webhook can be set as `DISCORD_WELCOME_WEBHOOK_URL` as well as `DISCORD_PUBLIC_WEBHOOK_URL`.

## 0.50.0 — 2026-10-10

- **Curated Discord posts, part one**: channel routing (`DISCORD_GENERAL_WEBHOOK_URL`, `DISCORD_PUBLIC_WEBHOOK_URL`), fresh-only Territory War result announcements, and warmer welcome and farewell posts.

## 0.49.0 — 2026-10-10

- **Installable on a phone**: web app manifest, icons and an iPhone home-screen icon, plus a phones-only "Keep the guild in your pocket" sheet with the steps for iPhone and Android (a one-tap Install button on Android Chrome), reopenable from the mobile menu.

## 0.48.2 — 2026-10-10

- The mobile menu has a visible **Sign out** button.

## 0.48.1 — 2026-10-10

- The mobile menu is three-quarters of the screen width with a faint blueprint grid background.

## 0.48.0 — 2026-10-10

- Fixed the mobile menu collapsing into a thin strip once the page is scrolled (WebKit sizes fixed children against a blurred header); the drawer now renders into the page body.
- Simplified the mobile menu to a short role-aware list that fits one screen.

## 0.47.2 — 2026-10-10

- Field guides rewritten for the Discord sign-in flow, the members' area, My Page and officer access.

## 0.47.1 — 2026-10-10

- The shared officer password is optional in the interface; removing `OFFICER_SITE_PASSWORD` replaces the password boxes with Sign in with Discord.

## 0.47.0 — 2026-10-10

- **My Page** (`/me`): your power, Galactic Legends and relic units with 30-day change, datacrons, your wins, the callouts you're ready for or close to, and your own standing.

## 0.46.0 — 2026-10-10

- **The Discord officer role follows the in-game rank** after every guild sync, with safeguards (linked accounts in the server only, nothing on empty data, at most 8 changes per run).

## 0.45.0 — 2026-10-10

- **No member names in the public view**: Wins and Raids are members-only, public highlights are anonymous, and the field guides are linked from the front page.

## 0.44.0 — 2026-10-10

- **Public front page** with members and spaces, the entry bar (10M GP, 5 Galactic Legends), how to join, **Check your stats**, the Territory War record and highlights; the command centre stays at the same address for signed-in members and officers. The **Wall of Shame is officers-only**.

## 0.43.0 — 2026-10-10

- **Members area**: roster, arsenal, datacrons, Territory War and Territory Battles (with callouts) require a signed-in member or officer; visitors see a Members only page.

## 0.42.0 — 2026-10-10

- **Header account control** (Sign in / your name with Sign out), and sign-out now clears every session.

## 0.41.2 — 2026-10-10

- Fixed the sign-in "loop": sign-in lands on the home page and the gate sends signed-in people straight there.

## 0.41.1 — 2026-10-10

- Discord sign-in skips the Authorize screen for people who have already approved the site.

## 0.41.0 — 2026-10-10

- **In-game officers are site officers**: Officer or Leader rank gives officer access via Discord sign-in. Self-service ally-code linking is refused for officers and requires the Discord account to be in the server.

## 0.40.0 — 2026-10-10

- Linked members sign in with one click (no ally-code step), returning to the page they came from.

## 0.39.0 — 2026-10-10

- A member can have more than one Discord account; extra accounts get the Member role and are demoted together on departure. Self-service linking can no longer replace an existing link.

## 0.38.0 — 2026-10-10

- Discord Sync: an **Unmatched Discord** tab to match from the Discord side; suggestions skip already-linked accounts; bots excluded.

## 0.37.2 — 2026-10-08

- Discord Sync now shows *why* the Discord member list is empty (token rejected, missing Server Members Intent, wrong server ID, or network failure) instead of always saying "Bot connected & active". Previously every failure was swallowed and looked like an empty server.

## 0.37.1 — 2026-10-08

- The Wins feed and weekly Discord digest now only include members currently in the guild, so someone who has just left is neither celebrated nor tagged.

## 0.37.0 — 2026-10-08

- Officer Discord Sync: new **Link N exact matches** button links every unlinked member whose in-game name exactly matches one Discord account, after showing the full list for confirmation. Ambiguous matches (one Discord account matching two players, or already linked) are skipped.
- "Are you a Blues Brother?" nudge on `/wins` and the TB callouts, shown only to visitors who haven't linked (`/api/members/me`).
- Linked members are now tagged by Discord mention in the weekly wins post and in the "closest to ready" list of Discord-posted TB callouts. Mentions only ping members who are linked, and Discord ids never reach the browser.

## 0.36.0 — 2026-10-08

- Added **TB callouts** at the top of `/territory-battles`: officers post "we need this unit at this level" (min stars, min relic, how many needed, phase/planet, a note) and the page shows live progress, who is ready, and who is closest with the exact gap (e.g. `R5 → R7`), matched against synced member rosters.
- Officers can mark callouts finished, reopen or delete them, and optionally post a new callout to Discord (`DISCORD_CALLOUTS_WEBHOOK_URL`, falling back to the wins webhook; nothing posts if neither is set).
- New `TbCallout` table and matching module with unit tests.

## 0.35.0 — 2026-10-08

- Added the weekly **"This week for the Blues Brothers"** Discord post: headline wins (Galactic Legends, ultimates, Relic 7+) named, smaller upgrades summarised, linking back to `/wins`.
- New protected route `/api/cron/weekly-digest` (Vercel Cron, Sundays 17:00 UTC; `?dry=1` previews without posting). Posts at most once per week and nothing when there are no wins.
- Posts to its own channel via `DISCORD_WINS_WEBHOOK_URL`; if unset, nothing is posted.

## 0.34.0 — 2026-10-08

- Added **The Wins** (`/wins`): a public feed of Galactic Legend and Ultimate unlocks, relic level-ups, new units and datacrons, spotted by diffing each member's previous and latest profile during guild sync. Headline wins are highlighted; small upgrades by one member in a day collapse into one line.
- New `GuildWin` table (idempotent on player + kind + unit + value). Migration backfills the 17 Galactic Legend and 15 Ultimate unlocks already visible in profile history (count only; new wins carry unit names).
- Profile refresh batch raised from 2 to 6 players per sync run so wins surface within about two days, since GitHub's scheduled runs fire only a few times a day.
- Fixed `npm test` so it runs every `lib/**/*.test.ts` (the unquoted glob only ran `lib/game`, 12 of 44 tests).

## 0.33.0 — 2026-08-31

- Added distinct runner identities: Jake uses an electric-blue datapad theme, while Elwood uses a warm amber/red theme from character selection through the active run.
- Added a first-run **How to Play** popup and persistent help action explaining the game in four steps: buy low, jump, sell high and pay Jabba.
- Simplified market language (`You own`, `Pay`, `Receive`, `How many`, `Paid avg`) and beginner guidance so players can ignore advanced signals until they understand the basic loop.

## 0.32.0 — 2026-08-31

- Rebuilt the active Mission From God screen as one original, self-contained **BB–1138 Mission Datapad**, taking only broad interaction inspiration from classic trading games.
- Consolidated mission status, destination controls, incoming transmissions, Galactic News, the commodity exchange, Bluesmobile cargo manifest and road log into a denser game-console hierarchy.
- Added tactile navigation/trading controls, CRT-like numeric accents, cargo-capacity gauge and responsive console layouts without copying third-party artwork, window chrome or source material.

## 0.31.0 — 2026-08-31

- Launched the playable `/mission-from-god` Free Play route with Jake/Elwood selection, six-commodity trading, cargo management, five destinations, Jabba debt tracking and the full 30-day loop.
- Added deterministic Galactic News, 12 original decision encounters, bounty escalation and a recurring Boba Fett chase, plus the Day 15 demand and clear win/loss summaries.
- Added versioned device-local autosave/resume, a recent-transmission road log and a responsive retro terminal interface for desktop, tablet and mobile.
- Added Mission From God to the shared desktop and mobile navigation while retaining the existing public credits and fan-project property notice.

## 0.30.0 — 2026-08-31

- Added the isolated Phase 1 `Mission From God` TypeScript engine with Jake/Elwood abilities, five planetary markets, six commodities and deterministic seeded pricing.
- Implemented integer-only trading, weighted-average inventory cost, cargo validation, travel/day progression, Day 15 Jabba resolution and liquid-Credits-only victory/failure rules.
- Added pure deterministic RNG streams, 10 focused engine tests and random/conservative/oracle simulation agents for repeatable economy balancing.
- Tuned the 18,000-Credit starting economy over 6,000 fixed-seed runs: random 0%, conservative 60.15%, future-aware oracle 100% win rates.

## 0.29.1 — 2026-08-31

- Added the staged product and implementation specification for the planned `Mission From God` guild trading game.
- Resolved payment, Daily attempt, persistence, deterministic RNG, server-authority and release-scope rules before implementation begins.
- Recorded the game's creative inspirations, non-commercial fan-project status and property acknowledgement in the public Credits page and retained third-party notices.
- Cleared existing React effect and declaration lint blockers in navigation, Dougie's Discs persistence and the Datacron vault so the web CI gate is green again.

## 0.29.0 — 2026-08-29

- **Categorized Navigation Dropdowns & Field Guides Hub (`/guides`)**:
  - **Categorized Header Navigation (Dropdown Menus)**:
    - Transformed the flat 8+ link navbar into 6 clean, organized dropdown menus with hover/click flyout menus:
      - **Guild Wire** (`/#guild-wire`)
      - **Operations ▾** (Territory War, Datacrons, Territory Battles, Raids, Guild Arsenal, Ops Deck)
      - **Roster ▾** (Member Roster, Wall of Shame)
      - **Cantina & Music ▾** (Dougie's Discs, Soul Food Cafe & Lore)
      - **Officer Deck ▾** (Officer Roster, Discord Sync Governance)
      - **Field Guides ▾** (Account Linking, TW Orders, Datacrons, All Guides)
    - Full keyboard navigation (Tab, Enter, Escape) and smooth blur glassmorphism.
  - **Mobile Menu Accordions**:
    - Reorganized the mobile drawer into collapsible accordion sections with icons and sub-item descriptions.
  - **Field Guides & Simple Instructions Hub (`/guides`)**:
    - Interactive 2-column guide reader with real-time keyword search, category filters, and step-by-step checklists.
    - Added 5 comprehensive, easy-to-follow field guides:
      1. *How to Link Your Account & Enter the Site* (Discord + 9-digit Ally Code)
      2. *Territory War (TW) Member Playbook* (Preview, Defence placement, Attack phase)
      3. *Datacron Mastery: Upgrading, Perks & Rerolls* (Level 9 character perks, faction perks, and stat priorities)
      4. *Dougie's Discs: Turntable Controls & Song Requests* (Turntable controls and custom YouTube queuing)
      5. *Officer Guide: Discord Sync & Roster Governance* (1-click match linking and role reconciliation)
    - Interactive checkable step checkboxes, pro-tip callouts, direct tool launch buttons, FAQ cards, and shareable guide links.

## 0.28.0 — 2026-08-29

- **Discord <-> Game Member Synchronization, Auto-Role Demotion, and Gated Access**:
  - **"The Gig is in Session" Gatekeeper (`/gig-in-session`)**:
    - Restricted landing page featuring the droid bouncer hero image (`/gig-in-session.png`) and glowing velvet rope aesthetics.
    - **Crew Pass Terminal**: 1-click Discord OAuth sign-in, 9-digit SWGOH Ally Code linking, and Officer Keycard access.
    - **Public Cantina Teaser**: Non-members enjoy a preview sampler with Dougie's Discs Chicago blues music player, authentic Soul Food Cafe recipes, guild achievements, and public Discord server invite.
  - **Automated Departure Role Demotion (Game -> Discord)**:
    - Automatically revokes site access when a player departs the SWGOH in-game guild.
    - Strips the Discord Member role and assigns the Discord Public / Guest role (`DISCORD_PUBLIC_ROLE_ID`) during roster sync.
  - **Name Mismatch Resolution & Officer Discord Command Center (`/officer/discord-sync`)**:
    - Smart fuzzy string matcher that strips guild prefixes (`[BB]`, `(BB)`, `BB | `), emojis, and symbols to calculate match confidence scores.
    - Tactical KPI dashboard tracking linked crew, unlinked members, role drift, and Discord server members.
    - Fast search and filter pills (`Unlinked Members`, `Linked Crew`, `Role Drift / Ex-Members`, `All Active Roster`).
    - 1-click suggested match approvals, manual Discord selector modal, and batch role reconcile button (`⚡ Reconcile All Discord Roles`).
  - **Access Control Architecture (`web/lib/access-control.ts` & `web/lib/discord-sync.ts`)**:
    - Comprehensive unit test suite with 24 passing tests verifying fuzzy matching, edit distances, tag stripping, and departure transitions.

- **Header & Hero Polish (Desktop & Mobile)**:
  - Resolved hero copy clearance on Dougie's Discs (`/dougies-discs`), preventing overlap with the fixed top navigation and brand logo on desktop screens.
  - Adjusted main nav gap and font scaling across intermediate desktop resolutions (1024px–1440px) for clean spacing with 8 navigation routes.
  - Redesigned mobile hero padding and alignment across all pages (`/dougies-discs`, `/territory-war`, `/datacrons`, `/operations`, `/members`, `/cantina`), guaranteeing safe clearance below the mobile logo and hamburger menu button.
  - Tested across responsive viewports in browser subagents.

## 0.27.0 — 2026-08-29

- **New Feature: Datacrons Vault & Active Meta Codex (`/datacrons`)**:
  - Created a dedicated Datacrons Hub aggregating live member datacrons and active SWGOH seasonal sets.
  - **Guild Datacron Vault**: Search and filter guild datacrons by Tier (Level 9 Character, Level 6 Faction, Level 3 Alignment), Set, Member, or Rolled Stats. Includes a Member Leaderboard and Signature Character Weapon Roster.
  - **Active Sets & Meta Codex**: Full tactical guide to active SWGOH seasons (Set 20 Imperial/Rebel, Set 19 Republic/Separatist, Set 18 Mando/Sith) with complete breakdowns of Tier 9, Tier 6, and Tier 3 abilities, recommended squad lineups, and TW ratings.
  - **Territory War Command Synergies**: Strategic guide linking high-impact datacrons directly to TW Frontline Defence and Offence nuke assignments.
  - **Reroll & Farming Advisor**: Optimization guide on material thresholds, stat priorities, and Conquest energy investment.
  - Added Datacrons (`DC`) to the top site navigation (`SITE_NAVIGATION`) and Operations launch deck.

## 0.26.3 — 2026-08-29

- **Page Scroll & Stacking Polish (`/dougies-discs` & Site-wide)**:
  - Fixed site header stacking and clipping by moving `SiteHeader` outside isolated hero containers and increasing fixed navbar z-index to `800` with an opaque, blurred backdrop (`rgba(5, 8, 14, 0.94)`).
  - Added a **Persistent Floating Mini-Player Bar** at the bottom of the screen when scrolled past the turntable deck, complete with mini spinning vinyl, track details, playback buttons, volume control, Up Next counter, and an **`↑ Turntable`** smooth jump button.
  - Added a **Crate View Switcher** (`▦ Sleeves` vs `☰ Compact`) allowing users to switch between the 3D retro vinyl sleeve gallery and a sleek, high-density table view with inline spin/queue actions.
  - Added clean scroll margins (`scroll-margin-top: 88px`) and jump buttons (`📂 Dig in Crate (29)`) for effortless navigation.

## 0.26.2 — 2026-08-29

- **Enhanced Up Next Queue & Playlist Management (`/dougies-discs`)**:
  - Fixed asynchronous queue transition and auto-advance by synchronizing live refs for `queue`, `currentTrack`, `catalog`, and playback modes across YouTube iframe state callbacks.
  - Added an inline **⚡ Quick Add** search input with live autocomplete dropdown right inside the Up Next drawer.
  - Added one-click **Crate Preset buttons** (`🕶️ +Blues Brothers`, `🎷 +Chicago Blues`, `🎲 +5 Random`) to fill the queue in one click.
  - Added multi-action buttons on every vinyl card: **▶ Spin**, **⚡ Next** (places track at position #1 to play right after the current song), and **＋ Queue** (appends to end).
  - Added live **"Up Next: [Track]" preview banner** with **▶ Spin Next** button inside the Now Playing LED display.
  - Added per-item controls in Up Next: **▶ Spin**, **▲ Move Up**, **▼ Move Down**, and **✕ Remove**.

## 0.26.1 — 2026-08-29

- **Tightened Cockpit & Above-the-Fold Controls (`/dougies-discs`)**: streamlined Dougie's Discs page hero and integrated the turntable, LED Now Playing readout, tactile playback buttons (⏮, ▶ SPIN / ⏸ PAUSE, ⏭, 🔀, 🔁, Volume slider, Mute, Queue), and Up Next list into a unified compact cockpit so controls are immediately reachable without scrolling.
- **Direct YouTube Audio Playback & Catalog Fix**: verified and updated all 29 track YouTube IDs with live 200 OK embeds across the Blues Brothers and Chicago blues catalog, resolved background media power throttling on audio playback, and added direct postMessage + iframe playback hooks.

## 0.26.0 — 2026-08-29

- **Dougie's Discs galactic Jukebox (`/dougies-discs`)**: new interactive music lounge with custom tavern header art (`/dougies-discs.png`), Blues Brothers movie hits, Chicago blues, Stax soul, and community suggestions.
- **Turntable & Video Stage**: photorealistic 33⅓ RPM rotating vinyl record with color-coded center labels, dynamic tonearm, 12-band pulsing spectrum equalizer, and seamless toggle to full YouTube video stage.
- **Interactive Queue & Crate Digging**: live queue manager with reordering/removal, crate search & category filters (*Blues Brothers*, *Chicago Blues*, *Stax & Soul*, *Delta & Roots*, *Guild Picks*), and local storage persistence.
- **Song Submissions & Soundboard**: guild members can suggest any YouTube track via an instant live-thumbnail validator (`/api/discs/submissions`) and drop synthesized Blues Brothers quotes & needle-drop drops.

## 0.25.0 — 2026-08-24

- **Command-based TW defence assignment**: replaced per-player drag-and-drop with named, reusable squad+kit presets ("Commands") that officers assign directly to a zone — pick a zone, pick a Command (e.g. "GL Vader + Datacron"), done. Every guild gets 12 built-in Commands for free (one per known TW squad) plus fully custom ones officers create inline. New `/api/officer/tw/commands` route and `TwCommand` model.
- **Hold-confidence heuristic**: each zone now shows an honestly-labeled 0–100 hold-confidence score ("Strong Hold"/"Likely Hold"/"Contested"/"Vulnerable") derived from the assigned squad's known counter-vulnerability and available backup depth — explicitly not a fabricated win percentage, since Comlink doesn't expose opponent defense composition.
- **Territory Battle command tool**: new officer planning section on `/territory-battles` using the same Command concept — set a pre-load / push-3★ / hold / skip strategy (and optional Command) per planet, per phase (Day 1–6), with real ROTE planet-name suggestions. New `TerritoryBattlePlan`/`PlanetPlan` models and `/api/officer/tb/plan` + `/api/officer/tb/planets` routes. Sits alongside (not replacing) the existing GP/star optimizer.
- See `docs/knowledge-base.md` §5.9/§5.14.

## 0.24.0 — 2026-08-24

- **Drag-and-drop defence assignment**: in the Territory War command tool's Defence mode, officers can now drag a joined member from a new "Available defenders" chip list straight onto a zone (auto-picks the player's first eligible squad), and drag an existing assignment row onto a different zone tab to move it. Every assignment row also gets an inline squad-correction dropdown, since the drop no longer requires manually selecting a squad. The original manual "Player"/"Squad" form stays as a fallback for touch/mobile devices, since native drag-and-drop is desktop/mouse-only.

## 0.23.0 — 2026-08-24

- **Per-officer attribution**: the Territory War command tool now resolves a best-effort display name off the existing member-link Discord cookie and stamps it as `createdBy`/`updatedBy` on plans, zones, assignments, and attacks, shown as "by \<name\>" throughout the tool. Writes still work even when no name can be resolved (falls back to a generic "Officer" label) — this adds attribution on top of the existing shared officer password, not per-officer accounts.
- **Strategy templates**: a new Templates mode lets officers save, edit, and apply named zone/squad priority presets (`StrategyTemplate`) to a plan; the recommendation engine now factors the active template's zone-fill order and preferred-squad order into its suggestions. New `/api/officer/tw/templates` route.
- CI now runs `web`'s lint, typecheck, and test suite on every push and pull request.

## 0.22.0 — 2026-08-24

- **Territory War command tool**: rebuilt `/territory-war` from a themed read-only dashboard into a practical, multi-phase officer planning tool on top of the existing live TW data. Officers now get a persisted, versioned `TerritoryWarPlan` with per-zone setup, exact player → squad → zone assignments (with a full status lifecycle and recommended/manual source tracking), live conflict/warning detection, an offence-reserve health panel, a player workload view, a manually tracked attack board, and a Discord hand-off (guild strategy message + per-player personal messages). An explicit "Generate Recommendations" step proposes assignments for officer review — nothing is auto-committed. Adds 5 new Prisma models, 6 new `/api/officer/tw/*` routes, and 4 new `lib/tw-*.ts` modules; the underlying live registration/battle-map/roster board above the tool is unchanged. See `docs/knowledge-base.md` §5.9.

## 0.21.0 — 2026-08-21

- **Raid operations** gained real data: `lib/raids.ts` reads Comlink's `recentRaidResult` from the latest guild snapshot and surfaces the last completed attempt for every raid the guild runs, with a searchable, ranked-by-damage participant board (`app/raids/raid-board.tsx`) per raid type.
- Researched Comlink's actual guild-data boundaries: `territoryBattleStatus`/`territoryBattleResult`/`raidStatus` (live states) are not returned by the public `/guild` endpoint outside the guild's own account — only `recentRaidResult` (last completed raid attempt) and `recentTerritoryWarResult`/`territoryWarStatus` (already used) are available. The Territory Battles page copy now states this plainly instead of implying a TW-style live pipeline is coming.
- Updated the homepage raid mission card to reflect that results are now tracked.

## 0.20.0 — 2026-08-21

- **Territory War roster** switched from a grid of always-expanded player cards to a compact, collapsible row list (native `<details>`/`<summary>`), so officers scanning a 50-member war can scan names/locked GP/joined status at a glance and expand only the members they need. Search, registration filter and sort are unchanged.
- **Wall of Fame** rebuilt as a multi-category leaderboard (`lib/wall-of-fame.ts` now returns `WallOfFameCategory[]`) with tabs for Galactic Power, Raid Tickets, Galactic Legends, Relic Units and Datacrons, instead of a single GP-ranked top five. New client component `app/wall-of-fame-board.tsx` renders the tab switcher.
- **Wall of Shame** gained two more attention reasons — raid tickets running low (below half the per-member target) and profiles that haven't rotated through the hourly sync in 7+ days — alongside the existing under-geared/inactivity checks, and now surfaces up to 8 members (was 5), sorted by how many reasons are flagged. The `/members` roster page's attention badges now also consider profile staleness.

## 0.19.1 — 2026-08-21

- Swapped the `tw-banner`/`ops-banner` image content: Territory War now shows the sector/territory network hologram, Operations now shows the mission-briefing holotable — the two had been assigned to the wrong pages since the artwork was first added in v0.18.0.

## 0.19.0 — 2026-08-21

- **Performance pass** to fix slow desktop loads and slow page-to-page navigation:
  - Converted the shared `SiteHeader` and `MobileMenu` primary navigation from plain `<a>` tags to `next/link`, eliminating full hard-reloads on every page switch (the header renders on every route, so this was the biggest single win).
  - Added `lib/guild-snapshot.ts`, a request-memoized (`React.cache()`) shared query for the latest guild snapshot + members, replacing three independent full-guild Prisma queries that were previously fired in parallel on the homepage alone.
  - Trimmed Prisma `include`s to explicit `select`s across `wall-of-fame.ts`, `wall-of-shame.ts`, `members.ts`, `guild-arsenal.ts`, and `member-context.ts`, dropping unused `rawPayload`/`profilePayload` JSON blobs from queries that didn't need them.
  - Replaced blanket `dynamic = "force-dynamic"` with `revalidate = 300` (5-minute ISR) on the seven subpages that don't read cookies, so they now serve prerendered/cached responses instead of re-querying the database on every request. The homepage stays fully dynamic (it reads session cookies).
  - Added a root `app/loading.tsx` skeleton for the homepage's dynamic render.
  - Converted all hero banner and logo images from lossless PNG to WebP (~90–95% smaller: banners ~2–2.5MB → ~140–235KB, logo 1.65MB → 54.5KB at a trimmed 512×512), and removed the orphaned unused `welcome-banner.png`.

## 0.18.4 — 2026-08-21

- Removed the standalone subpage navigation toolbar and integrated the complete site header into every hero.
- Kept the desktop links, theme controls, version and Discord action over the banner artwork, with the existing mobile drawer at smaller breakpoints.
- Gave the Credits page an integrated dark command header so no public destination retains the detached toolbar.

## 0.18.3 — 2026-08-21

- Made every shared internal-page hero span the full viewport directly below the site header, matching the homepage's edge-to-edge treatment.
- Removed the card-like outer rounding while keeping hero text and controls aligned to the 1220px content grid.
- Preserved responsive banner focal points and full-bleed behavior on phone and tablet layouts.

## 0.18.2 — 2026-08-21

- Replaced the subpage breadcrumb bar with the complete homepage header on every public destination.
- Centralized the logo, primary navigation, version, theme controls, Discord action, and responsive mobile drawer in one shared `SiteHeader` component.
- Added light-theme and phone/tablet styling for the shared subpage header while retaining the homepage overlay treatment.

## 0.18.1 — 2026-08-21

- Restored the original `bb-title.png` neon-sign artwork as the homepage hero image.
- Made the internal-page header bar (back link + related destinations) span the full viewport width on every subpage, matching the homepage header treatment.

## 0.18.0 — 2026-08-21

- Added the supplied Welcome, Operations, Territory War, Territory Battle, Raid, Arsenal, Members, and Cantina banner artwork to the matching destinations.
- Introduced one shared responsive internal-page hero with consistent image treatment, typography, gradients, spacing, and accessible alternative text.
- Added dedicated `/territory-battles` and `/raids` readiness pages and promoted their Operations cards from reserved anchors to real routes.
- Tuned wide-banner focal points, hero content, operation shortcuts, and planning cards for desktop, tablet, and mobile layouts.

## 0.17.0 — 2026-08-21

- Added a dedicated Operations hub with prominent shortcuts for Territory War, Territory Battles, raids, and the Guild Arsenal.
- Made Territory War and Operations direct destinations in the desktop and mobile primary navigation.
- Moved the complete member directory and Soul Food Cantina from the increasingly long homepage onto `/members` and `/cantina`.
- Kept compact mission cards on the homepage while linking them into the new route structure.

## 0.16.0 — 2026-08-21

- Added a responsive Territory War room with live registration, locked GP, guild matchup, scores, zone state, commands, and roster readiness.
- Started normalizing active TW status and recent results from the existing Comlink guild response into `GuildEvent` and hourly `EventSnapshot` history.
- Added searchable registration/readiness member cards with current or locked GP, Galactic Legends, relic units, datacrons, activity, and profile-sync clarity.
- Turned the Territory War operations card into a working route while retaining an honest pre-war state when no active event is present.

## 0.14.0 — 2026-08-21

- Replaced café prices and mock ordering with complete, selectable sandwich recipes.
- Added PostgreSQL-backed published recipes with structured ingredients, methods, and beer-pairing data, seeded through a migration.
- Added a complementary beer advisor with crisp, hoppy, malty, and alcohol-free recommendations for every recipe.
- Added a public recipe-submission form and protected API that saves new ideas as pending moderation records.

## 0.13.0 — 2026-08-21

- Added the Soul Food Café as a warm, self-contained destination within the guild dashboard.
- Added six selectable sandwiches inspired by well-known sandwich traditions, led by the café&apos;s Pork Sandwich.
- Added an interactive sandwich maker with bread, main filling, cheese, extras, live pricing, and a kitchen order ticket.
- Added responsive café navigation, custom sandwich illustrations, and mobile layouts without introducing third-party image assets.

## 0.12.0 — 2026-08-20

- Added a live Guild Arsenal showing ownership, seven-star and relic coverage for Galactic Legends, priority units, and capital ships.
- Adapted the priority-unit checklist from the MIT-licensed SWGoHBot project with full in-repo and user-facing attribution.
- Added a Sources & Credits page and third-party notices for open-source dependencies and reused data.
- Documented the wider SWGOH open-source landscape and a licence-aware feature adoption backlog.

## 0.11.0 — 2026-08-20

- Softened the dashboard with roomier spacing, rounded surfaces, layered shadows, and more clearly defined cards.
- Expanded member cards with guild role, player level, Galactic Legends, raid tickets, and guild tenure.
- Added richer member profiles with character/ship GP, relic-unit and datacron counts, activity, and join history.
- Persisted the complete guild/member payload on hourly snapshots and added rotating full player-profile enrichment.
- Added historical player-profile aggregates while retaining each player&apos;s complete latest Comlink profile.

## 0.10.0 — 2026-08-20

- Replaced the roster summary with a searchable, sortable directory and one interactive card per member.
- Added member detail dialogs with guild rank, galactic power, raid tickets, activity, tenure, and attention status.
- Reworked the Wall of Fame and officer watchlist into a compact, linked standings board with clearer hierarchy.
- Simplified the lower dashboard into focused personal-account and officer-work areas.

## 0.9.0 — 2026-08-19

- Added the Wall of Fame: a leaderboard celebrating the guild's top galactic power and maxed raid-ticket members.

## 0.8.0 — 2026-08-19

- Added Discord OAuth account linking with ally-code verification, so members can prove ownership of their roster entry.
- Fixed the previously dormant departure automation by giving members a way to actually set `discordUserId`.
- Added a personalized "cantina card" on the Members panel showing linked members their live GP, raid tickets, and Wall of Shame status.

## 0.7.0 — 2026-08-19

- Wired the dashboard metric cards to the latest live guild snapshot instead of static placeholders.
- Added the Wall of Shame: a themed bulletin surfacing under-geared or inactive members from the latest sync.
- Added an officer's desk with a shared-password sign-in and a composer that posts Cantina notices straight to the Guild Wire and Discord.
- Made the automation feed, roster preview, and Discord sync status reflect real data across desktop and mobile.

## 0.6.0 — 2026-08-19

- Added the Guild Wire as the shared website and Discord communications feed.
- Added a protected daily roster sync with a safe first-run membership baseline.
- Added automatic welcome and departure announcements through Discord.
- Added Discord member-role removal for departed players with verified account mappings.
- Added the optional official Discord server-presence widget and direct conversation links.

## 0.5.0 — 2026-08-19

- Added Prisma 7 with the PostgreSQL driver adapter.
- Added deploy-time Prisma Client generation.
- Added configuration for pooled runtime and optional direct migration URLs.
- Added a non-sensitive database health endpoint.

## 0.4.5 — 2026-08-19

- Lowered the desktop logo, navigation, and utilities to align with the cantina sign.
- Returned the hero heading group closer to its natural lower composition.
- Retained tighter top spacing for tablet and phone drawer layouts.

## 0.4.4 — 2026-08-19

- Increased desktop navigation labels from 14px to 17px.
- Shifted navigation toward the logo while retaining right-aligned utilities.
- Reduced the logo by 20% across desktop, tablet, and phone layouts.

## 0.4.3 — 2026-08-19

- Removed the permanently selected Command centre item.
- Reduced primary navigation to Operations, Members, and Administration.
- Increased spacing between the remaining desktop menu labels.
- Removed the default selected state from the tablet and mobile drawer.

## 0.4.2 — 2026-08-19

- Added left-to-right lightsaber ignition underlines to desktop navigation.
- Added matching hover and keyboard-focus effects to drawer navigation.
- Preserved a visible ignited blade for the current section.

## 0.4.1 — 2026-08-19

- Lifted the complete hero content group higher within the artwork.
- Increased desktop navigation text to improve prominence and readability.
- Applied smaller proportional hero adjustments for tablet and phone layouts.

## 0.4.0 — 2026-08-19

- Added a dedicated tablet and mobile navigation drawer.
- Added keyboard Escape handling, background scroll locking, and larger touch targets.
- Reflowed event and administration panels for tablet and phone layouts.
- Retained the transparent desktop navigation over the hero.

## 0.3.2 — 2026-08-19

- Enlarged the guild emblem to roughly two-and-a-half times its previous desktop size.
- Returned primary navigation to the top of the hero without a container background.
- Replaced the active menu pill with a subtle neon underline.

## 0.3.1 — 2026-08-19

- Removed the framed navigation bar from the hero artwork.
- Moved primary navigation into the gradient transition below the image.
- Reduced the hero overlay to an unframed logo and compact utility controls.

## 0.3.0 — 2026-08-19

- Added the default dark-to-desert gradient theme.
- Made the hero artwork span the full viewport width.
- Replaced the sidebar with a floating responsive navigation bar.
- Expanded the theme control to Gradient, Light, and Dark modes.

## 0.2.0 — 2026-08-19

- Added the original Blues Brothers guild emblem and browser icon.
- Added persistent light and dark colour modes.
- Reworked the visual system around the desert cantina hero artwork.
- Added the application version to the command header and footer.

## 0.1.0 — 2026-08-19

- Created the initial guild command-centre placeholder.
- Added guild health, events, membership, and administration panels.
- Added the proposed Prisma data model and Vercel setup notes.
