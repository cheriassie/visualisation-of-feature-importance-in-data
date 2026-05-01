export type Summary = {
  total_rows: number;
  total_columns: number;
  total_categories: number;
  missing_counts: Record<string, number>;
  missing_percentages: Record<string, number>;
  unique_counts: Record<string, number>;
  total_missing: number;
  total_missing_percentage: number;
};

export type OutputMetadata = {
  generated_at: string;
  python_version: string;
  pandas_version: string;
  numpy_version: string;
  araxai_version: string;
  data_preprocessing: {
    imputation_strategy: string;
    missing_values_before: number;
    missing_values_after: number;
  };
  araxai_parameters: {
    min_base: number;
    max_depth: number;
  };
  dataset_info: {
    total_rows: number;
    total_columns: number;
    columns: string[];
  };
};

export type Attribute = {
  value_counts: Record<string, number>;
  value_counts_percentage: Record<string, number>;
  most_frequent: { value: string | null; count: number; percentage: number };
  least_frequent: { value: string | null; count: number; percentage: number };
  missing_count: number;
  missing_percentage: number;
  unique_count: number;
};

export type Attributes = Record<string, Attribute>;

export type CorrelationMatrices = {
  matrices: {
    cramers_v: Record<string, Record<string, number>>;
    contingency_coefficient: Record<string, Record<string, number>>;
    tschuprows_t: Record<string, Record<string, number>>;
    phi: Record<string, Record<string, number>>;
    chi2: Record<string, Record<string, number>>;
    p_value: Record<string, Record<string, number>>;
  };
  top_pairs: Array<{
    col1: string;
    col2: string;
    cramers_v: number;
    p_value: number;
  }>;
};

export type TreeNode = {
  id: string;
  label: string;
  base?: number;
  sign?: string;
  ratio_subset?: number;
  booster_val?: number;
  booster_way?: "x" | "/";
  target_ratio?: number;
  correlation?: "positive" | "negative";
  children?: TreeNode[];
};

export type Rule = {
  id: string;
  title: string;
  root: TreeNode;
};

export type FeatureImportance = {
  features: Record<
    string,
    {
      count: number;
      frequency: number;
      normalized_importance: number;
      avg_ratio: number;
      max_ratio: number;
      signs: { "+": number; "++": number; "+++": number };
    }
  >;
  total_rules: number;
};

export type RuleAnalytics = {
  total_rules: number;
  total_nodes: number;
  ratio_stats: {
    count: number;
    mean: number;
    median: number;
    min: number;
    max: number;
  };
  sign_distribution: {
    plus: number;
    plus_plus: number;
    plus_plus_plus: number;
    divisor: number;
  };
  depth_stats: { mean: number; max: number; min: number };
  base_stats: { count: number; mean: number; min: number; max: number };
};

export type ChordData = {
  features: string[];
  matrix: number[][];
  pairs: Array<{ source: string; target: string; value: number }>;
};

export type CoralRule = {
  features: string[];
  original_order: string[];
  strength: number;
  lift: number;
  base?: number;
  support: number;
  confidence: number;
  sign: number;
  booster_val?: number;
  booster_way?: "x" | "/";
  target_ratio?: number;
  baseline_ratio?: number;
  ratio_change?: number;
  correlation?: "positive" | "negative";
};

export type CoralTreeNode = {
  id: string;
  label: string;
  feature_name: string | null;
  feature_value: string | null;
  booster_val: number | null;
  booster_way: "x" | "/" | null;
  target_ratio: number | null;
  baseline_ratio: number | null;
  support: number | null;
  depth: number;
  correlation: "positive" | "negative" | null;
  children: CoralTreeNode[];
};

export type Output = {
  metadata?: OutputMetadata;
  summary: Summary;
  attributes: Attributes;
  correlations: CorrelationMatrices;
  rules: Rule[];
  feature_importance?: FeatureImportance;
  rule_analytics?: RuleAnalytics;
  chord_data?: ChordData;
  coral_rules?: CoralRule[];
  coral_tree?: CoralTreeNode;
  target_info?: {
    target_class: string;
    baseline_ratio: number;
    target_var_profile: Record<string, number>;
  };
};

export type Tab =
  | "summary"
  | "attributes"
  | "correlations"
  | "feature-importance"
  | "rule-analytics"
  | "chord";
