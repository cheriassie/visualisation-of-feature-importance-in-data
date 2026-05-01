#!/usr/bin/env python3

import json
import os
import sys
import platform
import datetime
from collections import defaultdict, Counter
from itertools import combinations, count

import numpy as np
import pandas as pd
from sklearn.impute import SimpleImputer

HIT_OBJECTS_IN_MAP = {
    "0": "No object hit on road",
    "1": "Road sign / traffic signal",
    "2": "Lamp post",
    "3": "Tree",
    "4": "Bus stop / bus shelter",
    "5": "Central crash barrier (metal)",
    "6": "Central crash barrier (non-metal)",
    "7": "Nearside crash barrier",
    "8": "Offside crash barrier",
    "9": "Submerged in water",
    "10": "Entered ditch",
    "11": "Other permanent object",
    "12": "Wall or bridge parapet",
}

HIT_OBJECTS_OFF_MAP = {
    "0": "No object hit off road",
    "1": "Road sign / traffic signal",
    "2": "Lamp post",
    "3": "Tree",
    "4": "Bus stop / bus shelter",
    "5": "Central crash barrier (metal)",
    "6": "Central crash barrier (non-metal)",
    "7": "Central crash barrier",
    "8": "Nearside crash barrier",
    "9": "Offside crash barrier",
    "10": "Submerged in water",
    "11": "Entered ditch",
}


def normalize_feature_value(feature_name: str, raw_value: str) -> str:
    """Convert raw ARAXAI coded values to human-readable labels."""
    raw = str(raw_value).strip()

    if feature_name == "Hit_Objects_in":
        parts = raw.replace(",", " ").split()
        labels = [HIT_OBJECTS_IN_MAP.get(p.strip(), p.strip()) for p in parts if p.strip()]
        return " or ".join(labels) if labels else raw

    if feature_name == "Hit_Objects_off":
        parts = raw.replace(",", " ").split()
        labels = [HIT_OBJECTS_OFF_MAP.get(p.strip(), p.strip()) for p in parts if p.strip()]
        return " or ".join(labels) if labels else raw

    if feature_name == "Driver_IMD":
        parts = raw.replace(",", " ").split()
        labels = [f"Band {p.strip()}" for p in parts if p.strip()]
        return " or ".join(labels) if labels else raw

    if feature_name == "Journey":
        # ARAXAI may output "2,Commuting to/from work" or just the description
        if "," in raw:
            parts = raw.split(",", 1)
            if len(parts) == 2 and parts[0].strip().isdigit():
                return parts[1].strip()
        return raw

    if feature_name == "Casualties":
        parts = raw.replace(",", " ").split()
        if "-" in parts:
            idx = parts.index("-")
            if idx > 0:
                return f"{parts[idx - 1]} or more casualties"
        if len(parts) == 1:
            return f"{parts[0]} casualties" if parts[0] != "1" else "1 casualty"
        return " or ".join(parts) + " casualties"

    return raw


def compute_summary(df_original: pd.DataFrame, df_imputed: pd.DataFrame) -> dict:
    missing_counts = df_original.isnull().sum()
    total_missing = int(missing_counts.sum())
    total_cells = df_original.shape[0] * df_original.shape[1]
    total_categories = sum(df_imputed[col].nunique() for col in df_imputed.columns)

    return {
        "total_rows": int(df_original.shape[0]),
        "total_columns": int(df_original.shape[1]),
        "total_categories": int(total_categories),
        "missing_counts": {col: int(v) for col, v in missing_counts.items()},
        "missing_percentages": {
            col: round(float(v) / df_original.shape[0] * 100, 2)
            for col, v in missing_counts.items()
        },
        "unique_counts": {col: int(df_imputed[col].nunique()) for col in df_imputed.columns},
        "total_missing": total_missing,
        "total_missing_percentage": round(total_missing / total_cells * 100, 2) if total_cells else 0,
    }


