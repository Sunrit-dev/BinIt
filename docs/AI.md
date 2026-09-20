# Binit — AI Computer Vision & Severity Engine

> **Module:** AI Vision & Heuristic Prioritization Subsystem  
> **Framework:** PyTorch / Hugging Face Transformers / OpenCV

---

## 1. Waste Classification Taxonomy

Binit categorizes waste into 11 distinct classes:

| Class Code | Name | Indian Urban & Rural Examples | Base Severity Score |
|---|---|---|:---:|
| `PLASTIC` | Plastic Waste | Polythene carry bags, PET bottles, food packaging, plastic cups | 25 |
| `PAPER` | Paper & Cardboard | Newspapers, cartons, flyers, disposable boxes | 15 |
| `METAL` | Metal Waste | Tin cans, scrap wire, bottle caps, discarded bicycle parts | 25 |
| `GLASS` | Glass | Broken bottles, jars, window shards | 20 |
| `ORGANIC` | Food & Wet Waste | Kitchen refuse, market vegetables, agricultural residue | 30 |
| `E_WASTE` | Electronic Waste | Batteries, old cables, mobile components, circuit boards | 50 |
| `TEXTILE` | Clothing & Fabric | Discarded garments, rags, gunny sacks | 15 |
| `HAZARDOUS` | Hazardous & Medical | Syringes, chemical containers, paint solvents, medical masks | 70 (Min floor: 70) |
| `MIXED` | Mixed Unsegregated | Composite open dump piles with multiple materials | 35 |
| `OTHER` | Other Identifiable | Rubber tires, construction debris | 20 |
| `UNKNOWN` | Visually Ambiguous | Blurry/dark photos where material cannot be determined | 15 |

---

## 2. Confidence & Uncertainty Model

- Model inference returns probability vector $P = [p_1, p_2, \dots, p_{11}]$.
- Primary prediction: $C = \arg\max(P)$, Confidence: $c = \max(P)$.
- **Confidence Gate:**
  - If $c \ge 0.70 \implies \text{status} = \text{CLASSIFIED}$.
  - If $c < 0.70 \implies \text{status} = \text{PENDING\_REVIEW}, \; \text{classification\_status} = \text{NEEDS\_REVIEW}$.

---

## 3. Explainable Severity Calculation

$$S = \min\left(100, \; S_{\text{category}} + S_{\text{quantity}} + S_{\text{proximity}} + S_{\text{duplicate}} + S_{\text{age}}\right)$$

Where:
- $S_{\text{category}}$: Base weight from taxonomy table above.
- $S_{\text{quantity}}$: $+20$ for large piles, $+10$ for medium, $+0$ for isolated litter.
- $S_{\text{proximity}}$: $+15$ near water bodies/canals, $+10$ near arterial roads/hospitals.
- $S_{\text{duplicate}}$: $+10$ if $\ge 2$ unverified reports exist within 50m in last 48h.
- $S_{\text{age}}$: $+5$ if open $>48$ hours.

---
*End of AI Specification*
