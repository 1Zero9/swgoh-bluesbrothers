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
    setSubmissionState({ kind: "sending", message: "Sending your recipe to the café notebook…" });

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
      setSubmissionState({ kind: "success", message: "Recipe received. It is waiting for an officer to review it before it joins the menu." });
    } catch (error) {
      setSubmissionState({ kind: "error", message: error instanceof Error ? error.message : "The recipe could not be saved." });
    }
  }

  if (!selectedRecipe) return null;

  return (
    <section className="soul-food-cafe" id="soul-food-cafe" aria-labelledby="soul-food-heading">
      <div className="cafe-heading">
        <div>
          <p className="eyebrow">Soul Food Café · The recipe notebook</p>
          <h2 id="soul-food-heading">Pass the bread.<br /><em>Keep the story.</em></h2>
        </div>
        <div className="cafe-open-sign"><i /> Kitchen notebook <span>{recipes.length} recipes recorded</span></div>
      </div>
      <p className="cafe-intro">Cook a renowned sandwich from around the world, find the beer that belongs beside it, or leave one of your own recipes for the guild.</p>

      <div className="signature-heading">
        <div><span>01</span><h3>Sandwiches with a reputation</h3></div>
        <p>Choose one to open the complete recipe.</p>
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
            <span className="signature-card-top"><small>{recipe.origin}</small><strong>Recorded recipe</strong></span>
            <SandwichArt tone={recipe.tone} />
            <span className="signature-card-copy"><strong>{recipe.name}</strong><small>{recipe.description}</small></span>
            <span className="signature-card-action">Open recipe <b>→</b></span>
          </button>
        ))}
      </div>

      <div className="recipe-workbench">
        <article className="recipe-sheet" aria-live="polite">
          <header>
            <div><p>Selected recipe</p><h3>{selectedRecipe.name}</h3><span>{selectedRecipe.origin}</span></div>
            <SandwichArt tone={selectedRecipe.tone} />
          </header>
          <div className="recipe-columns">
            <section>
              <div className="signature-heading recipe-subheading"><div><span>02</span><h4>What you need</h4></div></div>
              <ul className="ingredient-list">
                {selectedRecipe.ingredients.map((ingredient) => <li key={ingredient}>{ingredient}</li>)}
              </ul>
            </section>
            <section>
              <div className="signature-heading recipe-subheading"><div><span>03</span><h4>How to make it</h4></div></div>
              <ol className="method-list">
                {selectedRecipe.instructions.map((instruction, index) => <li key={instruction}><span>{index + 1}</span><p>{instruction}</p></li>)}
              </ol>
            </section>
          </div>
        </article>

        <aside className="beer-advisor" aria-labelledby="beer-advisor-heading">
          <div className="beer-advisor-mark" aria-hidden="true"><span /><i /></div>
          <p className="eyebrow">Complementary pairing advisor</p>
          <h3 id="beer-advisor-heading">What are you in the mood for?</h3>
          <div className="beer-preferences">
            {BEER_PREFERENCES.map((preference) => (
              <button key={preference.id} type="button" className={beerPreference === preference.id ? "selected" : ""} aria-pressed={beerPreference === preference.id} onClick={() => setBeerPreference(preference.id)}>
                <strong>{preference.label}</strong><small>{preference.note}</small>
              </button>
            ))}
          </div>
          {beerPairing && (
            <div className="beer-result" aria-live="polite">
              <span>Pour this with {selectedRecipe.name}</span>
              <h4>{beerPairing.beer}</h4>
              <p>{beerPairing.style}</p>
              <blockquote>{beerPairing.reason}</blockquote>
            </div>
          )}
          <small className="beer-note">Pairings are suggestions, not rules. Enjoy responsibly; every recipe includes an alcohol-free route.</small>
        </aside>
      </div>

      <section className="recipe-submission" aria-labelledby="submit-recipe-heading">
        <div className="submission-intro">
          <p className="eyebrow">Add to the notebook</p>
          <h3 id="submit-recipe-heading">Submit your own sandwich</h3>
          <p>Family recipe, local legend, midnight invention—we want the version you actually make. New submissions are reviewed before appearing publicly.</p>
          <div><strong>What happens next?</strong><span>Saved as pending</span><span>Reviewed by an officer</span><span>Published to the café</span></div>
        </div>
        <form className="recipe-form" onSubmit={submitRecipe}>
          <div className="recipe-form-grid">
            <label><span>Sandwich name *</span><input name="name" required maxLength={100} placeholder="The Sunday Special" /></label>
            <label><span>Where is it from?</span><input name="origin" maxLength={100} placeholder="Dublin, Chicago, your kitchen…" /></label>
            <label><span>Bread *</span><input name="bread" required maxLength={300} placeholder="What holds it together?" /></label>
            <label><span>Main filling *</span><input name="filling" required maxLength={500} placeholder="The heart of the sandwich" /></label>
            <label className="recipe-form-wide"><span>Toppings and sauces *</span><textarea name="toppings" required maxLength={500} rows={3} placeholder="Cheese, pickles, slaw, mustard…" /></label>
            <label className="recipe-form-wide"><span>Method *</span><textarea name="instructions" required maxLength={4000} rows={6} placeholder="Write the steps clearly enough for another member to cook it." /></label>
            <label><span>Your beer suggestion</span><input name="beerSuggestion" maxLength={300} placeholder="Optional style or bottle" /></label>
            <label><span>Your name</span><input name="submitterName" maxLength={100} placeholder="Optional credit" /></label>
            <label className="recipe-form-wide"><span>Anything else?</span><textarea name="notes" maxLength={1000} rows={3} placeholder="History, substitutions or the story behind it." /></label>
            <label className="cafe-honeypot" aria-hidden="true"><span>Website</span><input name="website" tabIndex={-1} autoComplete="off" /></label>
          </div>
          <div className="recipe-form-submit">
            <button type="submit" disabled={submissionState.kind === "sending"}>{submissionState.kind === "sending" ? "Saving recipe…" : "Send to the café notebook"}<span>→</span></button>
            <p className={`submission-${submissionState.kind}`} aria-live="polite">{submissionState.message || "Required fields are marked with an asterisk."}</p>
          </div>
        </form>
      </section>
    </section>
  );
}