def compute_attributes(df_imputed: pd.DataFrame, df_original: pd.DataFrame) -> dict:
    attrs = {}
    for col in df_imputed.columns:
        vc = df_imputed[col].value_counts()
        total = len(df_imputed)
        vc_dict = {str(k): int(v) for k, v in vc.items()}
        vc_pct = {str(k): round(float(v) / total * 100, 2) for k, v in vc.items()}

        most_freq = vc.idxmax() if len(vc) > 0 else None
        least_freq = vc.idxmin() if len(vc) > 0 else None
        missing_count = int(df_original[col].isnull().sum())

        attrs[col] = {
            "value_counts": vc_dict,
            "value_counts_percentage": vc_pct,
            "most_frequent": {
                "value": str(most_freq) if most_freq is not None else None,
                "count": int(vc.max()) if len(vc) > 0 else 0,
                "percentage": round(float(vc.max()) / total * 100, 2) if len(vc) > 0 else 0,
            },
            "least_frequent": {
                "value": str(least_freq) if least_freq is not None else None,
                "count": int(vc.min()) if len(vc) > 0 else 0,
                "percentage": round(float(vc.min()) / total * 100, 2) if len(vc) > 0 else 0,
            },
            "missing_count": missing_count,
            "missing_percentage": round(missing_count / total * 100, 2) if total else 0,
            "unique_count": int(df_imputed[col].nunique()),
        }
    return attrs


def compute_correlations(df: pd.DataFrame) -> dict:
    """Compute Cramér's V and related association metrics for all column pairs."""
    columns = list(df.columns)
    metrics = ["cramers_v", "contingency_coefficient", "tschuprows_t", "phi", "chi2", "p_value"]
    matrices = {m: {c: {} for c in columns} for m in metrics}

    try:
        from scipy.stats import chi2_contingency
        from scipy.stats.contingency import association
        has_scipy = True
    except ImportError:
        has_scipy = False
        print("Warning: scipy not installed, correlation metrics will be 0")

    top_pairs = []

    for i, col1 in enumerate(columns):
        for j, col2 in enumerate(columns):
            if i == j:
                for m in metrics:
                    matrices[m][col1][col2] = 1.0 if m not in ("chi2", "p_value") else 0.0
                continue

            ct = pd.crosstab(df[col1], df[col2])
            n = ct.values.sum()
            r, k = ct.shape

            if has_scipy and r > 1 and k > 1:
                chi2_val, p_val, _, _ = chi2_contingency(ct)
                cramers = association(ct, method="cramer")
                tschup = association(ct, method="tschuprow")
                cont_coeff = association(ct, method="pearson")
            else:
                chi2_val, p_val = 0.0, 1.0
                cramers = tschup = cont_coeff = 0.0

            # Phi — valid only for 2×2 tables; undefined for larger contingency tables.
            phi = np.sqrt(chi2_val / n) if n > 0 and r == 2 and k == 2 else float("nan")

            matrices["cramers_v"][col1][col2] = round(float(cramers), 4)
            matrices["contingency_coefficient"][col1][col2] = round(float(cont_coeff), 4)
            matrices["tschuprows_t"][col1][col2] = round(float(tschup), 4)
            matrices["phi"][col1][col2] = round(float(phi), 4)
            matrices["chi2"][col1][col2] = round(float(chi2_val), 4)
            matrices["p_value"][col1][col2] = float(p_val)

            if j > i:
                top_pairs.append({
                    "col1": col1,
                    "col2": col2,
                    "cramers_v": round(float(cramers), 4),
                    "p_value": float(p_val),
                })

    top_pairs.sort(key=lambda x: x["cramers_v"], reverse=True)
    return {"matrices": matrices, "top_pairs": top_pairs}


