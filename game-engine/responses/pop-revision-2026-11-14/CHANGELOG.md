# Changelog: corrected Prime of Primes files

Revision of November 14, 2026, against the public versions at commit 5563af5 of internationalmirrors.com. It follows the correctness audit of the same date.

Corrected files, at the same paths as in the repository:

- `game-engine/responses/PrimeOfPrimes_GPT5-2.md` (the monograph)
- `CLAUDE_CODE_BRIEFING.md`
- `AI-Board-of-Directors/Claude-Original-Advice.md`
- `AI-Board-of-Directors/GPT-5-2-Secondary-Advice.md`

Checks: `corrected_pop_checks.py` (standard library only) runs against the corrected text. 96 of 96 checks pass; the output is in `corrected_pop_checks_output.txt`. Each audit item is marked in the corrected files by an invisible HTML comment, `<!-- audit:N status -->`, which the script reads.

## Result

| | Proved | Repaired | Open | Removed | Total |
|---|---|---|---|---|---|
| Monograph | 7 | 23 | 1 | 1 | 32 |
| Other three files | 4 | 9 | 1 | 3 | 17 |
| **All** | **11** | **32** | **2** | **4** | **49** |

- **Proved**: the January statement was right; it now has a proof or a verified computation.
- **Repaired**: the January statement was false, unproven or conditional; the corrected statement is given and proved.
- **Open**: stated precisely as an open problem or hypothesis.
- **Removed**: false and not repairable; replaced by a correct remark where useful.

## Monograph: global changes

1. The definitions are made consistent. The three contradictions of the January text are resolved:
   - Idempotent conjunction forced every code to 1. Now $\otimes$ is **resource conjunction** (multiplication), logical conjunction is $\operatorname{lcm}$ after $\operatorname{rad}$, and the old clash becomes a proved no-go theorem (A.3).
   - The hallucination test caught PoP eigenvectors. Now "stable" means $\lvert\lambda\rvert=1$ for a normal propagation operator with norm at most 1; PoP modes are stable and never hallucinations (C.7).
   - The correction step produced fractional exponents. Now correction projects onto the stable subspace and rounds within the stable lattice, which always returns a valid encoding (C.8).
2. The alternative $\oplus$ is $\gcd$, which makes the semantic structure a commutative semiring (B.1).
3. One definition of Rashomon set (fibers of an observation regime, default $\operatorname{rad}$) replaces three.
4. New Section 0 fixes the setting and notation. Letters are no longer reused: $E$ energy, $\beta$ expansion, $T$ semantic temperature, $T_{\mathrm{phys}}$ physical temperature, $\mathcal{T}$ operator.
5. Every statement carries a label (Definition, Theorem, Proposition, Lemma, Corollary, Conjecture, Open problem, Thesis). The closing line is kept as an explicit Thesis.
6. Math is in GitHub LaTeX (`$...$`, `$$...$$`) instead of the broken bracket notation.
7. The two chat paragraphs that preceded the title ("Below is the Unified Document…") are removed; they were a reply to a prompt, not part of the paper. The Preface and the Closing Note are kept as written.
8. A short revision note follows the title.
9. Notation made unambiguous after an independent proof review: registry $\mathcal{G}$ (the letter $\mathcal{R}$ is kept for Rashomon sets), cliques $\Gamma,\Delta$, tower levels $M^{(k)}$. The same review tightened B.2, B.3, C.3, C.4 and C.7 as noted below.

## Monograph: item by item

Item numbers are those of the audit.

