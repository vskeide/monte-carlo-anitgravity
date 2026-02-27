# Monte Carlo Simulation — Excel Add-in Guide

## 1. Getting Started

### Installation
1. Open Excel → **Insert** → **Office Add-ins** → **Upload My Add-in**
2. Select `manifest.xml` from this project
3. The **Monte Carlo Sim** task pane opens on the right

### Quick Test
Enter this simple DCF model in a worksheet:

| Cell | Label | Formula |
|------|-------|---------|
| A1 | Base Revenue | `1000000` |
| B2 | Revenue Growth | `=MC.PERT(0.04, 0.08, 0.14, "Revenue Growth")` |
| B3 | Operating Margin | `=MC.TRIANGULAR(0.18, 0.25, 0.32, "Op Margin")` |
| B4 | WACC | `=MC.NORMAL(0.10, 0.015, "WACC")` |
| B5 | Terminal Growth | `=MC.UNIFORM(0.01, 0.03, "Terminal Growth")` |
| B8 | Year 5 Revenue | `=A1*(1+B2)^5` |
| B9 | Year 5 EBIT | `=B8*B3` |
| B10 | Terminal Value | `=B9*(1+B5)/(B4-B5)` |
| B11 | PV of Terminal | `=B10/(1+B4)^5` |
| B12 | Enterprise Value | `=MC.OUTPUT(B11, "EV")` |

Click **▶ Run Simulation** in the task pane.

---

## 2. Distribution Functions

All functions live in the `MC` namespace. When **not** simulating, they return a deterministic "expected" value so your spreadsheet stays stable.

| Function | Static Return | Description |
|----------|--------------|-------------|
| `MC.PERT(min, mode, max, [name])` | `(min + 4×mode + max) / 6` | Beta-shaped distribution, good for expert estimates |
| `MC.TRIANGULAR(min, mode, max, [name])` | mode | Simple 3-point estimate |
| `MC.NORMAL(mean, stdev, [name])` | mean | Gaussian bell curve |
| `MC.UNIFORM(min, max, [name])` | `(min + max) / 2` | Equal probability across range |
| `MC.LOGNORMAL(mu, sigma, [name])` | `e^(mu + σ²/2)` | Positively skewed, always > 0 |
| `MC.OUTPUT(value, name)` | pass-through | Marks a cell as a simulation output |

> **Tip**: Always provide a descriptive `name` parameter — it appears in charts and reports.

---

## 3. Simulation Settings

| Setting | Description |
|---------|-------------|
| **Iterations** | Number of Monte Carlo trials (default 1,000). More = smoother results but slower. 5,000–10,000 is typical for production. |
| **Seed** | Controls randomness. `0` = fully random (different results each run). Any positive number = reproducible results (same seed → same output). |

---

## 4. Interpreting Results

### 4.1 Summary Header

The colored header at the top shows three key metrics:

| Metric | What it means |
|--------|---------------|
| **Mean** | Average outcome across all iterations. Your "expected" enterprise value. |
| **Std Dev** | How spread out results are. Higher = more uncertainty in your valuation. |
| **P(X < 0)** | Percentage of iterations where the output was **negative**. This is NOT related to the seed setting — it measures downside risk. |

**Example**: Mean = 3.14M, Std Dev = 1.09M, P(X < 0) = 0.0%
→ "The expected EV is $3.14M with $1.09M uncertainty. No scenario produced a negative EV."

> **When P(X < 0) matters**: For NPV analysis of risky projects, P(X < 0) tells you the probability the project destroys value. A P(X < 0) of 15% means 15% of scenarios show the project is not worth doing.

### 4.2 Histogram

The bar chart shows the **frequency distribution** of outcomes:
- **X-axis**: Output values (e.g. Enterprise Value in millions)
- **Y-axis**: Percentage of iterations that fell in each bin
- **Dashed orange lines**: 5th, 50th (median), and 95th percentiles

**How to read it**:
- The **tallest bars** show the most likely outcomes
- A **right-skewed** shape (long tail to the right) is typical for DCF models — upside scenarios can be very large
- The **5th–95th percentile range** gives you a 90% confidence interval

**Example**: If the 5th percentile = $1.83M and 95th = $5.08M, you can say: *"There's a 90% probability the EV falls between $1.83M and $5.08M."*

### 4.3 Cumulative Distribution (CDF)

The S-curve shows the **probability of the output being ≤ a given value**:
- **X-axis**: Output values
- **Y-axis**: Cumulative probability (0% to 100%)
- **Orange dots**: 5th, 50th, 95th percentile markers

**How to read it**:
- Find a value on the X-axis → read up to the curve → the Y-axis tells you the probability of being at or below that value
- The **steeper** the curve, the more **concentrated** (certain) the outcomes
- A **flat, gradual** curve means high uncertainty

**Example**: If the curve hits 50% at $2.93M → *"There's a 50/50 chance the EV is above or below $2.93M."*

### 4.4 Statistics Table

| Statistic | Meaning |
|-----------|---------|
| **Iterations** | Total trials run |
| **Minimum** | Worst-case scenario observed |
| **Maximum** | Best-case scenario observed |
| **Mean** | Average outcome |
| **Median** | Middle value (50th percentile) — more robust than mean for skewed data |
| **Mode** | Most frequently occurring value |
| **Std Deviation** | Spread of outcomes. ~68% of results fall within ±1 std dev of the mean |
| **Skewness** | Shape asymmetry. >0 = right-skewed (long right tail), <0 = left-skewed |
| **Kurtosis** | Tail heaviness. >3 = fat tails (extreme outcomes more likely than normal) |
| **P5 / P25 / P75 / P95** | Percentiles for building confidence intervals |

### 4.5 Sensitivity Analysis (Tornado Chart)

The tornado chart answers: **"Which inputs matter most?"**

- Bars are sorted by impact (largest at top)
- **Bar length** = Standardized Regression Coefficient (SRC), showing how much each input drives output variation
- **Blue bars (positive SRC)**: Higher input → higher output
- **Red bars (negative SRC)**: Higher input → lower output (e.g. higher WACC → lower EV)

**How to read the values**:
- SRC of **0.82** for WACC means WACC explains roughly 82% of the output's variation
- SRC of **0.27** for Revenue Growth means it contributes ~27%
- The **sign** tells you the direction: negative means inverse relationship

**Practical use**: Focus your research and negotiation on the inputs with the longest bars — those are where uncertainty matters most.

### 4.6 Regression Coefficients Table

| Column | Meaning |
|--------|---------|
| **SRC** | Standardized Regression Coefficient — linear correlation strength |
| **Rank ρ** | Spearman rank correlation — captures non-linear relationships too |

If SRC and Rank ρ differ significantly, the relationship is non-linear.

---

## 5. Export

The **Export** tab writes all simulation results to a new worksheet in your workbook:
- Raw iteration data (all input samples + output values)
- Summary statistics
- Useful for further analysis in Excel or importing into other tools

---

## 6. Tips & Best Practices

1. **Start with 1,000 iterations** for quick testing, then increase to 5,000–10,000 for final analysis
2. **Use a seed** (e.g. 42) when presenting results — it makes them reproducible
3. **Name all your inputs** — unnamed inputs show as cryptic IDs in charts
4. **Check P(X < 0)** for any go/no-go investment decision
5. **Focus on median** over mean for skewed distributions — it's more representative
6. **Use the tornado chart** to identify which assumptions need the most research