def rule_to_node(rule, idx="0", value_formatter=None):
    """Convert an ARAXAI rule dict to a tree node for the frontend."""
    parts = []
    for v in rule.get("vars", []):
        varname = v.get("varname", "")
        raw_value = v.get("values_str", "")
        formatted = value_formatter(varname, raw_value) if value_formatter else raw_value
        parts.append(f"{varname}={formatted}")
    label = ", ".join(parts) if parts else "ROOT"

    node = {
        "id": f"n{idx}",
        "label": label,
        "children": [],
        "booster_val": round(rule.get("booster_val", 0), 3),
        "booster_way": rule.get("booster_way", ""),
        "target_ratio": round(rule.get("target_class_ratio", 0), 4),
    }

    vlds = rule.get("valid_level_disp_string", "")
    if "+" in str(vlds):
        node["sign"] = "+" * str(vlds).count("+")

    if rule.get("booster_way") == "x":
        node["correlation"] = "positive"
        node["ratio_subset"] = round(rule.get("booster_val", 0), 3)
    elif rule.get("booster_way") == "/":
        node["correlation"] = "negative"
        node["base"] = round(rule.get("booster_val", 0), 3)

    for i, sub in enumerate(rule.get("sub", [])):
        node["children"].append(rule_to_node(sub, f"{idx}_{i}", value_formatter))

    return node


def compute_feature_importance(rules_list: list) -> dict:
    feature_stats = defaultdict(lambda: {"count": 0, "booster_vals": [], "signs": Counter()})

    def walk(rule, depth=0):
        for v in rule.get("vars", []):
            fname = v.get("varname", "")
            if fname:
                feature_stats[fname]["count"] += 1
                feature_stats[fname]["booster_vals"].append(rule.get("booster_val", 0))
                vlds = str(rule.get("valid_level_disp_string", ""))
                sign_count = vlds.count("+")
                if sign_count > 0:
                    feature_stats[fname]["signs"]["+" * min(sign_count, 3)] += 1
        for sub in rule.get("sub", []):
            walk(sub, depth + 1)

    for rule in rules_list:
        walk(rule)

    if not feature_stats:
        return {"features": {}, "total_rules": len(rules_list)}

    max_count = max(fs["count"] for fs in feature_stats.values())

    features_out = {}
    for fname, fs in feature_stats.items():
        bvals = fs["booster_vals"]
        features_out[fname] = {
            "count": fs["count"],
            "frequency": round(fs["count"] / len(rules_list), 4) if rules_list else 0,
            "normalized_importance": round(fs["count"] / max_count, 4) if max_count else 0,
            "avg_ratio": round(float(np.mean(bvals)), 4) if bvals else 0,
            "max_ratio": round(float(np.max(bvals)), 4) if bvals else 0,
            "signs": {
                "+": fs["signs"].get("+", 0),
                "++": fs["signs"].get("++", 0),
                "+++": fs["signs"].get("+++", 0),
            },
        }

    return {"features": features_out, "total_rules": len(rules_list)}


def compute_chord_data(rules_list: list) -> dict:
    all_features = set()
    pair_counts = Counter()

    def extract_features(rule):
        feats = set()
        for v in rule.get("vars", []):
            fname = v.get("varname", "")
            if fname:
                feats.add(fname)
        for sub in rule.get("sub", []):
            feats.update(extract_features(sub))
        return feats

    for rule in rules_list:
        feats = extract_features(rule)
        all_features.update(feats)
        for a, b in combinations(sorted(feats), 2):
            pair_counts[(a, b)] += 1

    features = sorted(all_features)
    n = len(features)
    feat_idx = {f: i for i, f in enumerate(features)}
    matrix = [[0] * n for _ in range(n)]

    for (a, b), count in pair_counts.items():
        i, j = feat_idx[a], feat_idx[b]
        matrix[i][j] = count
        matrix[j][i] = count

    pairs = [
        {"source": a, "target": b, "value": c}
        for (a, b), c in sorted(pair_counts.items(), key=lambda x: -x[1])
    ]

    return {"features": features, "matrix": matrix, "pairs": pairs}