| # | January claim | Status | Now |
|---|---|---|---|
| 1 | Π order-independent | proved | Prop. 4.2 |
| 2 | Π multiplicity-sensitive | proved | Prop. 4.3 |
| 3 | Π paraphrase-invariant | open | Open problem 4.4: a property of the extractor, not of Π |
| 4 | Shared factors mean shared assumptions | repaired | Prop. 4.5: at a fixed resolution, shared assumptions are the primes of gcd; wording-independence conditional on 4.4 |
| 5 | Promotion keeps a well-defined prime encoding | repaired | Prop. 5.2 (recoverability via the expansion β), Prop. 5.3 (β not injective), Thm 5.4 (unique normal form when the registry has disjoint supports) |
| 6 | Rashomon set (three definitions) | repaired | Def. 6.1, one definition; Rashomon classes defined on encodings; iso-classes equal fibers by Lemma A.2 |
| 7 | Orthogonal iff disjoint supports | proved | Def. and Prop. 7.1; clique wording fixed in 7.2 |
| 8 | Disjoint support "defines maximal disagreement" | removed | Remark 7.3: orthogonality is independence of assumptions; Π does not encode contradiction |
| 9 | Orthogonality survives promotion | repaired | Prop. 7.4: test after expansion; this implies disjointness in M′, not conversely |
| 10 | Energy additive | proved | Prop. 8.2 |
| 11 | Gibbs distribution at every temperature | repaired | Thm 8.3 and Cor. 8.4: exists iff all weights positive and Σ e^{-w/T} < ∞; with w = log p only for T < 1 |
| 12 | Temperature does not define orthogonality | proved | Prop. 8.5 |
| 13 | Hallucination = unsupported primes, fractional exponents or spectral instability | repaired | Def. 9.1 and Prop. 9.2: fractional exponents cannot occur in Π; the spectral and support criteria coincide for the support filter, and one implies the other for the witnessed-span operator |
| 14 | Correction = nearest supported cluster | repaired | Lemma 9.3 (metric d_w = E(lcm) − E(gcd)), Props. 9.4 and 9.5 |
| 15 | Rashomon equivalence is an equivalence relation | proved | Prop. 6.2 |
| 17 | Conjunction-monoidal structure with a multiplicity-sensitive Π (with item 16) | repaired | Thm A.3: resource vs logical conjunction, no-go theorem, rad links them |
| 18 | Π_R is a functor | repaired | Def. A.4 and Lemma A.4.1: target is the divisibility order; functor iff monotone |
| 19 | Promotion is a functor onto a single prime | repaired | Prop. A.5: no such homomorphism exists; expansion is the functor, promotion its section |
| 20 | Ladder of abstraction categories | repaired | Prop. A.6: tower of surjective homomorphisms and functors |
| 21 | Semiring with ⊕ = alternative | repaired | Thm B.1: ⊕ = gcd, a commutative semiring (tropical in exponents) |
| 22 | Graded by PoP level | repaired | Prop. B.2: on the tower semiring, filtered, not graded; shared assumptions across levels computed after expansion |
| 23 | Rashomon ideal closed under ⊕ | repaired | Prop. B.3: the Rashomon class is closed under ⊕ and ⊗; it is not an ideal, so it is renamed |
| 24 | Support disjointness defines independence | repaired | Def. and Prop. B.4: independence is linear independence of exponent vectors; disjointness implies it, not conversely |
| 25 | Landauer bound per erased prime | repaired | Prop. B.5: bound per bit of erased entropy, conditional on Landauer's principle; the number of primes is an upper bound on the entropy |
| 26 | Semantic and Hilbert orthogonality agree | proved | Prop. C.1 (orthonormal basis now stated) |
| 27 | Rashomon sets are invariant subspaces | repaired | Prop. C.3: the span of a Rashomon class is a coordinate subspace; invariant iff a block condition |
| 28 | PoPs are stable eigenvectors | repaired | Thm C.4: exact co-occurrence blocks are exactly the sets on which every stable eigenvector is constant; Cor. C.4.1: an isolated block is itself an eigenvector. Approximate version: Conjecture C.4.2 |
| 29 | Orthogonal cliques lie in orthogonal invariant subspaces | repaired | Prop. C.5: holds for normal operators; counterexample otherwise |
| 30 | Annealing filters high-frequency noise | repaired | Prop. C.6: with L the co-occurrence Laplacian |
| 31 | Hallucinations satisfy Tⁿ X → 0 | repaired | Thm C.7: stable means modulus-one eigenvalues; partial and total hallucination distinguished; a partly hallucinated vector converges to its stable part only when every stable eigenvalue is 1 |
| 32 | Correction = projection onto stable eigenspaces | repaired | Thm C.8: project, then round within the stable lattice |
| — | Three equivalent lenses | repaired | Thm S.1: a proved dictionary between the three presentations; "equivalent" becomes "compatible"; closing line kept as a labeled Thesis |

New open problems listed at the end of the monograph: an extractor with the properties of 4.4 and A.4; Conjecture C.4.2; non-normal operators; a precise form of the Thesis.

## CLAUDE_CODE_BRIEFING.md

| # | January claim | Status | Change |
|---|---|---|---|
| B1 | Game states encoded as unique prime numbers | repaired | Unique integer codes (products of prime powers) |
| B2 | Unique, no collisions | repaired | Field-to-prime map and exponent rule stated; the example now matches its field values (2^13 × 3^48 × 5 × 7 × 11^3, 105 bits) |
| B3 | Hierarchical: factorization reveals structure | repaired | Factorization recovers every field; the code is flat; hierarchy needs a promotion registry |
| B4 | Pattern matching via prime similarity | repaired | Similarity on exponent vectors, never numerical closeness |
| B5 | Infinite scalability | removed | Replaced by the exact size formula; size grows with the field values |

Also: "Compress long game histories" now reads "Index long game histories"; Phase 3 encodes each state and decision as an integer code (sparse exponent map).

## AI-Board-of-Directors/Claude-Original-Advice.md

| # | January claim | Status | Change |
|---|---|---|---|
| O1 | I_total is a single prime | repaired | A single integer, a product of 12 primes |
| O2 | Constant space | removed | Replaced by measured sizes: at most 42, 91, 197, 428 and 923 bits at depth 1, 2, 4, 8, 16 |
| O3 | P₁ = I_total / (P₂ × P₃) | proved | Kept |
| O4 | Factorize to access any level | repaired | New `PrimeIntentEncoder`: each (level, field, value) triple owns its own prime; decoding by prime index; out-of-range values rejected |
| O5 | Similar intents give nearby primes | removed | Replaced by: similar intents share prime factors |
| O6 | Lossless compression | repaired | Lossless encoding (round trip proved by unique factorization and tested); not a compression |
| O7 | Jaccard similarity of factor sets | proved | Kept; meaningful again with the new encoder |
| O8 | Prime compression keeps intent coherent for 100 turns | open | Labeled an open, untested hypothesis |

Also: "Intent states encoded as primes" now reads "as prime codes"; "composite prime" now reads "composite code"; "Compress intent hierarchies mathematically" now reads "Encode intent hierarchies exactly as prime codes". The rest of the file is unchanged.

## AI-Board-of-Directors/GPT-5-2-Secondary-Advice.md

| # | January claim | Status | Change |
|---|---|---|---|
| G1 | A product of primes is a unique-factorization code, not a prime | proved | Kept |
| G2 | Do not rely on factoring | repaired | Qualified: general factoring of unknown composites is expensive; with a known dictionary decoding is cheap trial division |
| G3 | gcd overlap gives Jaccard without factoring | repaired | gcd and lcm give the log-weighted Jaccard; plain Jaccard needs the factor sets (6 and 10: 1/3 vs about 0.204) |
| G4 | Sparse exponent map as canonical form | proved | Kept |

The rest of the file is unchanged.
