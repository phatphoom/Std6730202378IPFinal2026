/**
 * 1D K-Means Clustering (k = 3) for Salary Analysis
 *
 * Requirements:
 * - Pure function
 * - Deterministic initial centroids (min, median, max of sorted values)
 * - Limit iterations (max 100), stop early when centroids do not change
 * - Handles: 0 values, fewer than 3 values, fewer than 3 distinct values, empty clusters
 * - Sort clusters ascending by centroid, named Tier 1, Tier 2, Tier 3
 * - Round centroid to 2 decimals, count as integer
 *
 * @param {number[]} values - Array of numbers (salaries)
 * @param {number} k - Number of clusters (default 3)
 * @returns {Array<{ group: string, centroid: number, count: number }>}
 */
function kmeans1D(values, k = 3) {
  // Filter and sanitize valid positive numbers
  const nums = (values || [])
    .map(Number)
    .filter((v) => Number.isFinite(v) && v >= 0)
    .sort((a, b) => a - b);

  const n = nums.length;

  // Edge case: empty data
  if (n === 0) {
    return Array.from({ length: k }, (_, i) => ({
      group: `Tier ${i + 1}`,
      centroid: 0,
      count: 0,
    }));
  }

  // Edge case: fewer items than k
  if (n < k) {
    const result = [];
    for (let i = 0; i < k; i++) {
      if (i < n) {
        result.push({
          group: `Tier ${i + 1}`,
          centroid: Math.round(nums[i] * 100) / 100,
          count: 1,
        });
      } else {
        result.push({
          group: `Tier ${i + 1}`,
          centroid: Math.round(nums[n - 1] * 100) / 100,
          count: 0,
        });
      }
    }
    return result;
  }

  // 1. Initial centroids: deterministic (min, median, max)
  let centroids = [];
  if (k === 3) {
    const min = nums[0];
    const median = nums[Math.floor(n / 2)];
    const max = nums[n - 1];
    centroids = [min, median, max];
  } else {
    // General case for deterministic spread
    for (let i = 0; i < k; i++) {
      const idx = Math.floor((i / (k - 1 || 1)) * (n - 1));
      centroids.push(nums[idx]);
    }
  }

  const MAX_ITER = 100;
  let iterations = 0;

  while (iterations < MAX_ITER) {
    iterations++;

    // Assign points to nearest centroid
    const clusters = Array.from({ length: k }, () => []);

    for (const val of nums) {
      let bestDist = Infinity;
      let bestIndex = 0;

      for (let i = 0; i < k; i++) {
        const dist = Math.abs(val - centroids[i]);
        if (dist < bestDist) {
          bestDist = dist;
          bestIndex = i;
        }
      }
      clusters[bestIndex].push(val);
    }

    // Recompute centroids
    let changed = false;
    const newCentroids = [];

    for (let i = 0; i < k; i++) {
      if (clusters[i].length === 0) {
        // Keep previous centroid to avoid divide-by-zero
        newCentroids.push(centroids[i]);
      } else {
        const sum = clusters[i].reduce((acc, curr) => acc + curr, 0);
        const mean = sum / clusters[i].length;
        if (Math.abs(mean - centroids[i]) > 0.0001) {
          changed = true;
        }
        newCentroids.push(mean);
      }
    }

    centroids = newCentroids;

    if (!changed) {
      break;
    }
  }

  // Final assignment to get counts
  const finalClusters = Array.from({ length: k }, () => []);
  for (const val of nums) {
    let bestDist = Infinity;
    let bestIndex = 0;
    for (let i = 0; i < k; i++) {
      const dist = Math.abs(val - centroids[i]);
      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = i;
      }
    }
    finalClusters[bestIndex].push(val);
  }

  // Build cluster objects and sort ascending by centroid
  const formatted = centroids
    .map((c, i) => ({
      centroid: Math.round(c * 100) / 100,
      count: finalClusters[i].length,
    }))
    .sort((a, b) => a.centroid - b.centroid);

  // Name Tier 1 to Tier k
  return formatted.map((item, index) => ({
    group: `Tier ${index + 1}`,
    centroid: item.centroid,
    count: item.count,
  }));
}

module.exports = { kmeans1D };