class TrieNode:
    def __init__(self, id: str, condition="", feature_name=None, feature_value=None,
                 booster_val=None, booster_way=None, target_ratio=None,
                 baseline_ratio=None, support=None, depth=0, correlation=None):
        self.id = id
        self.condition = condition
        self.feature_name = feature_name
        self.feature_value = feature_value
        self.booster_val = booster_val
        self.booster_way = booster_way
        self.target_ratio = target_ratio
        self.baseline_ratio = baseline_ratio
        self.support = support
        self.depth = depth
        self.correlation = correlation
        self.children = []

    def find_child(self, condition):
        for c in self.children:
            if c.condition == condition:
                return c
        return None

    def to_dict(self):
        return {
            "id": self.id,
            "label": self.condition,
            "feature_name": self.feature_name,
            "feature_value": self.feature_value,
            "booster_val": self.booster_val,
            "booster_way": self.booster_way,
            "target_ratio": self.target_ratio,
            "baseline_ratio": self.baseline_ratio,
            "support": self.support,
            "depth": self.depth,
            "correlation": self.correlation,
            "children": [c.to_dict() for c in self.children],
        }


def build_coral_tree(rules_list: list, baseline_ratio: float, value_formatter=None) -> dict:
    """Build a prefix trie from all ARAXAI rules, rooted at the Fatal class."""
    node_id = count(1)
    root = TrieNode(id="0", condition="Fatal", baseline_ratio=baseline_ratio, depth=0)

    def insert_rule(node, rule, depth):
        for v in rule.get("vars", []):
            fname = v.get("varname", "")
            raw_val = v.get("values_str", "")
            formatted = value_formatter(fname, raw_val) if value_formatter else raw_val
            cond = f"{fname}={formatted}"
            existing = node.find_child(cond)

            bval = rule.get("booster_val", 0)
            bway = rule.get("booster_way", "")
            tr = rule.get("target_class_ratio", 0)
            corr = "positive" if bway == "x" else ("negative" if bway == "/" else None)
            fft = rule.get("fft", [0])
            sup = fft[0] if isinstance(fft, list) and len(fft) > 0 else None

            if existing:
                if bval and (existing.booster_val is None or bval > existing.booster_val):
                    existing.booster_val = round(bval, 3) if bval else None
                    existing.booster_way = bway
                    existing.target_ratio = round(tr, 4) if tr else None
                    existing.correlation = corr
                    if sup is not None:
                        existing.support = int(sup)
                child_node = existing
            else:
                child_node = TrieNode(
                    id=str(next(node_id)),
                    condition=cond,
                    feature_name=fname,
                    feature_value=formatted,
                    booster_val=round(bval, 3) if bval else None,
                    booster_way=bway if bway else None,
                    target_ratio=round(tr, 4) if tr else None,
                    baseline_ratio=baseline_ratio,
                    support=int(sup) if sup is not None else None,
                    depth=depth + 1,
                    correlation=corr,
                )
                node.children.append(child_node)

            for sub in rule.get("sub", []):
                insert_rule(child_node, sub, depth + 1)

    for rule in rules_list:
        insert_rule(root, rule, 0)

    return root.to_dict()


def extract_coral_rules(rules_list: list, baseline_ratio: float,
                        importance_map: dict, value_formatter=None) -> list:
    coral_rules = []

    def extract_path(rule, parent_features=None):
        if parent_features is None:
            parent_features = []

        features = list(parent_features)
        original_order = list(parent_features)
        for v in rule.get("vars", []):
            fname = v.get("varname", "")
            if fname:
                raw_val = v.get("values_str", "")
                formatted = value_formatter(fname, raw_val) if value_formatter else raw_val
                feat_label = f"{fname}={formatted}"
                if feat_label not in features:
                    features.append(feat_label)
                    original_order.append(feat_label)

        bval = rule.get("booster_val", 0) or 0
        bway = rule.get("booster_way", "")
        tr = rule.get("target_class_ratio", 0) or 0
        lift = rule.get("lift", 0) or 0
        fft = rule.get("fft", [0])
        sup = int(fft[0]) if isinstance(fft, list) and len(fft) > 0 else 0

        vlds = str(rule.get("valid_level_disp_string", ""))
        sign_count = vlds.count("+")

        corr = "positive" if bway == "x" else ("negative" if bway == "/" else None)
        ratio_change = bval if bway == "x" else (1.0 / bval if bway == "/" and bval else 0)

        sorted_features = sorted(
            features,
            key=lambda f: importance_map.get(f.split("=")[0], 0),
            reverse=True,
        )

        if features:
            coral_rules.append({
                "features": sorted_features,
                "original_order": original_order,
                "strength": round(bval, 3),
                "booster_val": round(bval, 3),
                "booster_way": bway if bway else None,
                "lift": round(float(lift), 4),
                "target_ratio": round(float(tr), 4),
                "baseline_ratio": round(baseline_ratio, 4),
                "ratio_change": round(float(ratio_change), 4),
                "support": sup,
                "confidence": round(float(tr), 4),
                "sign": sign_count,
                "correlation": corr,
            })

        for sub in rule.get("sub", []):
            extract_path(sub, features)

    for rule in rules_list:
        extract_path(rule)

    return coral_rules


