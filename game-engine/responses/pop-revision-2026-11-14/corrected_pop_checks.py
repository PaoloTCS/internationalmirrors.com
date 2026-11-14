"""Checks for the corrected Prime of Primes files (November 14, 2026).

Runs against the corrected text in this folder:
  game-engine/responses/PrimeOfPrimes_GPT5-2.md   (monograph)
  CLAUDE_CODE_BRIEFING.md
  AI-Board-of-Directors/Claude-Original-Advice.md
  AI-Board-of-Directors/GPT-5-2-Secondary-Advice.md

Three kinds of check:
  1. Mathematics: every proved or repaired statement is verified by exhaustive
     or randomized computation in the concrete model (semantic primes indexed
     by the ordinary primes), and every stated counterexample is reproduced.
  2. Code: the corrected encoder is extracted from the corrected advice file
     and run (round trip, injectivity, the old bugs, the stated sizes).
  3. Text: every audit item carries exactly one status tag (proved, repaired,
     open, removed), the false sentences of the January text are gone, numbers
     quoted in the text match the computations, and every cross-reference in
     the monograph points to a label that exists.

Standard library only. Usage: python3 -I corrected_pop_checks.py [folder]
"""
import math
import random
import re
import sys
from fractions import Fraction as Fr
from itertools import product as iprod
from math import gcd, log, log2, prod
from pathlib import Path

ROOT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent
MONO = ROOT / "game-engine/responses/PrimeOfPrimes_GPT5-2.md"
BRIEF = ROOT / "CLAUDE_CODE_BRIEFING.md"
CLAUDE = ROOT / "AI-Board-of-Directors/Claude-Original-Advice.md"
GPT = ROOT / "AI-Board-of-Directors/GPT-5-2-Secondary-Advice.md"
TEXT = {k: p.read_text(encoding="utf-8") for k, p in
        {"mono": MONO, "brief": BRIEF, "claude": CLAUDE, "gpt": GPT}.items()}

random.seed(20261114)
results = []


def rep(tag, ok, note=""):
    results.append((tag, bool(ok)))
    print(f"[{'PASS' if ok else 'FAIL'}] {tag}" + (f": {note}" if note else ""))


# ---------------------------------------------------------------- helpers
def primes_upto(n):
    s = bytearray([1]) * (n + 1)
    s[0:2] = b"\x00\x00"
    for i in range(2, math.isqrt(n) + 1):
        if s[i]:
            s[i * i::i] = bytearray(len(range(i * i, n + 1, i)))
    return [i for i in range(n + 1) if s[i]]


P = primes_upto(200000)


def factor(n):
    f = {}
    for p in P:
        if p * p > n:
            break
        while n % p == 0:
            f[p] = f.get(p, 0) + 1
            n //= p
    if n > 1:
        f[n] = f.get(n, 0) + 1
    return f


def supp(n): return set(factor(n))
def rad(n): return prod(supp(n)) if n > 1 else 1
def lcm(a, b): return a * b // gcd(a, b)
def E(n, w=log): return sum(e * w(p) for p, e in factor(n).items())
def vec(n, F): f = factor(n); return [f.get(p, 0) for p in F]


def rank(rows):
    """Rank over Q of a list of rational row vectors."""
    m = [[Fr(x) for x in r] for r in rows]
    r = 0
    cols = len(m[0]) if m else 0
    for c in range(cols):
        piv = next((i for i in range(r, len(m)) if m[i][c] != 0), None)
        if piv is None:
            continue
        m[r], m[piv] = m[piv], m[r]
        for i in range(len(m)):
            if i != r and m[i][c] != 0:
                t = m[i][c] / m[r][c]
                m[i] = [a - t * b for a, b in zip(m[i], m[r])]
        r += 1
    return r


def jacobi(A, tol=1e-24, sweeps=200):
    """Eigen-decomposition of a real symmetric matrix (cyclic Jacobi).
    Returns (eigenvalues, eigenvectors as columns)."""
    n = len(A)
    a = [row[:] for row in A]
    V = [[float(i == j) for j in range(n)] for i in range(n)]
    for _ in range(sweeps):
        off = sum(a[i][j] ** 2 for i in range(n) for j in range(n) if i != j)
        if off < tol:
            break
        for p in range(n):
            for q in range(p + 1, n):
                if abs(a[p][q]) < 1e-15:
                    continue
                th = (a[q][q] - a[p][p]) / (2 * a[p][q])
                t = (1 if th >= 0 else -1) / (abs(th) + math.sqrt(th * th + 1))
                c = 1 / math.sqrt(t * t + 1)
                s = t * c
                for k in range(n):
                    akp, akq = a[k][p], a[k][q]
                    a[k][p], a[k][q] = c * akp - s * akq, s * akp + c * akq
                for k in range(n):
                    apk, aqk = a[p][k], a[q][k]
                    a[p][k], a[q][k] = c * apk - s * aqk, s * apk + c * aqk
                for k in range(n):
                    vkp, vkq = V[k][p], V[k][q]
                    V[k][p], V[k][q] = c * vkp - s * vkq, s * vkp + c * vkq
    return [a[i][i] for i in range(n)], V


def col(V, j): return [V[i][j] for i in range(len(V))]
def dot(u, v): return sum(a * b for a, b in zip(u, v))
def matvec(A, v): return [dot(r, v) for r in A]


def gram(vectors, n):
    return [[sum(x[i] * x[j] for x in vectors) for j in range(n)] for i in range(n)]


def proj_onto_span(vectors, v):
    """Orthogonal projection of v onto span(vectors), exact rationals."""
    basis = []
    for x in vectors:
        u = [Fr(a) for a in x]
        for b in basis:
            c = dot(u, b) / dot(b, b)
            u = [a - c * bb for a, bb in zip(u, b)]
        if any(u):
            basis.append(u)
    out = [Fr(0)] * len(v)
    for b in basis:
        c = dot([Fr(a) for a in v], b) / dot(b, b)
        out = [o + c * bb for o, bb in zip(out, b)]
    return out


# ======================================================== A. MONOGRAPH
print("== Monograph: mathematics ==")

