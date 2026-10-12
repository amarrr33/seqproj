from collections import defaultdict

class PrefixSpanEngine:
    def __init__(self, sequences, min_support_ratio=0.2):
        """
        sequences: List of list of strings, e.g. [["C1", "C2", "C3"], ["C1", "C3"], ...]
        min_support_ratio: Float threshold, e.g., 0.2 (20% of total trajectories)
        """
        self.sequences = [seq for seq in sequences if len(seq) > 0]
        self.total_db_size = len(self.sequences)
        self.min_support_count = max(1, int(self.total_db_size * min_support_ratio))
        self.patterns = []

    def _get_frequent_items(self, projected_db):
        item_counts = defaultdict(int)
        for seq in projected_db:
            seen_in_seq = set()
            for item in seq:
                if item not in seen_in_seq:
                    item_counts[item] += 1
                    seen_in_seq.add(item)
        return {item: count for item, count in item_counts.items() if count >= self.min_support_count}

    def _project_db(self, projected_db, prefix_item):
        new_projected = []
        for seq in projected_db:
            try:
                idx = seq.index(prefix_item)
                suffix = seq[idx + 1:]
                if suffix:
                    new_projected.append(suffix)
            except ValueError:
                continue
        return new_projected

    def _prefixspan_recursive(self, prefix, projected_db):
        frequent_items = self._get_frequent_items(projected_db)
        for item, count in frequent_items.items():
            new_prefix = prefix + [item]
            self.patterns.append({
                "pattern": new_prefix,
                "support": count,
                "support_ratio": round(count / float(self.total_db_size), 3)
            })
            new_proj = self._project_db(projected_db, item)
            if new_proj:
                self._prefixspan_recursive(new_prefix, new_proj)

    def run(self):
        self.patterns = []
        if self.total_db_size == 0:
            return []

        self._prefixspan_recursive([], self.sequences)

        # Filter out patterns of length 1 to focus on multi-step routines, or include all length >= 2
        frequent_patterns = [p for p in self.patterns if len(p["pattern"]) >= 2]

        # Sort by support count desc, then length desc
        frequent_patterns.sort(key=lambda x: (x["support"], len(x["pattern"])), reverse=True)

        # Calculate Confidence & Explanations
        pattern_lookup = {" -> ".join(p["pattern"]): p["support"] for p in self.patterns}
        results = []

        for item in frequent_patterns:
            seq_arr = item["pattern"]
            seq_str = " -> ".join(seq_arr)
            prefix_arr = seq_arr[:-1]
            prefix_str = " -> ".join(prefix_arr)

            prefix_sup = pattern_lookup.get(prefix_str, self.total_db_size)
            conf = round(item["support"] / float(prefix_sup), 3) if prefix_sup > 0 else 1.0

            explanation = (
                f"Sequential pattern [{seq_str}] was mined using PrefixSpan with support count {item['support']} "
                f"({item['support_ratio']*100:.1f}% of total {self.total_db_size} trips) "
                f"and transition confidence of {conf*100:.1f}% following antecedent [{prefix_str}]."
            )

            results.append({
                "pattern_sequence": seq_str,
                "pattern_length": len(seq_arr),
                "support_count": item["support"],
                "support_ratio": item["support_ratio"],
                "confidence_score": conf,
                "explanation": explanation
            })

        return results

def mine_sequential_patterns(trajectory_sequences, min_support_ratio=0.2):
    engine = PrefixSpanEngine(trajectory_sequences, min_support_ratio=min_support_ratio)
    return engine.run()