def compute_rule_analytics(rules_list: list) -> dict:
    booster_vals = []
    signs = []
    depths = []
    base_vals = []

    def walk(rule, depth=0):
        bval = rule.get("booster_val", 0)
        bway = rule.get("booster_way", "")
        vlds = str(rule.get("valid_level_disp_string", ""))
        sign_count = vlds.count("+")

        if bway == "/" and sign_count == 0:
            signs.append(0)
            if bval:
                base_vals.append(bval)
        else:
            signs.append(sign_count)

        if bval:
            booster_vals.append(bval)
        depths.append(depth)

        for sub in rule.get("sub", []):
            walk(sub, depth + 1)

    for rule in rules_list:
        walk(rule)

    sc = Counter(signs)

    return {
        "total_rules": len(rules_list),
        "total_nodes": len(depths),
        "ratio_stats": {
            "count": len(booster_vals),
            "mean": round(float(np.mean(booster_vals)), 4) if booster_vals else 0,
            "median": round(float(np.median(booster_vals)), 4) if booster_vals else 0,
            "min": round(float(np.min(booster_vals)), 4) if booster_vals else 0,
            "max": round(float(np.max(booster_vals)), 4) if booster_vals else 0,
        },
        "sign_distribution": {
            "plus": sc.get(1, 0),
            "plus_plus": sc.get(2, 0),
            "plus_plus_plus": sum(sc.get(k, 0) for k in sc if k >= 3),
            "divisor": sc.get(0, 0),
        },
        "depth_stats": {
            "mean": round(float(np.mean(depths)), 4) if depths else 0,
            "min": int(np.min(depths)) if depths else 0,
            "max": int(np.max(depths)) if depths else 0,
        },
        "base_stats": {
            "count": len(base_vals),
            "mean": round(float(np.mean(base_vals)), 4) if base_vals else 0,
            "min": round(float(np.min(base_vals)), 4) if base_vals else 0,
            "max": round(float(np.max(base_vals)), 4) if base_vals else 0,
        },
    }