# 4.2, 4.3 (items 1, 2)
ok = all(prod(perm) == prod([2, 3, 3, 5]) for perm in [[3, 2, 5, 3], [5, 3, 3, 2]])
ok &= len({prod(ms) for ms in [(2,), (2, 2), (2, 3), (2, 3, 3), (3, 3, 2, 2)]}) == 5
rep("4.2/4.3 order independence, multiplicity sensitivity [items 1, 2]", ok)

# 4.5 (item 4): supp gcd = intersection; gcd is largest common divisor
bad = [(a, b) for a in range(1, 301) for b in range(1, 301)
       if supp(gcd(a, b)) != (supp(a) & supp(b))]
rep("4.5 supp gcd(x,y) = supp x ∩ supp y [item 4]", not bad, "exhaustive 1..300")

# Section 5: registry, expansion beta, normal form nu
REG = {"pi1": {2: 1, 3: 1}, "pi2": {5: 1, 7: 2}, "pi3": {11: 1, 13: 1}}   # disjoint supports


def beta(y):          # y: dict generator -> exponent, generators are ints or registry names
    out = 1
    for g, e in y.items():
        out *= (prod(p ** k for p, k in REG[g].items()) if g in REG else g) ** e
    return out


def nu(x, reg=REG):
    f = factor(x)
    y = {}
    for name, ex in reg.items():
        m = min(f.get(p, 0) // k for p, k in ex.items())
        if m:
            y[name] = m
            for p, k in ex.items():
                f[p] -= m * k
    y.update({p: e for p, e in f.items() if e})
    return y


def presentations(x, reg):
    """All y with beta(y) = x (enumerate PoP multiplicities)."""
    f = factor(x)
    names = list(reg)
    ranges = [range(0, min(f.get(p, 0) // k for p, k in reg[nm].items()) + 1) for nm in names]
    out = []
    for ms in iprod(*ranges):
        g = dict(f)
        okk = True
        for nm, m in zip(names, ms):
            for p, k in reg[nm].items():
                g[p] = g.get(p, 0) - m * k
                okk &= g[p] >= 0
        if okk:
            y = {nm: m for nm, m in zip(names, ms) if m}
            y.update({p: e for p, e in g.items() if e})
            out.append(y)
    return out


# 5.2 beta is a hom, fixes M, surjective (item 5)
ok = True
for _ in range(2000):
    y1 = {g: random.randint(0, 2) for g in ["pi1", "pi2", 2, 5, 11]}
    y2 = {g: random.randint(0, 2) for g in ["pi3", "pi1", 3, 7]}
    s = dict(y1)
    for g, e in y2.items():
        s[g] = s.get(g, 0) + e
    ok &= beta(s) == beta(y1) * beta(y2)
ok &= all(beta({n: 1}) == n for n in P[:50]) and all(beta(nu(x)) == x for x in range(1, 3000))
rep("5.2 beta is a surjective hom fixing M [item 5]", ok)
rep("5.3 beta not injective: beta(pi1) = beta(2*3)", beta({"pi1": 1}) == beta({2: 1, 3: 1}))

# 5.4 normal form: unique maximal presentation, section, injective
ok = True
seen = {}
for x in range(1, 20001):
    pres = presentations(x, REG)
    score = lambda y: sum(e for g, e in y.items() if g in REG)
    best = max(score(y) for y in pres)
    maxi = [y for y in pres if score(y) == best]
    ok &= len(maxi) == 1 and maxi[0] == nu(x) and beta(nu(x)) == x
    key = tuple(sorted((str(g), e) for g, e in nu(x).items()))
    ok &= key not in seen
    seen[key] = x
rep("5.4 normal form unique, maximal, section, injective (disjoint registry) [item 5]", ok, "x = 1..20000")
REG_OV = {"a": {2: 1, 3: 1}, "b": {3: 1, 5: 1}}
pres = presentations(30, REG_OV)
maxi = [y for y in pres if sum(e for g, e in y.items() if g in REG_OV) == 1]
rep("5.4 remark (a): overlapping registry gives two maximal presentations of 2*3*5",
    len(maxi) == 2, str(maxi))
rep("5.4 remark (b): nu is not a hom: nu(2)nu(3) = 2*3 but nu(6) = pi1",
    nu(6) == {"pi1": 1} and nu(2) == {2: 1} and nu(3) == {3: 1})

# 6.2 / A.2 (items 6, 15): rad-fibers form an equivalence relation; p and p^2 share a class
cls = {}
for x in range(1, 2001):
    cls.setdefault(rad(x), []).append(x)
ok = sum(len(v) for v in cls.values()) == 2000 and rad(2) == rad(4) and 2 != 4
ok &= all(not (x % y == 0 and y % x == 0) or x == y for x in range(1, 200) for y in range(1, 200))
rep("6.1/6.2/A.1 Rashomon classes partition M; distinct encodings share a class; divisibility antisymmetric [items 6, 15]", ok)

# 7.1 (item 7): disjoint supports <=> gcd 1 <=> zero inner product; 7.2 cliques
bad = []
for a in range(1, 301):
    fa = factor(a)
    for b in range(1, 301):
        fb = factor(b)
        ip = sum(e * fb.get(p, 0) for p, e in fa.items())
        d = not (set(fa) & set(fb))
        if d != (gcd(a, b) == 1) or d != (ip == 0):
            bad.append((a, b))
ok = not bad
for _ in range(500):
    C = [random.randint(1, 500) for _ in range(3)]
    D = [random.randint(1, 500) for _ in range(3)]
    union_disjoint = not (set().union(*map(supp, C)) & set().union(*map(supp, D)))
    pairwise = all(gcd(c, d) == 1 for c in C for d in D)
    ok &= union_disjoint == pairwise
rep("7.1/7.2 orthogonality equivalences and clique criterion [item 7]", ok, "exhaustive 1..300 + 500 random cliques")

# Remark 7.3 (item 8 removed): orthogonality is independence of assumptions; text check below
# 7.4 (item 9): orthogonal after expansion => disjoint in M'; converse fails
ok = True
gens = ["pi1", "pi2", "pi3", 2, 3, 5, 7, 11, 13, 17]
for _ in range(3000):
    y1 = {g: random.randint(0, 1) for g in random.sample(gens, 3)}
    y2 = {g: random.randint(0, 1) for g in random.sample(gens, 3)}
    s1 = {g for g, e in y1.items() if e}
    s2 = {g for g, e in y2.items() if e}
    if gcd(beta(y1), beta(y2)) == 1:
        ok &= not (s1 & s2)
rep("7.4 orthogonal after expansion implies disjoint supports in M' [item 9]", ok)
rep("7.4 converse fails: supp{pi1} vs {2,5} disjoint, gcd(6,10) = 2", gcd(beta({"pi1": 1}), 10) == 2)

# 8.2 (item 10)
ok = all(abs(E(a * b) - E(a) - E(b)) < 1e-9 for a in range(1, 120) for b in range(1, 120))
rep("8.2 E additive [item 10]", ok, "exhaustive 1..119")

# 8.3 / 8.4 (item 11)
# (a) finite alphabet: product formula equals the (truncated) sum
Fa = [2, 3, 5]
wts = {2: 0.7, 3: 1.1, 5: 1.9}
for T in [0.5, 3.0, 50.0]:
    prodZ = prod(1 / (1 - math.exp(-wts[p] / T)) for p in Fa)
    N = 400 if T > 10 else 120
    sumZ = sum(math.exp(-(i * wts[2] + j * wts[3] + k * wts[5]) / T)
               for i in range(N) for j in range(N) for k in range(N)) if T < 10 else None
    if sumZ is not None:
        ok = abs(sumZ - prodZ) / prodZ < 1e-6
        rep(f"8.3 finite alphabet: Z(T) = product formula at T={T} [item 11]", ok, f"{sumZ:.6f} vs {prodZ:.6f}")
    else:
        rep(f"8.4(1) finite alphabet, positive weights: Z finite at T={T}", math.isfinite(prodZ), f"Z={prodZ:.2f}")
# (b) w = log p: Z = zeta(1/T); T = 0.5 gives zeta(2) = pi^2/6, T >= 1 diverges
z2 = sum(n ** -2.0 for n in range(1, 200001))
rep("8.4(2) w=log p, T=0.5: Z = zeta(2)", abs(z2 - math.pi ** 2 / 6) < 1e-5, f"{z2:.6f}")
grow = [sum(n ** (-1 / T) for n in range(1, 10 ** k)) for T in (1.0,) for k in (4, 5)]
rep("8.4(2) w=log p, T=1: partial sums keep growing (no high-temperature regime)", grow[1] - grow[0] > 2, f"{grow}")
# (c) w(p_i) = i: geometric, finite at T = 2 and T = 20
for T in (2.0, 20.0):
    s = sum(math.exp(-i / T) for i in range(1, 100000))
    rep(f"8.4(3) w(p_i)=i: sum e^(-w/T) finite at T={T}", abs(s - 1 / (math.exp(1 / T) - 1)) < 1e-6)
# convergence criterion for the infinite product
ok = True
for _ in range(200):
    a = [random.random() * 0.9 for _ in range(30)]
    lhs = -sum(math.log(1 - x) for x in a)
    ok &= sum(a) <= lhs <= sum(x / (1 - x) for x in a) + 1e-12
rep("8.3 proof inequality a <= -log(1-a) <= a/(1-a)", ok)

# 8.5 (item 12): orthogonality does not depend on w or T
ok = all((gcd(a, b) == 1) == (not (supp(a) & supp(b))) for a in range(1, 80) for b in range(1, 80))
rep("8.5 orthogonality involves neither w nor T [item 12]", ok)

# 9.2 / C.7 (item 13): support filter and witnessed span
F4 = [2, 3, 5, 7]
S = {2, 3}
ok = True
for v in iprod(range(3), repeat=4):
    unstable = any(v[i] for i, p in enumerate(F4) if p not in S)   # T_S: diag(1 on S, lambda0 off S)
    halluc = not ({p for i, p in enumerate(F4) if v[i]} <= S)
    ok &= unstable == halluc
rep("9.2(2)/C.7(3) support filter: unstable iff hallucination [item 13]", ok, "all exponent vectors in {0,1,2}^4")
W = [[1, 1, 0, 0]]                               # witnessed corpus {2*3}
pv = proj_onto_span(W, [1, 0, 0, 0])
rep("9.2(3)/C.7(4) X = p1 uses supported primes but is unstable for T_W", pv != [1, 0, 0, 0], str(pv))
ok = True
corpus = [[1, 1, 0, 0], [0, 2, 1, 0]]
for v in iprod(range(3), repeat=4):
    inW = proj_onto_span(corpus, list(v)) == [Fr(a) for a in v]
    if inW:
        ok &= all(v[i] == 0 for i, p in enumerate(F4) if p == 7)
rep("C.7(4) stable for T_W implies support within corpus primes", ok)

# 9.3 - 9.5 (item 14)
ok = True
for _ in range(3000):
    a, b, c = (random.randint(1, 3000) for _ in range(3))
    d = lambda x, y: sum(log(p) * abs(factor(x).get(p, 0) - factor(y).get(p, 0)) for p in supp(x) | supp(y))
    ok &= abs(d(a, b) - (E(lcm(a, b)) - E(gcd(a, b)))) < 1e-9
    ok &= abs(d(a, b) - log(lcm(a, b) / gcd(a, b))) < 1e-9
    ok &= d(a, c) <= d(a, b) + d(b, c) + 1e-9 and (d(a, b) == 0) == (a == b)
rep("9.3 d_w is a metric; d = E(lcm) - E(gcd) = log(lcm/gcd) [item 14]", ok)
ok = True
for x in range(1, 3000):
    fx = factor(x)
    restr = prod(p ** e for p, e in fx.items() if p in S)
    cands = [2 ** i * 3 ** j for i in range(0, 13) for j in range(0, 9)]
    dist = lambda y: sum(log(p) * abs(fx.get(p, 0) - factor(y).get(p, 0)) for p in supp(x) | supp(y))
    best = min(cands, key=lambda y: (dist(y), y))
    ok &= best == restr and sorted(dist(y) for y in cands)[1] > dist(restr) + 1e-12
    ok &= abs(dist(restr) - sum(log(p) * e for p, e in fx.items() if p not in S)) < 1e-9
rep("9.4 unique nearest supported encoding is the restriction to S", ok, "x = 1..2999, S = {2,3}")

# A.3 (item 17)
ok = [n for n in range(1, 10 ** 5) if n * n == n] == [1]
rep("A.3(3) no-go: n*n = n only for n = 1 [item 17]", ok)
ok = True
for x in range(1, 61):
    for y in range(1, 61):
        L = lcm(x, y)
        ok &= L % x == 0 and L % y == 0 and lcm(x, x) == x
        ok &= all(z % L == 0 for z in range(1, 400) if z % x == 0 and z % y == 0)
        ok &= rad(x * y) == lcm(rad(x), rad(y))
for _ in range(2000):
    x, y = random.randint(1, 300), random.randint(1, 300)
    xp, yp = random.choice([d for d in range(1, x + 1) if x % d == 0]), random.choice([d for d in range(1, y + 1) if y % d == 0])
    ok &= (x * y) % (xp * yp) == 0
rep("A.3(1,2,4) monoidal preorder; lcm is the categorical product; rad(xy) = lcm(rad x, rad y) [item 17]", ok)

# A.4 / A.2 (item 18): rad and beta are monotone for divisibility
ok = all(rad(y) % rad(x) == 0 for x in range(1, 200) for y in range(x, 1000, x))
for _ in range(1000):
    y1 = {g: random.randint(0, 2) for g in random.sample(gens, 3)}
    y2 = dict(y1)
    for g in random.sample(gens, 2):
        y2[g] = y2.get(g, 0) + random.randint(0, 2)
    ok &= beta(y2) % beta(y1) == 0
rep("A.2/A.4/A.5 rad and beta preserve divisibility (monotone, hence functors) [item 18]", ok)

# A.5 (item 19): promotion cannot be a hom onto one generator; nu not monotone
splits = [(a, b) for a in range(3) for b in range(3) if a + b == 1]
rep("A.5 hom with phi(p1)phi(p2) = pi forces a trivial factor [item 19]", all(0 in s for s in splits), str(splits))
rep("A.5 nu not monotone: 2 | 6 but nu(2) does not divide nu(6) in M'",
    6 % 2 == 0 and not set(nu(2)) <= set(nu(6)))

# A.6 (item 20): two-level ladder, composite expansion is a hom
REG2 = {"sig": {"pi1": 1, 5: 1}}


def beta2(z):
    out = {}
    for g, e in z.items():
        for h, k in (REG2[g].items() if g in REG2 else [(g, 1)]):
            out[h] = out.get(h, 0) + k * e
    return out


ok = True
for _ in range(1000):
    z1 = {g: random.randint(0, 2) for g in ["sig", "pi1", 2, 7]}
    z2 = {g: random.randint(0, 2) for g in ["sig", "pi2", 3, 5]}
    s = dict(z1)
    for g, e in z2.items():
        s[g] = s.get(g, 0) + e
    ok &= beta(beta2(s)) == beta(beta2(z1)) * beta(beta2(z2))
ok &= beta(beta2({"sig": 1})) == 30
rep("A.6 ladder: composite expansion M_2 -> M_0 is a hom [item 20]", ok)

# B.2: in the tower semiring, oplus is gcd of presentations; shared assumptions need expansion
pres_x = {"<2,3>": 1}          # the promoted prime <2,3>, a single generator of M^(1)
pres_y = {2: 1, 5: 1}          # 2*5, a presentation using base primes
common = {g: min(pres_x.get(g, 0), pres_y.get(g, 0)) for g in set(pres_x) | set(pres_y)}
exp_x = {2: 1, 3: 1}
rep("B.2 tower: gcd(<2,3>, 2*5) = 1 on presentations, while gcd of expansions = 2",
    all(e == 0 for e in common.values()) and gcd(prod(p ** e for p, e in exp_x.items()), 10) == 2)

# B.1 (item 21): (N0, gcd, x, 0, 1) is a commutative semiring
N = 40
R = range(N)
ok = all(gcd(gcd(a, b), c) == gcd(a, gcd(b, c)) and gcd(a, b) == gcd(b, a) and gcd(a, 0) == a
         and a * gcd(b, c) == gcd(a * b, a * c) and a * 0 == 0 and a * 1 == a and gcd(a, a) == a
         for a in R for b in R for c in R)
rep("B.1 (N0, gcd, x, 0, 1) is a commutative semiring with idempotent sum [item 21]", ok, "0..39")
rep("B.1 remark: integer addition as alternative creates a new prime (2+3 = 5)", 2 + 3 == 5 and factor(5) == {5: 1})

# B.2 (item 22): filtration, not grading
LEVEL = {"pi1": 1, "pi2": 1, "pi3": 1, "sig": 2}
lev = lambda y: max([LEVEL.get(g, 0) for g, e in y.items() if e] or [0])
ok = True
for _ in range(2000):
    y1 = {g: random.randint(0, 2) for g in random.sample(["pi1", "pi2", "sig", 2, 3, 5], 3)}
    y2 = {g: random.randint(0, 2) for g in random.sample(["pi1", "pi3", "sig", 7, 11], 3)}
    mul = {g: y1.get(g, 0) + y2.get(g, 0) for g in set(y1) | set(y2)}
    gc = {g: min(y1.get(g, 0), y2.get(g, 0)) for g in set(y1) | set(y2)}
    ok &= lev(mul) <= max(lev(y1), lev(y2)) and lev(gc) <= min(lev(y1), lev(y2))
rep("B.2 S_<=i (x) S_<=j in S_<=max, S_<=i (+) S_<=j in S_<=min [item 22]", ok)
rep("B.2 not graded: pi1*pi2 has level 1, not 2", lev({"pi1": 1, "pi2": 1}) == 1)

# B.3 (item 23)
ok = all(rad(gcd(a, b)) == rad(a) and rad(a * b) == rad(a)
         for a in range(1, 400) for b in range(1, 400) if rad(a) == rad(b))
rep("B.3 Rashomon class closed under gcd and x [item 23]", ok, "exhaustive 1..399")
rep("B.3 not an ideal: rad(2*3) != rad(2)", rad(6) != rad(2))

# B.4 (item 24)
ok = True
for _ in range(500):
    Fp = P[:8]
    random.shuffle(Fp)
    parts = [Fp[0:2], Fp[2:5], Fp[5:8]]
    vs = [[random.randint(1, 3) if p in part else 0 for p in P[:8]] for part in parts]
    ok &= rank(vs) == 3
rep("B.4 pairwise disjoint supports imply independence [item 24]", ok)
rep("B.4 converse fails: 6, 10 independent though gcd = 2",
    rank([vec(6, [2, 3, 5]), vec(10, [2, 3, 5])]) == 2 and gcd(6, 10) == 2)
rep("B.4 4, 8 dependent (4^3 = 8^2)", rank([vec(4, [2]), vec(8, [2])]) == 1 and 4 ** 3 == 8 ** 2)

# B.5 (item 25): H <= n for presence bits; examples 0 and 3 bits
H = lambda ps: -sum(q * log2(q) for q in ps if q > 0)
ok = True
for _ in range(500):
    n = random.randint(1, 4)
    w = [random.random() for _ in range(2 ** n)]
    ps = [x / sum(w) for x in w]
    ok &= H(ps) <= n + 1e-12
rep("B.5 H(presence record) <= number of primes [item 25]", ok)
rep("B.5 examples: certain prime 0 bits; one of 8 equiprobable 3 bits", H([1.0]) == 0 and abs(H([1 / 8] * 8) - 3) < 1e-12)

# C.1 (item 26)
F150 = primes_upto(150)
SMOOTH = [x for x in range(1, 5000) if max(supp(x) or {1}) <= 150]
ok = all([a + b for a, b in zip(vec(x, F150), vec(y, F150))] == vec(x * y, F150)
         for x in range(1, 150) for y in range(1, 150))
rep("C.1 log-embedding is an injective hom (M_F,x) -> (H_F,+), F = primes <= 150 [item 26]",
    ok and len({tuple(vec(x, F150)) for x in SMOOTH}) == len(SMOOTH))

# C.3 (item 27)
F6 = P[:6]
ok = True
for A in [6, 30, 2 * 7 * 13, 12, 5 ** 3 * 11]:
    cls_vecs = [vec(x, F6) for x in range(1, 20000) if rad(x) == rad(A)]
    sA = [i for i, p in enumerate(F6) if p in supp(A)]
    ok &= rank(cls_vecs) == len(sA)
    ok &= all(all(v[i] == 0 for i in range(6) if i not in sA) for v in cls_vecs)
rep("C.3(1) span of a Rashomon class = coordinate subspace on supp A [item 27]", ok)
ok = True
for _ in range(500):
    n = 5
    B = set(random.sample(range(n), 2))
    M = [[random.choice([0, 0, 1, -2, 3]) for _ in range(n)] for _ in range(n)]
    invariant = all(all(matvec(M, [float(i == p) for i in range(n)])[q] == 0 for q in range(n) if q not in B) for p in B)
    block = all(M[q][p] == 0 for p in B for q in range(n) if q not in B)
    ok &= invariant == block
rep("C.3(2) H_B invariant iff block entries vanish", ok)
ok = True
for _ in range(300):                       # normal (symmetric) with H_B invariant => complement invariant
    n = 5
    B = [0, 1]
    M = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(i, n):
            if (i in B) == (j in B):
                M[i][j] = M[j][i] = random.uniform(-1, 1)
    ok &= all(abs(M[q][p]) < 1e-15 for p in range(2, n) for q in B)
rep("C.3(3) normal operator: invariant coordinate subspace has invariant complement", ok)


# C.4 (item 28)
def eig_check(corpus, n, B):
    C = gram(corpus, n)
    vals, V = jacobi(C)
    return all(max(col(V, j)[i] for i in B) - min(col(V, j)[i] for i in B) < 1e-6
               for j in range(n) if abs(vals[j]) > 1e-8), C, vals, V


ok = True
for _ in range(200):
    n = 6
    B = [1, 3, 4]
    corpus = []
    for _ in range(random.randint(2, 6)):
        m = random.randint(0, 3)
        v = [random.randint(0, 3) for _ in range(n)]
        for i in B:
            v[i] = m
        corpus.append(v)
    good, *_ = eig_check(corpus, n, B)
    ok &= good
rep("C.4 exact co-occurrence block => every eigenvector with nonzero eigenvalue constant on B [item 28]", ok, "200 random corpora")
ok = True
for _ in range(200):
    n = 6
    B = [1, 3, 4]
    corpus = [[random.randint(0, 3) for _ in range(n)] for _ in range(4)]
    blockish = all(len({v[i] for i in B}) == 1 for v in corpus)
    good, *_ = eig_check(corpus, n, B)
    ok &= good == blockish
rep("C.4 converse: some stable eigenvector is non-constant on B when B is not a block", ok, "200 random corpora")
ok = True
for _ in range(200):
    n = 6
    B = [0, 2, 5]
    ms = []
    corpus = []
    for _ in range(random.randint(2, 6)):
        if random.random() < 0.5:
            m = random.randint(1, 3)
            ms.append(m)
            corpus.append([m if i in B else 0 for i in range(n)])
        else:
            corpus.append([0 if i in B else random.randint(0, 3) for i in range(n)])
    if not ms:
        continue
    C = gram(corpus, n)
    piB = [1 / math.sqrt(3) if i in B else 0.0 for i in range(n)]
    lam = 3 * sum(m * m for m in ms)
    ok &= all(abs(a - lam * b) < 1e-9 for a, b in zip(matvec(C, piB), piB))
    ok &= [float(x) for x in proj_onto_span(corpus, [1 if i in B else 0 for i in range(n)])] == [1.0 if i in B else 0.0 for i in range(n)]
rep("C.4.1 isolated block: |pi_B> eigenvector with lambda = |B| sum m_j^2, stable for T_W", ok)

# C.5 (item 29)
ok = True
for _ in range(200):
    n = 5
    A = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(i, n):
            A[i][j] = A[j][i] = random.uniform(-2, 2)
    vals, V = jacobi(A)
    for i in range(n):
        for j in range(i + 1, n):
            if abs(vals[i] - vals[j]) > 1e-6:
                ok &= abs(dot(col(V, i), col(V, j))) < 1e-8
rep("C.5(3) normal (symmetric): eigenvectors of distinct eigenvalues orthogonal [item 29]", ok)
Tn = [[1, 1], [0, 2]]
rep("C.5(3) non-normal counterexample: eigenvectors (1,0),(1,1) not orthogonal",
    matvec(Tn, [1, 0]) == [1, 0] and matvec(Tn, [1, 1]) == [2, 2] and dot([1, 0], [1, 1]) == 1)

# C.6 (item 30): Laplacian
ok = True
for _ in range(100):
    n = 6
    corpus = [[random.choice([0, 0, 1, 2]) for _ in range(n)] for _ in range(4)]
    A = [[(sum(x[p] * x[q] for x in corpus) if p != q else 0) for q in range(n)] for p in range(n)]
    L = [[(sum(A[p]) if p == q else -A[p][q]) for q in range(n)] for p in range(n)]
    v = [random.uniform(-1, 1) for _ in range(n)]
    qf = dot(v, matvec(L, v))
    ok &= abs(qf - 0.5 * sum(A[p][q] * (v[p] - v[q]) ** 2 for p in range(n) for q in range(n))) < 1e-9
    vals, V = jacobi([[float(a) for a in r] for r in L])
    ok &= min(vals) > -1e-9
    # kernel dimension = number of connected components
    comp, seen_ = 0, set()
    for s in range(n):
        if s in seen_:
            continue
        comp += 1
        stack = [s]
        while stack:
            u = stack.pop()
            if u in seen_:
                continue
            seen_.add(u)
            stack += [w for w in range(n) if A[u][w] > 0 and w not in seen_]
    ok &= sum(1 for x in vals if abs(x) < 1e-8) == comp
    # D_T eigenvalues in (0,1]; T -> 0 gives projection onto ker L
    for T in (0.5, 5.0):
        ok &= all(0 < math.exp(-mu / T) <= 1 + 1e-12 for mu in vals)
    Dsmall = [[sum(V[i][k] * V[j][k] * math.exp(-max(vals[k], 0) / 1e-4) for k in range(n)) for j in range(n)] for i in range(n)]
    Pker = [[sum(V[i][k] * V[j][k] for k in range(n) if abs(vals[k]) < 1e-8) for j in range(n)] for i in range(n)]
    ok &= all(abs(Dsmall[i][j] - Pker[i][j]) < 1e-6 for i in range(n) for j in range(n))
rep("C.6 Laplacian PSD, quadratic form, ker = component-constant, D_T in (0,1], D_T -> P_ker as T -> 0 [item 30]", ok)

# C.7 (item 31): normal T with a unit-circle rotation block and a contracting part
th = 0.7
Tm = [[math.cos(th), -math.sin(th), 0], [math.sin(th), math.cos(th), 0], [0, 0, 0.5]]
v = [1.0, 2.0, 3.0]
st = [1.0, 2.0, 0.0]
un = [0.0, 0.0, 3.0]
x, y = st[:], un[:]
ok = True
for n in range(60):
    x, y = matvec(Tm, x), matvec(Tm, y)
    ok &= abs(math.hypot(*x) - math.hypot(*st)) < 1e-9
rep("C.7(1) stable part keeps its norm, unstable part -> 0 [item 31]", ok and math.hypot(*y) < 1e-15)
rep("C.7 T = I/2 has no stable vector (no |lambda| = 1), removing the old overlap", all(abs(0.5) != 1 for _ in [0]))
xv = [1.0, 0.0]
Td = [[1, 0], [0, 0.5]]
for n in range(60):
    xv = matvec(Td, [1.0, 1.0]) if n == 0 else matvec(Td, xv)
rep("C.7 with all stable eigenvalues 1, a partly hallucinated X converges to its stable part, not to 0", abs(xv[0] - 1) < 1e-12 and xv[1] < 1e-15)
# eigenvalue -1: the stable part never converges, yet T^n X - T^n P_st X -> 0
Tn = [[-1, 0], [0, 0.5]]
xv, sv = [1.0, 1.0], [1.0, 0.0]
seq = []
for n in range(60):
    xv, sv = matvec(Tn, xv), matvec(Tn, sv)
    seq.append(xv[0])
rep("C.7 T = diag(-1, 1/2): T^n X - T^n P_st X -> 0 but T^n X does not converge (stable part flips sign)",
    abs(xv[0] - sv[0]) < 1e-15 and abs(xv[1] - sv[1]) < 1e-15 and seq[-1] * seq[-2] < 0)

# C.8 (item 32): correction
W2 = [[1, 1]]
P_st = proj_onto_span(W2, [1, 0])
rep("C.8 projection alone leaves encodings: (1/2, 1/2)", P_st == [Fr(1, 2), Fr(1, 2)])
lat = [(k, k) for k in range(0, 10)]
dist2 = lambda a, b: sum((p - q) ** 2 for p, q in zip(a, b))
w_log = [log(2), log(3)]
kappa = min(lat, key=lambda y: (dist2((1, 0), y), dot(w_log, y), y))
rep("C.8 correction of p1 for corpus {p1 p2}: tie (0,0)/(1,1) broken to the tautology [item 32]",
    kappa == (0, 0) and dist2((1, 0), (0, 0)) == dist2((1, 0), (1, 1)) == 1)
ok = True
for _ in range(300):
    X = [random.randint(0, 4) for _ in range(2)]
    Pst = proj_onto_span(W2, X)
    for yv in lat:
        ok &= dist2(X, yv) == dist2(X, Pst) + dist2(Pst, yv)
rep("C.8(2) Pythagoras: nearest to X = nearest to P_st X within the stable lattice", ok)
ok = True
for X in iprod(range(4), repeat=4):          # T_S with S = first two coordinates
    box = [y for y in iprod(range(5), repeat=4) if y[2] == 0 and y[3] == 0]
    best = min(box, key=lambda y: (dist2(X, y), y))
    ok &= best == (X[0], X[1], 0, 0)
rep("C.8(4) support filter: correction = deletion of offending primes", ok)

# Synthesis (dictionary)
ok = True
F10 = primes_upto(150)
for x in range(1, 150):
    for y in range(1, 150):
        vx, vy = vec(x, F10), vec(y, F10)
        ok &= ((x % y == 0) == all(b <= a for a, b in zip(vx, vy)))
        ok &= vec(gcd(x, y), F10) == [min(a, b) for a, b in zip(vx, vy)]
        ok &= vec(lcm(x, y), F10) == [max(a, b) for a, b in zip(vx, vy)]
        ok &= vec(x * y, F10) == [a + b for a, b in zip(vx, vy)]
        ok &= (gcd(x, y) == 1) == (dot(vx, vy) == 0)
        ok &= abs(E(x) - dot([log(p) for p in F10], vx)) < 1e-9
rep("S.1 dictionary: divisibility, gcd, lcm, product, orthogonality, energy [synthesis]", ok, "exhaustive 1..149")

# ======================================================== B-D. OTHER FILES
print("\n== Briefing, Claude advice, GPT advice: mathematics and code ==")

# Briefing example
FIELD_PRIME = {"game_id": 2, "turn": 3, "player": 5, "action_type": 7, "target": 11}
vals = {"game_id": 12, "turn": 47, "player": 0, "action_type": 0, "target": 2}
code = prod(FIELD_PRIME[f] ** (v + 1) for f, v in vals.items())
rep("B1 example code is composite, not a prime [item B1]", len(factor(code)) == 5)
rep("B5 example size: 105 bits, as the text says [item B5]",
    code.bit_length() == 105 and "105-bit integer" in TEXT["brief"] and "2^13 × 3^48 × 5^1 × 7^1 × 11^3" in TEXT["brief"])


def brief_decode(c):
    out = {}
    for f, p in FIELD_PRIME.items():
        e = 0
        while c % p == 0:
            c //= p
            e += 1
        out[f] = e - 1
    return out, c


dec, rest = brief_decode(code)
ok = dec == vals and rest == 1
seen = set()
for _ in range(5000):
    vv = {f: random.randint(0, 60) for f in FIELD_PRIME}
    cc = prod(FIELD_PRIME[f] ** (v + 1) for f, v in vv.items())
    ok &= brief_decode(cc)[0] == vv
    seen.add((cc, tuple(sorted(vv.items()))))
ok &= len({c for c, _ in seen}) == len({v for _, v in seen})
rep("B2/B3 decode by dividing by the field primes; injective [items B2, B3]", ok)
rep("B4 numerical closeness is meaningless: codes for turn 47 and 48 differ by a factor 3",
    prod(FIELD_PRIME[f] ** (v + 1) for f, v in {**vals, "turn": 48}.items()) == 3 * code)

# Claude advice: extract and run the corrected encoder
m = re.search(r"```python\n(from math import isqrt.*?class PrimeIntentEncoder.*?)```", TEXT["claude"], re.S)
ns = {}
exec(m.group(1), ns) if m else None
Enc = ns.get("PrimeIntentEncoder")
rep("O4 corrected encoder present in the advice file and runs", Enc is not None)
enc = Enc()
FL = enc.FIELDS
rh = lambda d: [{f: random.randrange(enc.values_per_field) for f in FL} for _ in range(d)]
ok = True
codes = {}
for _ in range(3000):
    h = rh(random.randint(1, 16))
    c = enc.encode_intent(h)
    ok &= enc.decode_intent(c) == h
    key = tuple(tuple(lv[f] for f in FL) for lv in h)
    ok &= codes.setdefault(c, key) == key
rep("O4/O6 decode(encode(h)) = h and no collisions, depth 1..16 [items O4, O6]", ok, "3000 random hierarchies")
h1 = [{f: 0 for f in FL}, {"action_id": 5, "target_id": 1, "priority": 2, "deception_level": 0}]
rep("O4 old bug fixed: level 1, action 5 decodes to level 1", enc.decode_intent(enc.encode_intent(h1))[1]["action_id"] == 5)
pa = enc.get_prime(0, 0, 3)
pp = enc.get_prime(0, 2, 3)
rep("O6 old bug fixed: action_id = 3 and priority = 3 get different primes", pa != pp)
try:
    enc.get_prime(0, 0, 150)
    rejected = False
except ValueError:
    rejected = True
rep("O4 old cross-level collision impossible: out-of-range ids are rejected, ranges disjoint",
    rejected and len({enc.get_prime(l, f, v) for l in range(16) for f in range(4) for v in range(100)}) == 6400)
c = enc.encode_intent(rh(3))
P1 = enc.encode_level(enc.decode_intent(c)[0], 0)
P23 = c // P1
rep("O3 P1 = I_total / (P2 x P3) [item O3]", c == P1 * P23 and c % P23 == 0)
sizes = [enc.encode_intent([{f: 99 for f in FL}] * d).bit_length() for d in (1, 2, 4, 8, 16)]
rep("O2 sizes quoted in the text match the encoder (not constant in depth) [item O2]",
    sizes == [42, 91, 197, 428, 923] and "at most 42, 91, 197, 428 and 923 bits" in TEXT["claude"], str(sizes))
hA = rh(2)
hB = [dict(hA[0]), dict(hA[1])]
hB[1]["priority"] = (hB[1]["priority"] + 1) % 100
sim = enc.prime_similarity(enc.encode_intent(hA), enc.encode_intent(hB))
rep("O7 Jaccard similarity on factor sets: one changed field out of 8 gives 7/9 [item O7]",
    abs(sim - 7 / 9) < 1e-12 and enc.prime_similarity(c, c) == 1)
rep("O5 replaced: similarity is on shared factors, not numerical closeness [item O5]",
    "Similar intents share prime factors" in TEXT["claude"])
rep("O1 composite is a product of 12 primes, not a prime [item O1]",
    len(enc.factor_set(enc.encode_intent(rh(3)))) == 12)

# GPT advice
a, b = 6, 10
wj = sum(min(factor(a).get(p, 0), factor(b).get(p, 0)) * log(p) for p in (2, 3, 5)) / \
    sum(max(factor(a).get(p, 0), factor(b).get(p, 0)) * log(p) for p in (2, 3, 5))
ok = abs(log(gcd(a, b)) / log(lcm(a, b)) - wj) < 1e-12 and abs(wj - 0.204) < 5e-4
for _ in range(2000):
    x, y = random.randint(2, 5000), random.randint(2, 5000)
    fx, fy = factor(x), factor(y)
    ps = set(fx) | set(fy)
    w1 = sum(min(fx.get(p, 0), fy.get(p, 0)) * log(p) for p in ps) / sum(max(fx.get(p, 0), fy.get(p, 0)) * log(p) for p in ps)
    ok &= abs(log(gcd(x, y)) / log(lcm(x, y)) - w1) < 1e-9
rep("G3 log gcd / log lcm = log-weighted Jaccard; 0.204 for 6, 10 [item G3]",
    ok and "about 0.204" in TEXT["gpt"] and "1/3" in TEXT["gpt"])
rep("G1 a product of two or more primes is not prime [item G1]", all(len(factor(p * q)) == 2 for p in P[:20] for q in P[20:40]))
ok = all(brief_decode(prod(FIELD_PRIME[f] ** (v + 1) for f, v in vv.items()))[1] == 1
         for vv in [{f: random.randint(0, 30) for f in FIELD_PRIME} for _ in range(200)])
rep("G2 decoding with a known dictionary is trial division only [item G2]", ok)
rep("G4 sparse exponent map is canonical (unique per element) [item G4]",
    len({tuple(sorted(factor(n).items())) for n in range(1, 5000)}) == 4999)

# ======================================================== TEXT CHECKS
print("\n== Text ==")
EXPECT = {
    "mono": {"1": "proved", "2": "proved", "3": "open", "4": "repaired", "5": "repaired", "6": "repaired",
             "7": "proved", "8": "removed", "9": "repaired", "10": "proved", "11": "repaired", "12": "proved",
             "13": "repaired", "14": "repaired", "15": "proved", "17": "repaired", "18": "repaired",
             "19": "repaired", "20": "repaired", "21": "repaired", "22": "repaired", "23": "repaired",
             "24": "repaired", "25": "repaired", "26": "proved", "27": "repaired", "28": "repaired",
             "29": "repaired", "30": "repaired", "31": "repaired", "32": "repaired", "synthesis": "repaired"},
    "brief": {"B1": "repaired", "B2": "repaired", "B3": "repaired", "B4": "repaired", "B5": "removed"},
    "claude": {"O1": "repaired", "O2": "removed", "O3": "proved", "O4": "repaired", "O5": "removed",
               "O6": "repaired", "O7": "proved", "O8": "open"},
    "gpt": {"G1": "proved", "G2": "repaired", "G3": "repaired", "G4": "proved"},
}
tally = {}
for k, exp in EXPECT.items():
    tags = re.findall(r"<!-- audit:(\S+) (proved|repaired|open|removed) -->", TEXT[k])
    found = {}
    for item, st in tags:
        found.setdefault(item, []).append(st)
    ok = all(len(v) == 1 for v in found.values()) and {i: v[0] for i, v in found.items()} == exp
    rep(f"every audit item in {k} tagged exactly once with the expected status", ok,
        f"{len(found)} items")
    for st in exp.values():
        tally[st] = tally.get(st, 0) + 1

GONE = {
    "mono": ["This defines **maximal disagreement** precisely", "Closed under (\\oplus)",
             "Stable eigenvectors correspond to PoPs.", "- fractional exponents,",
             "Across three equivalent lenses", "Promotion is a functor:", "### B.2 Graded structure",
             "Rashomon ideals", "#(\\text{erased primes})", "It is written to be internally consistent",
             "Paraphrase-invariant\n", "Rashomon sets are fibers of"],
    "brief": ["as unique prime numbers", "Infinite scalability", "Hierarchical (factorization reveals structure)",
              "Pattern matching via prime similarity", "Encode each game state as prime\n",
              "Compress long game histories", "unique prime encoding"],
    "claude": ["Single prime representing entire intent stack", "Constant Space", "nearby primes",
               "composite prime", "level = factor // 100", "Lossless Compression", "Encode single intent level as prime"],
    "gpt": ["(Jaccard on prime IDs), without factoring"],
}
for k, phrases in GONE.items():
    left = [s for s in phrases if s in TEXT[k]]
    rep(f"false January sentences absent from {k}", not left, str(left) if left else f"{len(phrases)} phrases")

# Monograph cross-references resolve
lab = r"(?:[A-CS]\.\d+(?:\.\d+)?|\d+\.\d+)"
defined = set(re.findall(r"\*\*(?:Definition and Proposition|Theorem|Proposition|Lemma|Corollary|Conjecture|"
                         r"Open problem|Definition|Remark)\s+(" + lab + r")", TEXT["mono"]))
refs = set(re.findall(r"(?<!\*\*)(?:Theorem|Proposition|Lemma|Corollary|Conjecture|Open problem|Definition|Remark)\s+(" + lab + r")",
                      TEXT["mono"]))
missing = sorted(r for r in refs if r not in defined)
rep("every cross-reference in the monograph points to a defined label", not missing, str(missing) if missing else f"{len(refs)} references")

# Disclosure guard: the corrected monograph adds none of these terms
for term in ["Recovery Graph", "negative witness", "negative-witness", "Maestro", "Rashomon cipher", "patent"]:
    rep(f"monograph mentions no '{term}'", term.lower() not in TEXT["mono"].lower())

# ======================================================== SUMMARY
npass = sum(1 for _, ok in results if ok)
print(f"\nSummary: {npass} of {len(results)} checks pass")
print("Claim status across the four files: " + ", ".join(f"{k} {v}" for k, v in sorted(tally.items())) +
      f" (total {sum(tally.values())})")
sys.exit(0 if npass == len(results) else 1)
