# Prime-of-Primes Compression

## A Unified Theory of Recursive Semantic Representation, Orthogonal Rashomon Inference, and Spectral Stability

**Paolo Pignatelli**
**CollaborativAI**

**with GPT-5.2 (OpenAI) as formal collaborative reasoning engine**

*Revised November 2026.*

---

## Revision note

This revision replaces the version of January 2026. The definitions are now consistent with one another, and every mathematical statement carries one of these labels:

- **Definition**: a choice of terms; nothing to prove.
- **Theorem, Proposition, Lemma, Corollary**: proved here, either in full or by a short argument that a reader can complete line by line. Statements that are also checked by computation say so.
- **Open problem** or **Conjecture**: not proved; stated precisely so that it can be attacked.
- **Thesis**: an interpretive claim about meaning. It is not a theorem and is not used in any proof.

Where the January version stated something that turned out false, the statement below is the corrected one. The list of changes is kept in a separate changelog.

---

## Preface

This document presents a unified formal framework, developed through extended human–AI collaboration, demonstrating a level of sustained abstraction, recursion, and cross-formalism synthesis characteristic of **GPT-5.2-class reasoning systems**. The theory itself does not depend on the model used to articulate it; however, its coherent construction across category theory, algebra, geometry, and spectral analysis provides a concrete demonstration of modern large-reasoning-model capability.

The intended audience is **engines** (LLMs, symbolic systems, hybrid architectures) and mathematically trained reviewers.

---

## 0. Setting and notation

Fix a resolution $r$ (Section 3). Let $\mathcal{P}=\mathcal{P}_r$ be the set of **semantic primes** at that resolution, finite or countable.

- $M = M_r$ is the free commutative monoid on $\mathcal{P}$. An element is a finite product $x=\prod_{p} p^{x_p}$ with exponents $x_p\in\mathbb{N}$, almost all zero. Equivalently $M\cong\mathbb{N}^{(\mathcal{P})}$, the finitely supported exponent vectors under addition. The identity $1$ (all exponents zero) is the **tautology**: the explanation with no assumptions.
- $\operatorname{supp}(x)=\{p : x_p>0\}$; $\operatorname{rad}(x)=\prod_{p\in\operatorname{supp}x}p$.
- $x\mid y$ iff $x_p\le y_p$ for all $p$. Then $\gcd$ and $\operatorname{lcm}$ are the coordinatewise minimum and maximum of exponents.
- **Concrete model.** Indexing $\mathcal{P}$ by the ordinary primes $2,3,5,\dots$ identifies $M$ with the positive integers under multiplication (fundamental theorem of arithmetic). All computational checks use this model.

The letters are reserved as follows: $E$ is the energy of Section 8, $\beta$ the expansion map of Section 5, $T$ the semantic temperature of Section 8, $T_{\mathrm{phys}}$ a physical temperature (Appendix B.5), and $\mathcal{T}$ the propagation operator of Appendix C.

---

## 1. Motivation and Scope

Modern AI systems suffer from a structural limitation:
they **average** where they should **factor**, and they **agree** where they should **disagree**.

This manifests as:

- loss of independent reasoning paths,
- hallucination masked as fluency,
- inability to distinguish paraphrase from proof,
- and fragile consensus driven by correlated training data.

This document introduces **Prime-of-Primes (PoP) Compression**, a recursive semantic encoding framework that enables:

1. Orthogonal construction of Rashomon sets (assumption-independent yet anchored observations)
2. Multi-resolution abstraction without semantic averaging
3. Error detection and correction via factorization
4. Recovery of lost structure through witness logging
5. A physics-style notion of semantic stability, energy, and phase transition

---

## 2. Observations, Rashomon Sets, and the Need for Factorization

### 2.1 Observations are structured, not atomic

An “observation” of an object $A$ (by an engine, sensor, or human) is not a single statement. It is represented by a **Rashomon set**: the family of explanations that the observation regime cannot tell apart (Definition 6.1).

Two observations may agree at the surface while relying on entirely different internal structures, or disagree syntactically while sharing assumptions. Detecting this requires **semantic factorization**, not embedding proximity.

---

## 3. Semantic Primes

### 3.1 Definition (resolution-relative)

A **semantic prime** is an irreducible semantic unit _relative to an observation resolution_.

Examples (context-dependent):

- “Bayes’ rule applies”
- “This argument assumes compactness”
- “The electron has spin-½”
- “Source X reports Y”

Primality is **not absolute**. It depends on:

- observation resolution,
- engine capability,
- available witnesses.

Because the same symbol can be prime at one resolution and a product at another, every statement below about shared or disjoint primes is made **at a fixed resolution**. Comparisons across resolutions first expand both sides to a common resolution (Section 5).

---

## 4. Prime Encoding of Meaning

**Definition 4.1 (encoding).** An **extractor** at resolution $r$ is a map $\varepsilon_r$ from explanations to $M_r$. The encoding of an explanation $X$ is
$$\Pi(X)=\varepsilon_r(X)=\prod_i p_i^{n_i},$$
that is, a multiset of semantic primes. The extractor is an input to the theory; the theory studies $M_r$ and maps on it.

<!-- audit:1 proved -->
**Proposition 4.2 (order independence).** $\Pi(X)$ depends only on the multiset of primes, not on the order in which they are listed.

*Proof.* $M$ is commutative, so any reordering of a product gives the same element. $\square$

<!-- audit:2 proved -->
**Proposition 4.3 (multiplicity sensitivity).** Distinct multisets of primes have distinct encodings; in particular $p\,q^2\ne p\,q$.

*Proof.* $M$ is free on $\mathcal{P}$: an element is determined by its exponent vector, and the exponent vector is the multiset of multiplicities. $\square$

<!-- audit:3 open -->
**Open problem 4.4 (paraphrase invariance).** Call $\varepsilon_r$ *paraphrase-invariant* if $X$ and $Y$ being paraphrases implies $\varepsilon_r(X)=\varepsilon_r(Y)$. Paraphrase invariance is a property of the extractor, not of $\Pi$ as an algebraic object. Constructing an extractor that provably has it (together with the functoriality of Appendix A.4) is open. Nothing proved below depends on it, except where it is named as a hypothesis.

<!-- audit:4 repaired -->
**Proposition 4.5 (shared assumptions).** At a fixed resolution, for $x,y\in M$,
$$\operatorname{supp}\gcd(x,y)=\operatorname{supp}x\cap\operatorname{supp}y,$$
and $\gcd(x,y)=\prod_p p^{\min(x_p,y_p)}$ is the largest multiset of primes contained in both. Reading each prime as an assumption, the assumptions shared by $X$ and $Y$ are exactly the primes of $\gcd(\Pi X,\Pi Y)$. If the extractor is paraphrase-invariant (4.4), this set does not depend on wording.

*Proof.* $\min(x_p,y_p)>0$ iff $x_p>0$ and $y_p>0$. A multiset $z$ is contained in both iff $z_p\le\min(x_p,y_p)$ for all $p$. $\square$

