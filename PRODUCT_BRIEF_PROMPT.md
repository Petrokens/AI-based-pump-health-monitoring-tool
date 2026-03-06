# Product Brief Generator — Reusable Prompt

**Use this prompt** when you start a new product. Paste it (and fill the bracketed placeholders) to generate a full **Product Brief & Business Document** in the same structure and quality as this repo’s `PRODUCT_BRIEF.md`.

---

## Title suggestion for the new document

**`PRODUCT_BRIEF.md`**  
*(or `PRODUCT_BRIEF_[ProductName].md` if you keep multiple briefs)*

---

## The prompt (copy and customize)

```
Create a complete **Product Brief & Business Document** (Markdown) for the following product. Follow the exact section structure and style below. Use clear tables, bullet lists, and bold for key numbers. Keep tone professional and business-ready.

**Product to document:** [Describe your product in 1–2 sentences. Example: "A B2B SaaS platform that does X for Y industry."]

**Target customers/industry:** [e.g. SMBs, enterprises, healthcare, manufacturing, etc.]

**Core value proposition in one line:** [e.g. "Reduces unplanned downtime by 40% through predictive maintenance."]

---

**Required document structure — generate full content for each section:**

1. **Problem Statement**  
   - 4–6 bullet points: pain points, costs, gaps, and why current solutions fall short. Include rough cost of the problem (e.g. $X per incident or % loss).

2. **Solution**  
   - Name the product and list 4–6 solution pillars: what it does, key features, and how it addresses the problems. Mention differentiators (e.g. single dashboard, AI, auditability).

3. **Scope**  
   - Table: Area | In Scope. Rows for: product/equipment focus, data sources, analytics/capabilities, UI areas, API, and target users/tenancy.

4. **Product Overview**  
   - Bullet list: Name, Type (e.g. SaaS, on-prem), Stack (tech), Delivery (web/app/API), Differentiator (one sentence).

5. **Business Model**  
   - B2B/B2C, pricing approach (tiered/value-based), deployment options (cloud/on-prem), go-to-market (direct, channels, land-and-expand).

6. **Revenue Model & Industries**  
   - **Revenue streams:** 4 bullets (e.g. Subscription, Professional services, Premium add-ons, Support/SLA).  
   - **Client-based revenue & profit (illustrative):**  
     - **Baseline table:** One steady-state scenario (e.g. 20 active clients) with: Active clients, Blended ARPU ($/client/month), MRR, ARR, Professional services revenue, Total annual revenue, Gross margin %, Annual gross profit (SaaS), Annual gross profit (total).  
     - **Base assumptions:** ARPU, margins, onboarding/services assumptions.  
     - **Growth roadmap table:** Columns = Horizon | Active clients (target) | MRR | ARR (run-rate) | Services revenue (period) | Total revenue (period) | Gross profit (period). Rows = 3 months, 6 months, 1 year, 3 years, 5 years with realistic client growth and profit.  
     - **Summary:** Short recap tying baseline to each horizon (e.g. "20 clients → $X profit; 200 clients → $Y profit").  
   - **Primary industries table:** Industry | Use case | Willingness to pay (High/Medium/Medium–High/Low).

7. **6-Month and 1-Year Scope Prediction**  
   - Table: Horizon | Scope. Two rows (6 months, 1 year) with 4–6 bullet points each on product, pilots, integrations, deployment, and commercial milestones.

8. **Value of the Product**  
   - 4–6 bullets: quantified benefits (downtime reduction, cost savings %), efficiency gains, visibility, compliance, scalability.

9. **Comparison with Other Product Sectors (Project-Based Market Value)**  
   - Intro sentence: how this product compares to other sectors by market value and success rates.  
   - Table: Product sector | Typical competitor success rate | Sector market value/dynamics | This project's position. Include this product’s sector plus 4–6 adjacent sectors (e.g. LMS, CRM, ERP, CMMS, BI, IoT).  
   - Conclusion: 2–3 sentences on why this product’s sector and positioning give it a clearer path (or challenges).

10. **Competitors**  
    - Table: Type | Examples | Differentiation of this product. 3–5 competitor types with real or representative examples.  
    - One sentence **Positioning** (standalone vs module, key differentiator).

11. **Industries Addressed**  
    - Bullet list: industry name — short use case or segment (one line each). 5–8 industries.

12. **Future Implementation (Roadmap)**  
    - Table: Priority (P0/P1/P2/P3) | Initiative. 8–12 initiatives (auth, integrations, scale, advanced features, mobile, partners).

13. **Summary**  
    - One paragraph: problem, solution, scope, value, revenue model, industries, and 6–12 month outlook. End with positioning for commercial deployment and growth.

---

**Formatting rules:**  
- Use `##` for section numbers and titles.  
- Use tables in Markdown. Use **bold** for key metrics and product name.  
- Add "---" between major sections.  
- End with "*End of document.*"  
- Document header: product title as H1, "Product Brief & Business Document" as H2; include Document Version, Last Updated, Classification.
```

---

## How to use

1. **Copy** the prompt above (from "Create a complete..." through "...Classification.").
2. **Replace** all `[bracketed]` placeholders with your product name, industry, and value proposition.
3. **Paste** into your AI assistant (e.g. Cursor/Chat) and ask it to generate the full `PRODUCT_BRIEF.md`.
4. **Save** the output as `PRODUCT_BRIEF.md` in your product repo and refine numbers (ARPU, clients, margins) to match your real plan.
5. **Reuse** this prompt for every new product so all briefs stay consistent in structure and quality.

---

*This prompt is based on the structure of PRODUCT_BRIEF.md in this repository.*
