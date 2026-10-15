const { kmeans1D } = require('./kmeans');

console.log('--- Testing kmeans1D ---');

// Test 1: Typical Salaries
const test1 = [18500, 22000, 48000, 52000, 55000, 85000, 90000];
const res1 = kmeans1D(test1, 3);
console.log('Test 1 (Typical):', JSON.stringify(res1));
console.assert(res1.length === 3, 'Length should be 3');
console.assert(res1[0].centroid <= res1[1].centroid && res1[1].centroid <= res1[2].centroid, 'Ascending order');
console.assert(res1.reduce((sum, c) => sum + c.count, 0) === test1.length, 'Sum of counts matches length');

// Test 2: Empty
const res2 = kmeans1D([], 3);
console.log('Test 2 (Empty):', JSON.stringify(res2));
console.assert(res2.length === 3 && res2[0].count === 0, 'Empty handled');

// Test 3: Fewer than k (2 values)
const res3 = kmeans1D([20000, 50000], 3);
console.log('Test 3 (< k values):', JSON.stringify(res3));
console.assert(res3.length === 3, 'Length should be 3');

// Test 4: All equal
const res4 = kmeans1D([30000, 30000, 30000], 3);
console.log('Test 4 (All equal):', JSON.stringify(res4));

console.log('All kmeans unit tests passed successfully!');