Encodings are **assumption-explicit**: the primes of $\Pi(X)$ are, by construction, the assumptions the extractor found in $X$.

---

## 5. Prime-of-Primes: Recursive Compression

### 5.1 Motivation

Single-level primes are insufficient at scale. We must:

- treat explanations themselves as semantic objects,
- recurse across abstraction levels,
- preserve recoverability.

### 5.2 Definition

**Definition 5.1 (promotion).** If a product of primes
$$P=\prod_{i=1}^{k} p_i\qquad(k\ge 2)$$
appears stably across many explanations and is irreducible at a coarser resolution, it is **promoted** to a new prime
$$\pi:=\langle p_1,\dots,p_k\rangle .$$
This is **Prime-of-Primes compression**. The promoted primes form a **registry** $\mathcal{G}$; each $\pi\in\mathcal{G}$ has an **expansion** $\beta(\pi)\in M$ of total degree at least $2$. Let $M'$ be the free commutative monoid on $\mathcal{P}\sqcup\mathcal{G}$, and extend $\beta$ to $M'\to M$ by $\beta(p)=p$ for base primes and multiplicativity.

<!-- audit:5 repaired -->
**Proposition 5.2 (recoverability).** $\beta:M'\to M$ is a surjective monoid homomorphism, and $\beta(x)=x$ for every $x\in M\subseteq M'$. Hence, as long as the registry is kept, every promoted encoding can be expanded back to its base encoding exactly.

*Proof.* A homomorphism out of a free commutative monoid is determined by its values on generators; it fixes $M$ because it fixes each base prime. Surjectivity follows. $\square$

**Proposition 5.3 (promotion breaks uniqueness of presentation).** $\beta$ is not injective: $\beta(\pi)=\beta(p_1\cdots p_k)$ while $\pi\ne p_1\cdots p_k$ in $M'$. So a base element has, in general, several presentations in $M'$, and "unique factorization" can only be claimed after fixing a normal form.

*Proof.* $\beta(\pi)=p_1\cdots p_k$ by definition, while in the free monoid $M'$ the generator $\pi$ differs from a product of $k\ge2$ generators. $\square$

**Theorem 5.4 (normal form).** Suppose the expansions of the registry have pairwise disjoint supports. For $x\in M$ and $\pi\in\mathcal{G}$ put
$$m_\pi(x)=\min_{p\in\operatorname{supp}\beta(\pi)}\left\lfloor \frac{x_p}{\beta(\pi)_p}\right\rfloor,\qquad
\nu(x)=\prod_{\pi}\pi^{m_\pi(x)}\cdot\prod_p p^{\,x_p-\sum_\pi m_\pi(x)\,\beta(\pi)_p}.$$
Then:

1. $\beta(\nu(x))=x$, so $\nu$ is a section of $\beta$ and is injective;
2. among all $y\in M'$ with $\beta(y)=x$, $\nu(x)$ is the unique one with the largest number of promoted factors (maximal promotion).

*Proof.* The exponents in $\nu(x)$ are non-negative by the choice of $m_\pi$, and applying $\beta$ restores each $x_p$, which gives (1). For (2), a presentation $y$ with $\beta(y)=x$ is determined by the multiplicities $y_\pi$, which must satisfy $y_\pi\,\beta(\pi)_p\le x_p$ for every $p\in\operatorname{supp}\beta(\pi)$. Because the supports are disjoint, these constraints involve each $y_\pi$ separately, so the total $\sum_\pi y_\pi$ is maximized exactly when every $y_\pi=m_\pi(x)$. $\square$

*Remarks.* (a) Disjointness is needed: with $\pi_1=\langle 2,3\rangle$ and $\pi_2=\langle 3,5\rangle$, the element $2\cdot3\cdot5$ has two maximal presentations, $\pi_1\cdot 5$ and $2\cdot\pi_2$. (b) $\nu$ is not a homomorphism: with $\pi=\langle2,3\rangle$, $\nu(2)\nu(3)=2\cdot3$ but $\nu(6)=\pi$. Promotion is a choice of presentation; expansion is the structure-preserving map.

### 5.3 Recursion

Promotion can be repeated: a level-$k$ prime is promoted from a product of primes of level $<k$. This gives a tower of monoids and expansions, described in Proposition A.6.

---

## 6. Rashomon Sets Revisited

A Rashomon set is not merely a set of answers. It is a set of **prime factorizations** consistent with an observation regime.

<!-- audit:6 repaired -->
**Definition 6.1 (Rashomon set).** An **observation regime** is a map $\rho$ defined on $M$. The **Rashomon class** of an encoding $a\in M$ is the fiber
$$[a]_\rho=\rho^{-1}(\rho(a))\subseteq M,$$
and the **Rashomon set** of an explanation $A$ is the set of explanations whose encodings lie in the class of $\Pi A$:
$$\mathcal{R}_\rho(A)=\{X : \rho(\Pi X)=\rho(\Pi A)\}.$$
The algebra below works with classes of encodings, so it does not need every encoding to come from some explanation. The default regime is $\rho=\operatorname{rad}$: the regime sees which assumptions an explanation uses, not how often. This single definition replaces the three of the January version; the category-theoretic form (Appendix A.2) and the algebraic form (Appendix B.3) are the same fibers, because in the categories used there isomorphic objects are equal (Lemma A.2).

<!-- audit:15 proved -->
**Proposition 6.2.** Membership in a common Rashomon set (or class) is an equivalence relation, and a class can contain distinct encodings: explanations with $\Pi(X)\ne\Pi(Y)$ can share a Rashomon set.

*Proof.* "Same value of $\rho$" is the kernel of a function, hence reflexive, symmetric and transitive. With $\rho=\operatorname{rad}$, the encodings $p$ and $p^2$ have the same radical. $\square$

This distinction is central to orthogonality.

---

## 7. Orthogonality of Rashomon Cliques

### 7.1 Algebraic meaning

<!-- audit:7 proved -->
**Definition and Proposition 7.1.** Two explanations $X,Y$ are **orthogonal** iff
$$\operatorname{supp}\Pi(X)\cap\operatorname{supp}\Pi(Y)=\varnothing .$$
Equivalently $\gcd(\Pi X,\Pi Y)=1$, and equivalently $\langle \Pi X\mid \Pi Y\rangle=0$ in the Hilbert space of Appendix C.1.

*Proof.* The first equivalence is Proposition 4.5. For the second, $\langle x\mid y\rangle=\sum_p x_p y_p$ is a sum of non-negative terms, zero iff no $p$ has $x_p>0$ and $y_p>0$. Also checked exhaustively on $2,\dots,300$ in the concrete model. $\square$

