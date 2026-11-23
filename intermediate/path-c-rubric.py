"""Path C (Note 3) rubric recompute: weighted scores, ranks, and a carbon-weight sweep.
Scores are stylised 1-5 judgements per criteria group, stated in Note 3 section 4."""
G = ["Carbon", "Ecological", "Legal", "Social", "Non-carbon", "Finance"]
A = {
    "(i) Pond restoration":        [4, 3, 3, 3, 3, 2],
    "(ii) CFi mangrove conserve":  [2, 4, 3, 4, 5, 4],
    "(iii) Seagrass in MFMA":      [1, 3, 4, 3, 5, 3],
    "(iv) MNP mixed":              [3, 4, 2, 3, 5, 3],
}
W = {
    "Carbon-heavy":     [35, 15, 15, 10, 10, 15],
    "Balanced":         [20, 15, 20, 15, 15, 15],
    "Non-carbon-heavy": [10, 15, 15, 20, 30, 10],
}
for k, w in W.items():
    assert sum(w) == 100, k
    res = {a: sum(s * x for s, x in zip(sc, w)) / 100 for a, sc in A.items()}
    print(f"\n{k} {w}")
    for r, (a, v) in enumerate(sorted(res.items(), key=lambda t: -t[1]), 1):
        print(f"  {r}. {a}: {v:.2f}")
# Sweep: carbon weight c, other groups share (100-c) in the Balanced proportions
base = W["Balanced"][1:]
print("\nCarbon-weight sweep (other weights scaled from Balanced):")
prev = None
for c in range(0, 61, 5):
    rest = [b * (100 - c) / sum(base) for b in base]
    w = [c] + rest
    res = {a: sum(s * x for s, x in zip(sc, w)) / 100 for a, sc in A.items()}
    order = [a.split()[0] for a, _ in sorted(res.items(), key=lambda t: -t[1])]
    print(f"  carbon {c:>2}%: " + " > ".join(f"{o}" for o in order), " | ", ", ".join(f"{a.split()[0]} {v:.2f}" for a, v in res.items()))

# One-point perturbation: move each single group score by +/-1 (bounded 1-5); report top-rank changes per weight set
print("\nOne-point perturbation (single score moved +/-1):")
for k, w in W.items():
    base_res = {a: sum(s * x for s, x in zip(sc, w)) / 100 for a, sc in A.items()}
    top = max(base_res, key=base_res.get)
    flips, total = [], 0
    for a, sc in A.items():
        for gi in range(6):
            for d in (-1, 1):
                v = sc[gi] + d
                if not 1 <= v <= 5:
                    continue
                total += 1
                s2 = dict(A); s2[a] = sc[:gi] + [v] + sc[gi + 1:]
                r = {b: sum(s * x for s, x in zip(t, w)) / 100 for b, t in s2.items()}
                srt = sorted(r.items(), key=lambda t: -t[1])
                newtop, margin = srt[0][0], srt[0][1] - srt[1][1]
                if newtop != top or margin < 0.10:
                    flips.append(f"{a.split()[0]} {G[gi]} {d:+d} -> top {newtop.split()[0]} margin {margin:.2f}")
    print(f"  {k}: base top {top.split()[0]}; {len(flips)} of {total} single moves change the top or leave it within 0.10")
    for f in flips: print("     ", f)
