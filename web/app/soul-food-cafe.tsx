"use client";

import { type FormEvent, useState } from "react";
import type { BeerPreference, SoulFoodRecipe } from "@/lib/recipes";

const BEER_PREFERENCES: Array<{ id: BeerPreference; label: string; note: string }> = [
  { id: "crisp", label: "Crisp & clean", note: "Lagers and pilsners" },
  { id: "hoppy", label: "Hoppy & bright", note: "Pale ales and IPAs" },
  { id: "malty", label: "Malty & smooth", note: "Amber and dark lagers" },
  { id: "alcohol-free", label: "Alcohol-free", note: "Full flavour, no alcohol" },
];

function SandwichArt({ tone }: { tone: string }) {
  return (
    <span className={`sandwich-art sandwich-${tone}`} aria-hidden="true">
      <i className="sandwich-bread sandwich-bread-top" />
      <i className="sandwich-greens" />
      <i className="sandwich-filling" />
      <i className="sandwich-cheese" />
      <i className="sandwich-bread sandwich-bread-bottom" />
    </span>
  );
}

export default function SoulFoodCafe({ recipes }: { recipes: SoulFoodRecipe[] }) {
  const [selectedId, setSelectedId] = useState(recipes[0]?.id ?? "");
  const [beerPreference, setBeerPreference] = useState<BeerPreference>("crisp");
  const [submissionState, setSubmissionState] = useState<{ kind: "idle" | "sending" | "success" | "error"; message: string }>({ kind: "idle", message: "" });

  const selectedRecipe = recipes.find((recipe) => recipe.id === selectedId) ?? recipes[0];
  const beerPairing = selectedRecipe?.beerPairings.find((pairing) => pairing.preference === beerPreference)
    ?? selectedRecipe?.beerPairings[0];

  async function submitRecipe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setSubmissionState({ kind: "sending", message: "Transmitting your recipe to the cantina databank…" });

    const payload = Object.fromEntries(formData.entries());
    try {
      const response = await fetch("/api/recipes/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "The recipe could not be saved.");
      form.reset();
      setSubmissionState({ kind: "success", message: "Transmission received. An officer will review it before it joins the cantina archive." });
    } catch (error) {
      setSubmissionState({ kind: "error", message: error instanceof Error ? error.message : "The recipe could not be saved." });
    }
  }

  if (!selectedRecipe) return null;

  return (
    <section className="soul-food-cafe" id="soul-food-cantina" aria-labelledby="soul-food-heading">
      <div className="cantina-stars" aria-hidden="true" />
      <div className="cafe-heading">
        <div>
          <p className="eyebrow">Jake &amp; Elwood&apos;s · Outer Rim kitchen</p>
          <h2 id="soul-food-heading">The Soul Food<br /><em>Cantina.</em></h2>
          <div className="cantina-frequency" aria-label="Cantina motto"><span>BB-19</span> We&apos;re on a mission from the Guild</div>
        </div>
        <div className="cafe-open-sign"><i /> Cantina online <span>{recipes.length} recipes in the databank</span></div>
      </div>
      <p className="cafe-intro">Two brothers, one battered star cruiser and the best sandwiches from Chicago to the Outer Rim. Pick a galactic special, ask the tap droid for a beer pairing, or transmit your own recipe to the guild.</p>

      <div className="signature-heading">
        <div><span>01</span><h3>Galactic specials with soul</h3></div>
        <p>Select a transmission to decode the recipe.</p>
      </div>
      <div className="signature-grid">
        {recipes.map((recipe) => (
          <button
            className={`signature-card${selectedRecipe.id === recipe.id ? " signature-selected" : ""}`}
            type="button"
            key={recipe.id}
            onClick={() => setSelectedId(recipe.id)}
            aria-pressed={selectedRecipe.id === recipe.id}
          >
            <span className="signature-card-top"><small>{recipe.origin}</small><strong>Cantina archive</strong></span>
            <SandwichArt tone={recipe.tone} />
            <span className="signature-card-copy"><strong>{recipe.name}</strong><small>{recipe.description}</small></span>
            <span className="signature-card-action">Decode recipe <b>→</b></span>
          </button>
        ))}
      </div>

      <div className="recipe-workbench">
        <article className="recipe-sheet" aria-live="polite">
          <header>
            <div><p>Now spinning in the kitchen</p><h3>{selectedRecipe.name}</h3><span>{selectedRecipe.origin}</span></div>
            <SandwichArt tone={selectedRecipe.tone} />
          </header>
          <div className="recipe-columns">
            <section>
              <div className="signature-heading recipe-subheading"><div><span>02</span><h4>Cargo manifest</h4></div></div>
              <ul className="ingredient-list">
                {selectedRecipe.ingredients.map((ingredient) => <li key={ingredient}>{ingredient}</li>)}
              </ul>
            </section>
            <section>
              <div className="signature-heading recipe-subheading"><div><span>03</span><h4>Mission briefing</h4></div></div>
              <ol className="method-list">
                {selectedRecipe.instructions.map((instruction, index) => <li key={instruction}><span>{index + 1}</span><p>{instruction}</p></li>)}
              </ol>
            </section>
          </div>
        </article>

        <aside className="beer-advisor" aria-labelledby="beer-advisor-heading">
          <div className="beer-advisor-mark" aria-hidden="true"><span /><i /></div>
          <p className="eyebrow">Mos Eisley tap droid · TD-40</p>
          <h3 id="beer-advisor-heading">Choose your side of the pour.</h3>
          <div className="beer-preferences">
            {BEER_PREFERENCES.map((preference) => (
              <button key={preference.id} type="button" className={beerPreference === preference.id ? "selected" : ""} aria-pressed={beerPreference === preference.id} onClick={() => setBeerPreference(preference.id)}>
                <strong>{preference.label}</strong><small>{preference.note}</small>
              </button>
            ))}
          </div>
          {beerPairing && (
            <div className="beer-result" aria-live="polite">
              <span>TD-40 recommends with {selectedRecipe.name}</span>
              <h4>{beerPairing.beer}</h4>
              <p>{beerPairing.style}</p>
              <blockquote>{beerPairing.reason}</blockquote>
            </div>
          )}
          <small className="beer-note">Droid recommendations are suggestions, not Jedi law. Enjoy responsibly; every recipe has a zero-proof hyperspace route.</small>
        </aside>
      </div>

      <section className="recipe-submission" aria-labelledby="submit-recipe-heading">
        <div className="submission-intro">
          <p className="eyebrow">Open guild transmission</p>
          <h3 id="submit-recipe-heading">Send us your cantina special</h3>
          <p>Family recipe, local legend or something invented after the Kessel Run—we want the sandwich you actually make. Every transmission is reviewed before it reaches the public menu.</p>
          <div><strong>Transmission path</strong><span>Queued in the databank</span><span>Reviewed by an officer</span><span>Broadcast to the cantina</span></div>
        </div>
        <form className="recipe-form" onSubmit={submitRecipe}>
          <div className="recipe-form-grid">
            <label><span>Special name *</span><input name="name" required maxLength={100} placeholder="The Dagobah Melt" /></label>
            <label><span>Home system</span><input name="origin" maxLength={100} placeholder="Dublin, Chicago, the Outer Rim…" /></label>
            <label><span>Bread *</span><input name="bread" required maxLength={300} placeholder="What holds it together?" /></label>
            <label><span>Main filling *</span><input name="filling" required maxLength={500} placeholder="The heart of the sandwich" /></label>
            <label className="recipe-form-wide"><span>Toppings and sauces *</span><textarea name="toppings" required maxLength={500} rows={3} placeholder="Cheese, pickles, slaw, mustard…" /></label>
            <label className="recipe-form-wide"><span>Method *</span><textarea name="instructions" required maxLength={4000} rows={6} placeholder="Write the steps clearly enough for another member to cook it." /></label>
            <label><span>Your cantina pour</span><input name="beerSuggestion" maxLength={300} placeholder="Optional beer style or zero-proof pick" /></label>
            <label><span>Your name</span><input name="submitterName" maxLength={100} placeholder="Optional credit" /></label>
            <label className="recipe-form-wide"><span>Anything else?</span><textarea name="notes" maxLength={1000} rows={3} placeholder="History, substitutions or the story behind it." /></label>
            <label className="cafe-honeypot" aria-hidden="true"><span>Website</span><input name="website" tabIndex={-1} autoComplete="off" /></label>
          </div>
          <div className="recipe-form-submit">
            <button type="submit" disabled={submissionState.kind === "sending"}>{submissionState.kind === "sending" ? "Transmitting…" : "Transmit to the cantina"}<span>→</span></button>
            <p className={`submission-${submissionState.kind}`} aria-live="polite">{submissionState.message || "Required fields are marked with an asterisk."}</p>
          </div>
        </form>
      </section>
    </section>
  );
}