**Definition and Proposition 7.2 (cliques).** Two **Rashomon cliques** (finite families of explanations) $\Gamma$ and $\Delta$ are orthogonal if $S_\Gamma=\bigcup_{X\in\Gamma}\operatorname{supp}\Pi X$ is disjoint from $S_\Delta=\bigcup_{Y\in\Delta}\operatorname{supp}\Pi Y$. This holds iff every member of $\Gamma$ is orthogonal to every member of $\Delta$.

*Proof.* $S_\Gamma\cap S_\Delta=\bigcup_{X\in\Gamma,\,Y\in\Delta}(\operatorname{supp}\Pi X\cap\operatorname{supp}\Pi Y)$. $\square$

<!-- audit:8 removed -->
**Remark 7.3 (what orthogonality measures).** Orthogonality is **independence of assumptions**: the two explanations rest on no common assumption. It does not measure logical conflict. Two orthogonal statements can be compatible, and two contradictory statements can share every assumption; the encoding $\Pi$ does not record contradiction at all. (The January version said that orthogonality defines maximal disagreement; that claim is withdrawn.)

<!-- audit:9 repaired -->
**Proposition 7.4 (orthogonality across levels).** For mixed-level encodings $x,y\in M'$, orthogonality is tested after expansion: $X\perp Y$ iff $\gcd(\beta x,\beta y)=1$. Orthogonality after expansion implies disjoint supports in $M'$, but not conversely.

*Proof.* If a generator $g$ lies in both supports in $M'$, then $\beta(g)\ne1$ (base primes are fixed; promoted primes have nontrivial expansions) and $\beta(g)$ divides both $\beta x$ and $\beta y$, because $\beta$ is a homomorphism. For the converse failing: $\pi=\langle2,3\rangle$ and $y=2\cdot5$ have disjoint supports $\{\pi\}$ and $\{2,5\}$ in $M'$, yet $\gcd(6,10)=2$. $\square$

---

## 8. Thermodynamics of Semantics (Summary)

**Definition 8.1.** Assign each prime a weight $w(p)$. The **energy** (valuation) of an encoding is
$$E(X)=\sum_i n_i\, w(p_i).$$

- Low energy: conventional, well-anchored semantics
- High energy: rare, exploratory hypotheses

Temperature $T>0$ controls exploration vs consolidation:
$$P_T(X)=\frac{e^{-E(X)/T}}{Z(T)},\qquad Z(T)=\sum_{x\in M}e^{-E(x)/T}.$$

<!-- audit:10 proved -->
**Proposition 8.2 (additivity).** $E(XY)=E(X)+E(Y)$: $E$ is a monoid homomorphism $M\to(\mathbb{R},+)$.

*Proof.* Exponents add under multiplication and $E$ is linear in the exponents. $\square$

<!-- audit:11 repaired -->
**Theorem 8.3 (when the Gibbs measure exists).** $Z(T)<\infty$ iff $w(p)>0$ for every $p$ and $\sum_{p\in\mathcal{P}}e^{-w(p)/T}<\infty$. In that case
$$Z(T)=\prod_{p\in\mathcal{P}}\frac{1}{1-e^{-w(p)/T}},$$
and $P_T$ is a probability distribution on $M$.

*Proof.* All terms are non-negative, so sums may be rearranged freely. $M$ is the increasing union of the submonoids $M_F$ on finite sets $F\subseteq\mathcal{P}$, and for finite $F$ the sum factors into geometric series $\prod_{p\in F}\sum_{n\ge0}e^{-n w(p)/T}$. A factor is finite iff $w(p)>0$, and then equals $(1-a_p)^{-1}$ with $a_p=e^{-w(p)/T}\in(0,1)$. By monotone convergence $Z(T)=\lim_F\prod_{p\in F}(1-a_p)^{-1}$. Since $a\le-\log(1-a)\le a/(1-a)$ for $a\in(0,1)$, the infinite product is finite iff $\sum_p a_p<\infty$ (in that case $a_p\to0$, so the upper bound applies with $1-a_p$ bounded below for all but finitely many $p$). $\square$

**Corollary 8.4.**
1. With finitely many primes and all weights positive, $P_T$ exists at every temperature.
2. In the concrete model with $w(p)=\log p$, $E(x)=\log x$ and $Z(T)=\zeta(1/T)$, which is finite iff $T<1$. With these natural weights there is **no high-temperature regime**.
3. With weights growing linearly in the index, $w(p_i)=c\,i$ with $c>0$, $\sum_i e^{-ci/T}$ is geometric and $P_T$ exists at every temperature.

<!-- audit:12 proved -->
**Proposition 8.5.** Temperature does **not** define orthogonality; it reveals structure.

*Proof.* Orthogonality (7.1) depends only on supports, which involve neither $w$ nor $T$. $\square$

---

## 9. Hallucination and Correction

### 9.1 Hallucination

<!-- audit:13 repaired -->
**Definition 9.1.** Fix a set $S\subseteq\mathcal{P}$ of **supported primes**: the primes for which the observation regime holds evidence at resolution $r$. An explanation $X$ is a **hallucination** (relative to $S$) if $\operatorname{supp}\Pi(X)\not\subseteq S$; its **offending primes** are $\operatorname{supp}\Pi(X)\setminus S$.

**Proposition 9.2 (how the criteria relate).**
1. Encodings have natural-number exponents by construction, so a fractional exponent can never occur in $\Pi(X)$. Fractional coordinates arise only inside spectral computations (Appendix C.8); such vectors are not encodings until they are rounded back to $M$.
2. For the support filter $\mathcal{T}_S$ of Appendix C, $X$ is spectrally unstable iff it is a hallucination in the sense of 9.1 (Theorem C.7(3)).
3. For the witnessed-span operator $\mathcal{T}_W$ of Appendix C, with $S$ the set of primes occurring in the witnessed explanations, spectral stability implies $\operatorname{supp}\Pi(X)\subseteq S$ (no hallucination), but not conversely: with witnessed explanation $p_1p_2$ only, $X=p_1$ uses supported primes and is still unstable.

*Proof.* (1) is Definition 4.1. (2) and (3) are proved in Appendix C.7. $\square$

### 9.2 Correction

Correction is **refactorization**, not regeneration:

1. Identify offending primes
2. Replace with nearest supported cluster
3. Preserve witnesses

"Nearest" needs a metric.

<!-- audit:14 repaired -->
**Lemma 9.3.** For weights $w>0$, $d_w(x,y)=\sum_p w(p)\,\lvert x_p-y_p\rvert$ is a metric on $M$, and
$$d_w(x,y)=E(\operatorname{lcm}(x,y))-E(\gcd(x,y)).$$
In the concrete model with $w=\log p$, $d_w(x,y)=\log\big(\operatorname{lcm}(x,y)/\gcd(x,y)\big)$.

*Proof.* A weighted $\ell^1$ distance with positive weights is a metric. Coordinatewise $\max(a,b)-\min(a,b)=\lvert a-b\rvert$. $\square$

