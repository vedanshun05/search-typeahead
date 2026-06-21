const fs = require('fs');
const path = require('path');

const seedQueries = [
  'iphone', 'samsung', 'laptop', 'headphones', 'earbuds',
  'java', 'javascript', 'python', 'react', 'next.js',
  'node.js', 'typescript', 'docker', 'kubernetes', 'aws',
  'azure', 'gcp', 'machine learning', 'deep learning', 'artificial intelligence',
  'chatgpt', 'openai', 'llama', 'git', 'sql',
  'redis', 'linux', 'vim', 'vscode', 'web development',
  'system design', 'data structures', 'leetcode', 'interview questions',
  'weather', 'news', 'cricket', 'football', 'basketball',
  'tennis', 'movies', 'netflix', 'youtube', 'spotify',
  'amazon', 'flipkart', 'uber', 'zomato', 'travel',
  'banking', 'loan', 'insurance', 'tax', 'stock market',
  'cryptocurrency', 'pizza', 'burger', 'restaurants', 'fitness',
  'recipes', 'university', 'online courses', 'udemy', 'coursera',
];

const words = [
  'tutorial', 'guide', 'online', 'near me', 'price', 'review', 'tips',
  'best', 'top', 'cheap', 'what is', 'how to', 'free', 'download',
  'certification', 'course', 'training', 'examples', 'interview',
  'for beginners', 'advanced', 'pro', 'max', 'ultra', 'lite',
  '2025', '2026', 'latest', 'new', 'upcoming', 'trending',
];

function randomCount() {
  var r = Math.random();
  if (r < 0.01) return Math.floor(Math.random() * 900000 + 100000);  // top 1% - very popular
  if (r < 0.05) return Math.floor(Math.random() * 90000 + 10000);     // next 4%
  if (r < 0.15) return Math.floor(Math.random() * 9000 + 1000);       // next 10%
  if (r < 0.35) return Math.floor(Math.random() * 900 + 100);         // next 20%
  return Math.floor(Math.random() * 90 + 10);                          // bottom 65%
}

var seen = {};
var output = 'query\tcount\n';

// Generate base queries + their variations
for (var i = 0; i < seedQueries.length; i++) {
  var base = seedQueries[i];

  var entries = [];

  // Direct query
  entries.push([base, randomCount()]);

  // With each word as suffix
  for (var j = 0; j < words.length; j++) {
    entries.push([base + ' ' + words[j], randomCount()]);
  }

  // Word as prefix
  var prefixes = words.slice(0, 8);
  for (var j = 0; j < prefixes.length; j++) {
    entries.push([prefixes[j] + ' ' + base, randomCount()]);
  }

  // Two-word combinations
  for (var j = 0; j < Math.min(12, words.length); j++) {
    for (var k = j + 1; k < Math.min(j + 4, words.length); k++) {
      entries.push([base + ' ' + words[j] + ' ' + words[k], randomCount()]);
    }
  }

  for (var e = 0; e < entries.length; e++) {
    var key = entries[e][0].toLowerCase();
    if (!seen[key]) {
      seen[key] = true;
      output += entries[e][0] + '\t' + entries[e][1] + '\n';
    }
  }
}

// Add completely random 3-4 word queries to fill up
var allWords = seedQueries.concat(words);
for (var i = 0; i < 150000; i++) {
  var q = '';
  var len = Math.floor(Math.random() * 3) + 2;
  for (var j = 0; j < len; j++) {
    q += allWords[Math.floor(Math.random() * allWords.length)] + ' ';
  }
  q = q.trim();
  var key = q.toLowerCase();
  if (!seen[key]) {
    seen[key] = true;
    output += q + '\t' + randomCount() + '\n';
  }
}

const outputPath = path.join(__dirname, '../dataset/queries.tsv');
fs.writeFileSync(outputPath, output);

var count = output.trim().split('\n').length - 1;
console.log('Generated ' + count + ' queries -> ' + outputPath);
