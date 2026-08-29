"use client";

import { useState } from "react";
import Link from "next/link";
import { FIELD_GUIDES, GUIDE_CATEGORIES, GuideItem } from "@/lib/guides-data";

export default function GuidesInteractive() {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGuideId, setActiveGuideId] = useState<string>(FIELD_GUIDES[0].id);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [copiedLink, setCopiedLink] = useState(false);

  // Filter guides
  const filteredGuides = FIELD_GUIDES.filter((guide) => {
    if (selectedCategory !== "ALL" && guide.category !== selectedCategory) {
      return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesTitle = guide.title.toLowerCase().includes(q);
    const matchesDesc = guide.shortDescription.toLowerCase().includes(q);
    const matchesSteps = guide.steps.some(
      (s) => s.title.toLowerCase().includes(q) || s.instruction.toLowerCase().includes(q),
    );

    return matchesTitle || matchesDesc || matchesSteps;
  });

  const activeGuide =
    FIELD_GUIDES.find((g) => g.id === activeGuideId) || filteredGuides[0] || FIELD_GUIDES[0];

  function toggleStep(stepKey: string) {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepKey]: !prev[stepKey],
    }));
  }

  function handleShareGuide(slug: string) {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/guides#${slug}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }

  return (
    <div className="guides-container">
      {/* 1. Category Bar & Search */}
      <section className="guides-toolbar" aria-label="Guide filters">
        <div className="guides-categories">
          {GUIDE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`guide-category-chip${selectedCategory === cat.id ? " active" : ""}`}
              onClick={() => {
                setSelectedCategory(cat.id);
                // If current active guide is outside selected category, select first in category
                const firstInCat = FIELD_GUIDES.find(
                  (g) => cat.id === "ALL" || g.category === cat.id,
                );
                if (firstInCat) setActiveGuideId(firstInCat.id);
              }}
            >
              <span>{cat.icon}</span>
              <strong>{cat.label}</strong>
            </button>
          ))}
        </div>

        <div className="guides-search-box">
          <input
            type="search"
            className="guides-search-input"
            placeholder="Search instructions, keywords, steps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </section>

      {/* 2. Main 2-Column Reader Layout */}
      <div className="guides-layout-grid">
        {/* Left Column: Guide Cards List */}
        <aside className="guides-sidebar" aria-label="Available guides">
          <header className="sidebar-head">
            <h3>Field Manuals ({filteredGuides.length})</h3>
            <small>Select a guide to view step-by-step instructions</small>
          </header>

          <div className="guides-card-list">
            {filteredGuides.length === 0 ? (
              <div className="guides-empty-list">
                <span>ℹ</span>
                <p>No guides match your search.</p>
              </div>
            ) : (
              filteredGuides.map((guide) => {
                const isSelected = guide.id === activeGuide.id;
                const totalSteps = guide.steps.length;
                const checkedSteps = guide.steps.filter(
                  (s) => completedSteps[`${guide.id}-${s.stepNumber}`],
                ).length;

                return (
                  <button
                    key={guide.id}
                    type="button"
                    className={`guide-nav-card${isSelected ? " active" : ""}`}
                    onClick={() => setActiveGuideId(guide.id)}
                  >
                    <div className="guide-nav-top">
                      <span className="guide-nav-icon">{guide.icon}</span>
                      <div className="guide-nav-meta">
                        <span className="guide-category-tag">{guide.categoryLabel}</span>
                        {guide.badge && <span className="guide-badge-tag">{guide.badge}</span>}
                      </div>
                    </div>

                    <h4>{guide.title}</h4>
                    <p>{guide.shortDescription}</p>

                    <div className="guide-nav-bottom">
                      <span className="guide-time">⏱ {guide.estimatedMinutes} min read</span>
                      <span className="guide-step-count">
                        {checkedSteps > 0 ? `✓ ${checkedSteps}/${totalSteps} done` : `${totalSteps} steps`}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Column: Active Step-by-Step Reader */}
        <main className="guides-reader-panel" id={activeGuide.slug} aria-label="Active field guide">
          <header className="reader-header">
            <div className="reader-meta-row">
              <div className="reader-badges">
                <span className="guide-category-tag">{activeGuide.categoryLabel}</span>
                <span className="guide-audience-tag">👤 {activeGuide.targetAudience}</span>
                <span className="guide-time-tag">⏱ {activeGuide.estimatedMinutes} min walkthrough</span>
              </div>

              <button
                type="button"
                className="btn-share-guide"
                onClick={() => handleShareGuide(activeGuide.slug)}
                title="Copy direct link to this guide"
              >
                {copiedLink ? "✓ Copied Link!" : "🔗 Share Guide"}
              </button>
            </div>

            <div className="reader-title-group">
              <span className="reader-big-icon">{activeGuide.icon}</span>
              <div>
                <h2>{activeGuide.title}</h2>
                <p className="reader-subtitle">{activeGuide.shortDescription}</p>
              </div>
            </div>
          </header>

          {/* Step-by-Step Cards */}
          <section className="reader-steps-section">
            <h3 className="section-label">Follow These Steps:</h3>

            <div className="reader-steps-list">
              {activeGuide.steps.map((step) => {
                const stepKey = `${activeGuide.id}-${step.stepNumber}`;
                const isDone = Boolean(completedSteps[stepKey]);

                return (
                  <article key={step.stepNumber} className={`reader-step-card${isDone ? " is-completed" : ""}`}>
                    <div className="step-card-header">
                      <button
                        type="button"
                        className={`step-checkbox${isDone ? " checked" : ""}`}
                        onClick={() => toggleStep(stepKey)}
                        aria-label={`Mark step ${step.stepNumber} as complete`}
                      >
                        {isDone ? "✓" : step.stepNumber}
                      </button>

                      <div className="step-title-wrap">
                        <span className="step-kicker">STEP {step.stepNumber} OF {activeGuide.steps.length}</span>
                        <h4>{step.title}</h4>
                      </div>
                    </div>

                    <div className="step-body">
                      <p className="step-instruction">{step.instruction}</p>

                      {step.tip && (
                        <div className="step-tip-box">
                          <span className="tip-icon">💡</span>
                          <div>
                            <strong>Pro Tip:</strong> <span>{step.tip}</span>
                          </div>
                        </div>
                      )}

                      {step.actionHref && (
                        <div className="step-action-row">
                          <Link href={step.actionHref} className="btn-step-action">
                            {step.actionLabel || "Launch Tool →"}
                          </Link>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* FAQ Section */}
          {activeGuide.faq.length > 0 && (
            <section className="reader-faq-section">
              <h3 className="section-label">Frequently Asked Questions</h3>
              <div className="faq-grid">
                {activeGuide.faq.map((item, idx) => (
                  <div key={idx} className="faq-card">
                    <strong>Q: {item.question}</strong>
                    <p>{item.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