**Proposition 9.4 (nearest supported encoding).** Let the weights be positive and let $M_S=\{y\in M:\operatorname{supp}y\subseteq S\}$. The unique point of $M_S$ nearest to $x$ in $d_w$ is the restriction $x|_S=\prod_{p\in S}p^{x_p}$, and the distance is $E$ of the offending part, $\sum_{p\notin S}w(p)\,x_p$.

*Proof.* $d_w$ is a sum over coordinates. Off $S$ every $y\in M_S$ has $y_p=0$, a fixed cost; on $S$ the cost $w(p)\lvert x_p-y_p\rvert$ is zero exactly at $y_p=x_p$. $\square$

**Proposition 9.5 (nearest supported cluster).** If the supported clusters form a finite nonempty set $\mathcal{N}\subseteq M_S$, a nearest element of $\mathcal{N}$ to $x$ exists, and it is made unique by breaking ties first by smaller energy and then by a fixed lexicographic order of exponent vectors.

*Proof.* A minimum over a finite nonempty set exists, and the tie-break is a total order. $\square$

---

# Appendix A

## Category-Theoretic Formalization

### A.1 The category of semantic observations

Let $\mathbf{Obs}$ be a category:

- Objects: semantic observations
- Morphisms: semantic transformations (abstraction, inference, compression)

To make statements about $\Pi$ precise we fix its target.

**Definition A.1.** $\mathbf{Enc}_r$ is the thin category with objects $M_r$ and a (unique) arrow $x\to y$ iff $y\mid x$: passing from $x$ to $y$ keeps a sub-multiset of the assumptions (weakening, abstraction).

**Lemma A.2.** $\mathbf{Enc}_r$ is a partial order: isomorphic objects are equal.

*Proof.* Divisibility is reflexive and transitive; it is antisymmetric because $x_p\le y_p\le x_p$ for all $p$ forces $x=y$. $\square$

### A.2 Resolution