def main():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_path = os.path.join(project_root, "accidents.zip")
    output_dir = os.path.join(project_root, "public")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "output.json")
    raw_output_path = os.path.join(output_dir, "araxai_raw.json")

    print("Loading data...")
    df = pd.read_csv(data_path, encoding="cp1250", sep="\t")
    selected_cols = [
        "Driver_Age_Band", "Driver_IMD", "Sex", "Journey",
        "Hit_Objects_in", "Hit_Objects_off", "Casualties", "Severity",
    ]
    df = df[selected_cols]
    df_original = df.copy()
    print(f"  {len(df)} rows, {len(df.columns)} columns")

    print("Imputing missing values...")
    total_missing_before = int(df.isnull().sum().sum())
    imputer = SimpleImputer(strategy="most_frequent")
    df_imputed = pd.DataFrame(imputer.fit_transform(df), columns=df.columns)

    for col in df.columns:
        try:
            df_imputed[col] = df_imputed[col].astype(df_original[col].dropna().dtype)
        except (ValueError, TypeError):
            pass

    total_missing_after = int(df_imputed.isnull().sum().sum())
    print(f"  Missing before: {total_missing_before}, after: {total_missing_after}")

    print("Computing statistics...")
    summary = compute_summary(df_original, df_imputed)
    attributes = compute_attributes(df_imputed, df_original)
    print("  Computing correlations (this may take a moment)...")
    correlations = compute_correlations(df_imputed)

    print("Running ARAXAI...")
    from araxai import ara
    a = ara(df=df_imputed, target="Severity", target_class="Fatal",
            options={"min_base": 1, "max_depth": 2})
    results = a.get_results()

    rules_list = results.get("rules", [])
    baseline_ratio = results.get("target_class_ratio", 0.0192)
    target_var_profile = results.get("target_var_profile", {})
    print(f"  {len(rules_list)} rules, baseline ratio: {baseline_ratio:.4f}")

    try:
        with open(raw_output_path, "w") as f:
            json.dump(results, f, indent=2, default=str)
    except Exception as e:
        print(f"  Warning: could not save raw output: {e}")

    print("Converting rules...")
    rules_output = []
    for idx, rule in enumerate(rules_list):
        root_node = rule_to_node(rule, f"r{idx+1}_0", normalize_feature_value)
        rules_output.append({
            "id": f"r{idx+1}",
            "title": f"ARAXAI Rule {idx + 1}",
            "root": root_node,
        })

    print("Computing feature importance...")
    feature_importance = compute_feature_importance(rules_list)

    importance_map = {
        fname: fdata["normalized_importance"]
        for fname, fdata in feature_importance["features"].items()
    }

    print("Computing chord data...")
    chord_data = compute_chord_data(rules_list)

    print("Building coral prefix tree...")
    coral_tree = build_coral_tree(rules_list, baseline_ratio, normalize_feature_value)

    print("Extracting coral rule paths...")
    coral_rules = extract_coral_rules(rules_list, baseline_ratio, importance_map, normalize_feature_value)

    print("Computing rule analytics...")
    rule_analytics = compute_rule_analytics(rules_list)

    print("Assembling output...")
    try:
        import araxai as araxai_mod
        araxai_ver = getattr(araxai_mod, "__version__", "unknown")
    except Exception:
        araxai_ver = "unknown"

    output = {
        "metadata": {
            "generated_at": datetime.datetime.now().isoformat(),
            "python_version": platform.python_version(),
            "pandas_version": pd.__version__,
            "numpy_version": np.__version__,
            "araxai_version": araxai_ver,
            "data_preprocessing": {
                "imputation_strategy": "most_frequent",
                "missing_values_before": total_missing_before,
                "missing_values_after": total_missing_after,
            },
            "araxai_parameters": {"min_base": 1, "max_depth": 2},
            "dataset_info": {
                "total_rows": int(df_original.shape[0]),
                "total_columns": int(df_original.shape[1]),
                "columns": list(df_original.columns),
            },
        },
        "target_info": {
            "target_class": "Fatal",
            "baseline_ratio": round(float(baseline_ratio), 4),
            "target_var_profile": {str(k): int(v) for k, v in target_var_profile.items()},
        },
        "summary": summary,
        "attributes": attributes,
        "correlations": correlations,
        "rules": rules_output,
        "feature_importance": feature_importance,
        "rule_analytics": rule_analytics,
        "chord_data": chord_data,
        "coral_rules": coral_rules,
        "coral_tree": coral_tree,
    }

    def sanitize(obj):
        if isinstance(obj, float) and (obj != obj):
            return None
        if isinstance(obj, dict):
            return {k: sanitize(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [sanitize(v) for v in obj]
        return obj

    with open(output_path, "w") as f:
        json.dump(sanitize(output), f, indent=2, default=str)

    print(f"\nDone. Output written to {output_path}")
    print(f"File size: {os.path.getsize(output_path) / (1024 * 1024):.1f} MB")


if __name__ == "__main__":
    main()