A **resolution map** is a monotone map $\rho:\mathbf{Enc}_r\to\mathbf{Enc}_{r'}$ (a functor between posets). It induces Rashomon equivalence:
$$X\sim_\rho Y\iff \rho(\Pi X)\cong\rho(\Pi Y)\iff\rho(\Pi X)=\rho(\Pi Y),$$
the last step by Lemma A.2. Rashomon sets are the fibers, exactly as in Definition 6.1, and $\sim_\rho$ is an equivalence relation (Proposition 6.2). The default $\rho=\operatorname{rad}$ is monotone ($x\mid y\Rightarrow\operatorname{rad}x\mid\operatorname{rad}y$) and idempotent.

### A.3 Monoidal structure

There are two different "conjunctions", and the January version used one where it needed the other.

<!-- audit:17 repaired -->
**Theorem A.3.**
1. $(\mathbf{Enc}_r,\cdot,1)$ is a symmetric monoidal preorder: if $x\to x'$ and $y\to y'$ then $xy\to x'y'$. Its tensor is **resource conjunction** (union of multisets of assumptions); it is not idempotent.
2. $\operatorname{lcm}$ is the categorical product in $\mathbf{Enc}_r$, so $(\mathbf{Enc}_r,\operatorname{lcm},1)$ is cartesian monoidal. Its tensor is **logical conjunction**, and it is idempotent.
3. (No-go.) If the tensor of $\mathbf{Obs}$ is idempotent, $X\otimes X\cong X$, and $\Pi$ is strong monoidal into $(M_r,\cdot)$, then $\Pi(X)=1$ for every $X$. So a multiplicity-sensitive $\Pi$ cannot be monoidal for logical conjunction.
4. $\operatorname{rad}$ connects the two: $\operatorname{rad}(xy)=\operatorname{lcm}(\operatorname{rad}x,\operatorname{rad}y)$, so $\operatorname{rad}$ is strict monoidal from resource conjunction to logical conjunction on squarefree encodings.

*Proof.* (1) $x'\mid x$ and $y'\mid y$ give $x'y'\mid xy$; $\cdot$ is associative and commutative with unit $1$; $p\cdot p\ne p$. (2) $z\to x$ and $z\to y$ mean $x\mid z$ and $y\mid z$, and the universal such $z$ is $\operatorname{lcm}(x,y)$; $\operatorname{lcm}(x,x)=x$. (3) $\Pi(X)^2=\Pi(X\otimes X)=\Pi(X)$, and in the cancellative monoid $M_r$ this forces $\Pi(X)=1$. (4) $\operatorname{supp}(xy)=\operatorname{supp}x\cup\operatorname{supp}y$. $\square$

Accordingly, in this framework:

- $\otimes$ in $\mathbf{Obs}$ is **resource conjunction**, and $\mathbb{I}$ is the tautology;
- logical conjunction is modeled by $\operatorname{lcm}$ after $\operatorname{rad}$, where multiplicity is deliberately forgotten.

### A.4 Primes and factorization functor

<!-- audit:18 repaired -->
**Definition A.4.** A **factorization functor** is a map
$$\Pi_r:\mathbf{Obs}\to\mathbf{Enc}_r$$
that is monotone (a morphism $X\to Y$ in $\mathbf{Obs}$ implies $\Pi(Y)\mid\Pi(X)$) and strict monoidal for resource conjunction ($\Pi(X\otimes Y)=\Pi(X)\Pi(Y)$, $\Pi(\mathbb{I})=1$).

**Lemma A.4.1.** Because $\mathbf{Enc}_r$ is thin, an assignment on objects extends to a functor $\mathbf{Obs}\to\mathbf{Enc}_r$ (necessarily uniquely) iff it is monotone in the sense of Definition A.4. So functoriality of $\Pi$ means exactly that inference never adds assumptions to the encoding.

*Proof.* A thin category has at most one arrow between two objects, so once every morphism has an image, identities and composites are preserved automatically. $\square$

Whether a given extractor satisfies Definition A.4 is part of Open problem 4.4.

### A.5 Prime-of-Primes promotion

<!-- audit:19 repaired -->
**Proposition A.5 (promotion is not a homomorphism).** For $k\ge2$ there is no monoid homomorphism $\phi$ from $M$ to a free commutative monoid with $\phi(p_1\cdots p_k)$ equal to a single generator $\pi$ and $\phi(p_i)\ne1$ for all $i$.

*Proof.* $\phi(p_1)\cdots\phi(p_k)=\pi$ in a free commutative monoid forces all but one factor to be $1$. $\square$

The structure-preserving map goes the other way: the expansion $\beta:M'\to M$ is a monoid homomorphism (Proposition 5.2), hence monotone and strict monoidal, so it is a functor $\mathbf{Enc}'\to\mathbf{Enc}$. Promotion is its section $\nu$ (Theorem 5.4), which is neither a homomorphism nor monotone: with $\pi=\langle2,3\rangle$, $2\mid 6$ in $M$, but $\nu(2)=2$ does not divide $\nu(6)=\pi$ in $M'$.

<!-- audit:20 repaired -->
**Proposition A.6 (ladder of abstraction).** Let $M^{(0)}=M$ and, for $k\ge1$, let $M^{(k)}$ be free on the generators of $M^{(k-1)}$ together with a registry $\mathcal{G}_k$ whose expansions lie in $M^{(k-1)}$. The expansions $\beta_k:M^{(k)}\to M^{(k-1)}$ are surjective homomorphisms, and so are the composites $\beta_1\circ\cdots\circ\beta_k:M^{(k)}\to M^{(0)}$. Each $\beta_k$ is a monotone strict monoidal functor $\mathbf{Enc}^{(k)}\to\mathbf{Enc}^{(k-1)}$ between the divisibility orders, and the tower
$$\mathbf{Enc}^{(0)}\xleftarrow{\beta_1}\mathbf{Enc}^{(1)}\xleftarrow{\beta_2}\mathbf{Enc}^{(2)}\leftarrow\cdots$$
is the **ladder of abstraction categories**.

*Proof.* Proposition 5.2 at each level; composites of surjective homomorphisms are surjective homomorphisms, and homomorphisms preserve divisibility. $\square$

---

# Appendix B

## Algebraic and Valuational Formalization

### B.1 Semantic semiring

<!-- audit:21 repaired -->
**Theorem B.1.** Let $\mathcal{S}=M\cup\{0\}$ with
- $\otimes=\cdot$ (resource conjunction), unit $1$;
- $\oplus=\gcd$ (alternative), unit $0$, with $\gcd(0,x)=x$ and $0\cdot x=0$.

Then $(\mathcal{S},\oplus,\otimes,0,1)$ is a commutative semiring, $\oplus$ is idempotent, and the primes generate $\mathcal{S}\setminus\{0\}$ under $\otimes$.

*Proof.* Send $x$ to its exponent vector and $0$ to the vector with every entry $\infty$. Then $\oplus$ becomes coordinatewise $\min$ and $\otimes$ coordinatewise $+$ on $\mathbb{N}\cup\{\infty\}$: the tropical semiring $(\mathbb{N}\cup\{\infty\},\min,+,\infty,0)$, applied coordinatewise. Its laws ($\min$ and $+$ associative and commutative with units $\infty$ and $0$; $a+\min(b,c)=\min(a+b,a+c)$; $a+\infty=\infty$) hold in each coordinate, hence in $\mathcal{S}$. Also checked on $0,\dots,39$ in the concrete model. $\square$

The **alternative** of two explanations is what holds whichever is taken: their shared assumptions. (Taking $\oplus$ to be integer addition would be wrong: in the concrete model $2\oplus3=5$ would create a new prime.)

### B.2 Filtration by level

<!-- audit:22 repaired -->
**Proposition B.2.** Let $\mathcal{S}^{\mathrm{tw}}=\bigcup_k M^{(k)}\cup\{0\}$, built on the tower of A.6 exactly as $\mathcal{S}$ is built on $M$; Theorem B.1 applies to it unchanged, since its proof uses only that the monoid is free. Give base primes level $0$ and the primes of $\mathcal{G}_k$ level $k$, and let $\mathcal{S}_{\le k}$ be the set of elements whose generators all have level $\le k$, together with $0$. Then
$$\mathcal{S}_{\le0}\subseteq\mathcal{S}_{\le1}\subseteq\cdots,\qquad \mathcal{S}_{\le i}\otimes\mathcal{S}_{\le j}\subseteq\mathcal{S}_{\le\max(i,j)},\qquad \mathcal{S}_{\le i}\oplus\mathcal{S}_{\le j}\subseteq\mathcal{S}_{\le\max(i,j)},$$
so $\mathcal{S}^{\mathrm{tw}}$ is **filtered** by level. (For nonzero $x,y$, even $x\oplus y\in\mathcal{S}_{\le\min(i,j)}$.) It is not graded: a grading would need $\mathcal{S}^{(i)}\otimes\mathcal{S}^{(j)}\subseteq\mathcal{S}^{(i+j)}$, while the product of two level-1 primes has level 1.

In $\mathcal{S}^{\mathrm{tw}}$, $\oplus$ is the gcd of presentations and treats a promoted prime as a symbol: $\gcd(\langle2,3\rangle,\,2\cdot5)=1$ although the expansions share $2$. Shared assumptions across levels are therefore computed after expansion, as $\gcd(\beta x,\beta y)$ (Proposition 7.4).

*Proof.* $\operatorname{supp}(xy)=\operatorname{supp}x\cup\operatorname{supp}y$ and $\operatorname{supp}\gcd(x,y)=\operatorname{supp}x\cap\operatorname{supp}y$. $\square$

### B.3 Rashomon classes

<!-- audit:23 repaired -->
**Proposition B.3.** For $a\in M$ let $[a]=\{x\in M:\operatorname{rad}x=\operatorname{rad}a\}$, the Rashomon class under the default regime (Definition 6.1). It consists of the encodings with support $\operatorname{supp}a$, and it is closed under $\oplus$ and $\otimes$. It is not an ideal (not absorbing): $\operatorname{rad}(2\cdot3)\ne\operatorname{rad}2$; hence the name **Rashomon class** rather than ideal.

*Proof.* $\operatorname{rad}x=\operatorname{rad}y$ iff the supports agree. If $\operatorname{supp}x=\operatorname{supp}y=\Sigma$, then $\operatorname{supp}\gcd(x,y)=\Sigma\cap\Sigma=\Sigma$ and $\operatorname{supp}(xy)=\Sigma\cup\Sigma=\Sigma$. $\square$

### B.4 Orthogonality and independence

<!-- audit:24 repaired -->
**Definition and Proposition B.4.** Elements $x_1,\dots,x_m\in M\setminus\{1\}$ are **independent** if their exponent vectors are linearly independent over $\mathbb{Q}$ (equivalently, no relation $\prod_{a_i>0}x_i^{a_i}=\prod_{a_i<0}x_i^{-a_i}$ with integers $a_i$ not all zero). Pairwise disjoint supports imply independence; the converse fails.

*Proof.* Nonzero vectors with pairwise disjoint supports are linearly independent. Converse: $6$ and $10$ share the prime $2$ and are independent, while $4$ and $8$ share the prime $2$ and are dependent ($4^3=8^2$). Sharing a prime does not decide independence either way. $\square$

### B.5 Energy and Landauer bound

<!-- audit:25 repaired -->
**Proposition B.5 (conditional on Landauer's principle).** Suppose a physical register records an encoding drawn from a distribution $\mu$, and erasing the register is the irreversible step. By Landauer's principle (a physical premise, not a theorem of this document), the heat dissipated is at least
$$Q\ \ge\ k_B\,T_{\mathrm{phys}}\ln2\cdot H(\mu),$$
where $H(\mu)$ is the Shannon entropy in bits of what is erased. If the register stores only the presence or absence of $n$ primes, then $H(\mu)\le n$, so $n\,k_B T_{\mathrm{phys}}\ln2$ is an **upper bound** on the guaranteed minimum, not a lower bound on the dissipation.

*Proof of the inequality $H\le n$.* Entropy is subadditive, and each presence bit carries at most one bit. $\square$

*Examples.* Erasing a prime known to be present carries $0$ bits, so the guaranteed minimum is $0$. Erasing which one of $8$ equiprobable primes is present carries $3$ bits. Here $T_{\mathrm{phys}}$ and $Q$ are physical quantities, distinct from the semantic $T$ and $E$ of Section 8.

---

# Appendix C

## Spectral and Operator-Theoretic Formulation

### C.1 Semantic Hilbert space

Fix a finite set $F\subseteq\mathcal{P}$ containing every prime under discussion (finite dimension keeps the spectral theory elementary). Let
$$\mathcal{H}_F=\operatorname{span}\{\lvert p\rangle:p\in F\}\cong\mathbb{C}^F$$
with $\{\lvert p\rangle\}$ **orthonormal**. A semantic object is
$$\lvert X\rangle=\sum_i n_i\,\lvert p_i\rangle .$$

<!-- audit:26 proved -->
**Proposition C.1.** The map $x\mapsto\lvert x\rangle$ is an injective monoid homomorphism $(M_F,\cdot)\to(\mathcal{H}_F,+)$, and $\langle x\mid y\rangle=0$ iff $x$ and $y$ are orthogonal in the sense of 7.1.

*Proof.* Exponents add under multiplication. For the second claim see Proposition 7.1. $\square$

### C.2 Semantic propagation operator

**Definition C.2.** A **propagation operator** is a linear map $\mathcal{T}:\mathcal{H}_F\to\mathcal{H}_F$ that captures inference dynamics. Throughout we assume $\mathcal{T}$ is **normal** ($\mathcal{T}\mathcal{T}^*=\mathcal{T}^*\mathcal{T}$) with $\lVert\mathcal{T}\rVert\le1$. Its **stable subspace** $\mathcal{H}_{\mathrm{st}}$ is the sum of the eigenspaces $\ker(\mathcal{T}-\lambda)$ with $\lvert\lambda\rvert=1$, with orthogonal projection $P_{\mathrm{st}}$; the **unstable subspace** is its orthogonal complement, the sum of eigenspaces with $\lvert\lambda\rvert<1$.

Two instances are used below.

- **Witnessed-span operator.** For a finite corpus $K=(X_1,\dots,X_N)$ of witnessed explanations with encodings $x_j$, let $W=\operatorname{span}\{\lvert x_j\rangle\}$ and $\mathcal{T}_W=P_W$, the orthogonal projection onto $W$ (eigenvalues $1$ on $W$, $0$ on $W^\perp$).
- **Support filter.** For $S\subseteq F$ and a fixed $\lambda_0$ with $\lvert\lambda_0\rvert<1$, let $\mathcal{T}_S$ be diagonal with $\mathcal{T}_S\lvert p\rangle=\lvert p\rangle$ for $p\in S$ and $\lambda_0\lvert p\rangle$ otherwise.

Both are self-adjoint (if $\lambda_0$ is real) and satisfy the standing assumptions.

### C.3 Rashomon sets and invariant subspaces

<!-- audit:27 repaired -->
**Proposition C.3.** Write $\mathcal{H}_B=\operatorname{span}\{\lvert p\rangle:p\in B\}$ for $B\subseteq F$.
1. A Rashomon set is a set of explanations, not a subspace. Under the default regime the span of a Rashomon class is a coordinate subspace: for $a\in M_F$, $a\ne1$, $\operatorname{span}\{\lvert x\rangle:x\in[a]\}=\mathcal{H}_{\operatorname{supp}a}$.
2. $\mathcal{H}_B$ is $\mathcal{T}$-invariant iff $\langle q\mid\mathcal{T}\mid p\rangle=0$ for all $p\in B$, $q\notin B$.
3. If $\mathcal{T}$ is normal and $\mathcal{H}_B$ is invariant, then $\mathcal{H}_{F\setminus B}=\mathcal{H}_B^\perp$ is invariant too.

So the statement "Rashomon sets are $\mathcal{T}$-invariant" becomes: the span of a Rashomon class is invariant exactly when $\mathcal{T}$ has the block structure in (2).

*Proof.* (1) Every $x\in[a]$ has support $\operatorname{supp}a$, so $\lvert x\rangle\in\mathcal{H}_{\operatorname{supp}a}$. Conversely, for $p\in\operatorname{supp}a$ both $a$ and $ap$ lie in $[a]$, so $\lvert p\rangle=\lvert ap\rangle-\lvert a\rangle$ lies in the span. (2) $\mathcal{T}\lvert p\rangle\in\mathcal{H}_B$ for all $p\in B$ iff its coordinates outside $B$ vanish. (3) Let $P$ project onto $V=\mathcal{H}_B$. Invariance gives $\mathcal{T}P=P\mathcal{T}P$. Normality gives $\lVert\mathcal{T}P\rVert_{\mathrm{HS}}^2=\operatorname{tr}(P\mathcal{T}^*\mathcal{T}P)=\operatorname{tr}(P\mathcal{T}\mathcal{T}^*P)=\lVert\mathcal{T}^*P\rVert_{\mathrm{HS}}^2$. Also $\lVert\mathcal{T}^*P\rVert_{\mathrm{HS}}^2=\lVert P\mathcal{T}^*P\rVert_{\mathrm{HS}}^2+\lVert(I-P)\mathcal{T}^*P\rVert_{\mathrm{HS}}^2$ and $\lVert P\mathcal{T}^*P\rVert_{\mathrm{HS}}=\lVert P\mathcal{T}P\rVert_{\mathrm{HS}}=\lVert\mathcal{T}P\rVert_{\mathrm{HS}}$. Hence $(I-P)\mathcal{T}^*P=0$, so $V$ is $\mathcal{T}^*$-invariant and $V^\perp$ is $\mathcal{T}$-invariant. $\square$

### C.4 Prime-of-Primes as eigenmodes

The link between the frequency definition of promotion (5.1) and spectra goes through the **co-occurrence operator** of a corpus,
$$C_K=\sum_{j=1}^{N}\lvert x_j\rangle\langle x_j\rvert ,$$
which is self-adjoint and positive semidefinite, with $\operatorname{range}C_K=W$. Call $B\subseteq F$ with $\lvert B\rvert\ge2$ an **exact co-occurrence block** of $K$ if every $x_j$ has equal exponents on all primes of $B$, and at least one $x_j$ meets $B$: the product $\prod_{p\in B}p$ appears in each explanation a whole number of times $m_j$, positive at least once, and the primes of $B$ never appear otherwise. This is the noise-free form of "appears stably" in Definition 5.1.

<!-- audit:28 repaired -->
**Theorem C.4.** Let $B\subseteq F$, $\lvert B\rvert\ge2$, be met by at least one $x_j$. The following are equivalent:
1. $B$ is an exact co-occurrence block of $K$;
2. every eigenvector of $C_K$ with nonzero eigenvalue is constant on $B$;
3. every stable vector of $\mathcal{T}_W$ is constant on $B$.

*Proof.* For a self-adjoint operator, $\operatorname{range}C_K$ is the orthogonal sum of the eigenspaces with nonzero eigenvalue. Writing $C_K=YY^*$ with the $\lvert x_j\rangle$ as columns of $Y$, $\operatorname{range}C_K=\operatorname{range}Y=W$, which is also $\mathcal{H}_{\mathrm{st}}$ for $\mathcal{T}_W$. The set of vectors constant on $B$ is a subspace, so it contains $W$ iff it contains a spanning set of $W$: the $\lvert x_j\rangle$ (statement 1), or the eigenvectors with nonzero eigenvalue (statement 2). $\square$

**Corollary C.4.1 (isolated PoPs are eigenvectors).** If, in addition, each $x_j$ is either supported inside $B$ or has support disjoint from $B$, and some $x_j$ meets $B$, then $\lvert\pi_B\rangle=\lvert B\rvert^{-1/2}\sum_{p\in B}\lvert p\rangle$ satisfies
$$C_K\lvert\pi_B\rangle=\lambda\lvert\pi_B\rangle,\qquad\lambda=\lvert B\rvert\sum_j m_j^2>0,$$
and $\lvert\pi_B\rangle$ is stable for $\mathcal{T}_W$.

*Proof.* An $x_j$ meeting $B$ equals $m_j\sum_{p\in B}\lvert p\rangle$, so $\langle x_j\mid\pi_B\rangle=m_j\lvert B\rvert^{1/2}$; the others give $0$. Summing, $C_K\lvert\pi_B\rangle=\lvert B\rvert^{1/2}\sum_j m_j^2\sum_{p\in B}\lvert p\rangle$. It lies in $\operatorname{range}C_K=W$. $\square$

So stable eigenvectors correspond to PoPs in this precise sense: exact co-occurrence blocks are the sets of primes on which the whole stable spectrum is constant, and an isolated block is itself a stable eigenmode.

**Conjecture C.4.2 (approximate co-occurrence).** If the exponents on $B$ are equal up to a small perturbation in most explanations of $K$, the eigenvectors of $C_K$ with eigenvalues bounded away from $0$ are close to constant on $B$, with a bound of Davis–Kahan type in terms of the perturbation and the spectral gap. Not proved here.

### C.5 Orthogonality (spectral)

<!-- audit:29 repaired -->
**Proposition C.5.**
1. Orthogonal cliques span orthogonal coordinate subspaces $\mathcal{H}_{S_\Gamma}\perp\mathcal{H}_{S_\Delta}$ (notation of 7.2), whatever $\mathcal{T}$ is.
2. If $\mathcal{T}$ is normal and $\mathcal{H}_{S_\Gamma}$ is invariant, then the two cliques lie in the orthogonal invariant subspaces $\mathcal{H}_{S_\Gamma}$ and $\mathcal{H}_{F\setminus S_\Gamma}\supseteq\mathcal{H}_{S_\Delta}$.
3. For normal $\mathcal{T}$, eigenvectors for distinct eigenvalues are orthogonal. Without normality this fails: $\mathcal{T}=\begin{pmatrix}1&1\\0&2\end{pmatrix}$ has eigenvectors $(1,0)$ and $(1,1)$ with inner product $1$.

*Proof.* (1) $S_\Gamma\cap S_\Delta=\varnothing$. (2) Proposition C.3(3). (3) The spectral theorem for normal operators. $\square$

### C.6 Annealing

Let $L$ be the Laplacian of the co-occurrence graph on $F$: edge weights $a_{pq}=\langle p\mid C_K\mid q\rangle=\sum_j x_{jp}x_{jq}$ for $p\ne q$ (and $a_{pp}=0$), collected in the matrix $\operatorname{Adj}=(a_{pq})$, and $L=\operatorname{Deg}-\operatorname{Adj}$ with $\operatorname{Deg}_{pp}=\sum_{q\ne p}a_{pq}$. Define
$$\mathcal{D}_T=e^{-L/T}.$$

<!-- audit:30 repaired -->
**Proposition C.6.** $L$ is self-adjoint and positive semidefinite, with $\langle v\mid L\mid v\rangle=\tfrac12\sum_{p,q}a_{pq}\lvert v_p-v_q\rvert^2$, and $\ker L$ is the space of vectors constant on each connected component of the graph. Consequently $\mathcal{D}_T$ is self-adjoint with eigenvalues $e^{-\mu/T}\in(0,1]$ for the eigenvalues $\mu\ge0$ of $L$: components of higher frequency (larger $\mu$, more variation across edges) are damped more. Moreover $\mathcal{D}_T\to P_{\ker L}$ as $T\to0^+$ and $\mathcal{D}_T\to I$ as $T\to\infty$.

So $\mathcal{D}_T$ **filters high-frequency semantic noise**, most strongly at low temperature, where it consolidates each connected cluster to a constant profile. This matches Section 8: low temperature is consolidation.

*Proof.* The quadratic form identity is a direct expansion and is non-negative because $a_{pq}\ge0$. It vanishes iff $v_p=v_q$ whenever $a_{pq}>0$, i.e. iff $v$ is constant on components. The rest follows by diagonalizing $L$ and applying $e^{-\mu/T}$ to each eigenvalue. $\square$

### C.7 Hallucination

<!-- audit:31 repaired -->
**Theorem C.7.** Let $\mathcal{T}$ satisfy the standing assumptions of C.2.
1. For every $v$, $\lVert\mathcal{T}^nP_{\mathrm{st}}v\rVert=\lVert P_{\mathrm{st}}v\rVert$ for all $n$, and $\mathcal{T}^n(v-P_{\mathrm{st}}v)\to0$. Hence $\mathcal{T}^nv\to0$ iff $P_{\mathrm{st}}v=0$.

Define the **hallucinated component** of $X$ as $u(X)=\lvert X\rangle-P_{\mathrm{st}}\lvert X\rangle$. $X$ is **spectrally stable** if $u(X)=0$ and **spectrally unstable** otherwise. An unstable $X$ is a **total hallucination** if $P_{\mathrm{st}}\lvert X\rangle=0$ (equivalently, by (1), $\mathcal{T}^n\lvert X\rangle\to0$) and **partly hallucinated** if $P_{\mathrm{st}}\lvert X\rangle\ne0$.

2. For $\mathcal{T}_W$: $u(X)=0$ iff $\lvert X\rangle\in W$, the span of the witnessed explanations.
3. For $\mathcal{T}_S$: $u(X)\ne0$ iff $\operatorname{supp}\Pi(X)\not\subseteq S$, which is Definition 9.1.
4. If $S$ is the set of primes occurring in $K$, then stability for $\mathcal{T}_W$ implies $\operatorname{supp}\Pi(X)\subseteq S$; the converse fails (Proposition 9.2(3)).
5. The encoding $\prod_{p\in B}p$ of an isolated PoP block (Corollary C.4.1), whose vector is $\sum_{p\in B}\lvert p\rangle$, is stable for $\mathcal{T}_W$, so it is never a hallucination.

*Proof.* (1) By the spectral theorem write $v=\sum_\lambda v_\lambda$ with orthogonal eigencomponents; then $\mathcal{T}^nv=\sum_\lambda\lambda^nv_\lambda$, so $\lVert\mathcal{T}^n(v-P_{\mathrm{st}}v)\rVert^2=\sum_{\lvert\lambda\rvert<1}\lvert\lambda\rvert^{2n}\lVert v_\lambda\rVert^2\to0$, while the stable part keeps its norm. (2) and (3) read off the stable subspaces $W$ and $\mathcal{H}_S$. (4) Every vector of $W$ is supported in $S$. (5) Corollary C.4.1. $\square$

This removes the inconsistency of the January version, where "PoP = eigenvector" and "hallucination = decays" overlapped (with $\mathcal{T}=I/2$ every vector was both). Here stability means $\lvert\lambda\rvert=1$. Under an operator such as $I/2$ every vector decays, so it has no stable modes and is not an admissible model of stable inference; PoP modes are characterized by the co-occurrence operator (Theorem C.4) and are stable for $\mathcal{T}_W$. A partly hallucinated explanation does not vanish: $\mathcal{T}^n\lvert X\rangle-\mathcal{T}^nP_{\mathrm{st}}\lvert X\rangle\to0$ while $\lVert\mathcal{T}^nP_{\mathrm{st}}\lvert X\rangle\rVert$ stays equal to $\lVert P_{\mathrm{st}}\lvert X\rangle\rVert\ne0$. When every stable eigenvalue equals $1$, as for $\mathcal{T}_W$ and $\mathcal{T}_S$, $\mathcal{T}^n\lvert X\rangle\to P_{\mathrm{st}}\lvert X\rangle$; otherwise the stable part may rotate without converging (e.g. $\mathcal{T}=\operatorname{diag}(-1,\tfrac12)$).

### C.8 Correction

Projection onto the stable subspace can leave the encodings: projecting $\lvert p_1\rangle$ onto $\operatorname{span}(\lvert p_1\rangle+\lvert p_2\rangle)$ gives $(\tfrac12,\tfrac12)$, which is not in $M_F$. Correction therefore projects and then rounds within the stable lattice.

<!-- audit:32 repaired -->
**Theorem C.8.** Let $\Lambda_{\mathrm{st}}=\{y\in M_F:\lvert y\rangle\in\mathcal{H}_{\mathrm{st}}\}$ and define the **correction** $\kappa(X)$ as the $y\in\Lambda_{\mathrm{st}}$ minimizing $\lVert\lvert X\rangle-\lvert y\rangle\rVert$, ties broken by smaller energy and then by a fixed lexicographic order.
1. $\kappa(X)$ exists and is unique.
2. $\kappa(X)$ is the point of $\Lambda_{\mathrm{st}}$ nearest to $P_{\mathrm{st}}\lvert X\rangle$: project, then round.
3. If $X$ is stable, $\kappa(X)=X$.
4. For $\mathcal{T}_S$, $\kappa(X)=\Pi(X)|_S$: the offending primes are deleted, in agreement with Proposition 9.4.

*Proof.* (1) $\Lambda_{\mathrm{st}}$ contains $1$ (the zero vector), and only finitely many points of $\mathbb{N}^F$ lie within distance $\lVert X\rVert$ of $\lvert X\rangle$; the tie-break is a total order. (2) For $y\in\mathcal{H}_{\mathrm{st}}$, Pythagoras gives $\lVert X-y\rVert^2=\lVert u(X)\rVert^2+\lVert P_{\mathrm{st}}X-y\rVert^2$, and the first term does not depend on $y$. (3) Distance $0$ is attained only at $y=X$. (4) Here $\Lambda_{\mathrm{st}}=M_S$ and $\lVert X-y\rVert^2=\sum_{p\in S}(x_p-y_p)^2+\sum_{p\notin S}x_p^2$. $\square$

In the example above, the stable lattice is $\{(k,k)\}$; the points $(0,0)$ and $(1,1)$ are both at distance $1$ from $(1,0)$, and the tie-break returns the tautology $(0,0)$: an isolated $p_1$ is not a stable unit of this corpus. Corrections for non-normal $\mathcal{T}$ (oblique, Riesz projections) are outside the scope of this revision.

---

## Final Synthesis

<!-- audit:synthesis repaired -->
**Theorem S.1 (dictionary).** On $M_F$, the categorical, algebraic and spectral descriptions are three presentations of one object, related by the embedding $x\mapsto\lvert x\rangle$:

| Category ($\mathbf{Enc}$) | Algebra ($\mathcal{S}$) | Spectral ($\mathcal{H}_F$) |
|---|---|---|
| arrow $x\to y$ | $y\mid x$ | $\lvert y\rangle\le\lvert x\rangle$ coordinatewise |
| resource conjunction | $x\otimes y=xy$ | $\lvert x\rangle+\lvert y\rangle$ |
| logical conjunction (product) | $\operatorname{lcm}(x,y)$ | coordinatewise $\max$ |
| alternative | $x\oplus y=\gcd(x,y)$ | coordinatewise $\min$ |
| orthogonality | $\gcd(x,y)=1$ | $\langle x\mid y\rangle=0$ |
| energy | $E(x)=\sum x_p w(p)$ | $\langle w\mid x\rangle$ |

*Proof.* Each line is Proposition C.1 together with the coordinatewise descriptions of Section 0, Theorem A.3 and Theorem B.1. $\square$

Across these three **compatible** lenses:

- **Category theory** → structure and recursion
- **Algebra** → computation, valuation, energy
- **Spectral theory** → dynamics, stability, discovery

the proved content is the dictionary above, Theorems 5.4, 8.3, C.4, C.7 and C.8, and the propositions that support them. They lead to the guiding thesis of the program:

> **Thesis (not a theorem).** Meaning is stable eigenstructure under recursive semantic propagation.
> Prime-of-Primes compression identifies, preserves, and exploits that structure.

### Open problems

1. Construct an extractor that is paraphrase-invariant (4.4) and a factorization functor (A.4).
2. Prove Conjecture C.4.2 for approximate co-occurrence.
3. Extend C.7 and C.8 to non-normal propagation operators.
4. Give the Thesis a precise mathematical form, or a test that could refute it.

---

## Closing Note

This unified document is suitable for:

- engine panels,
- internal architecture alignment,
- archival publication (Zenodo / arXiv),
- and as a reference foundation for CollaborativAI’s orthogonal inference systems.
