import * as fs from 'fs';
import * as path from 'path';

const topics: Record<string, string[]> = {
  tech: [
    'react', 'node', 'typescript', 'javascript', 'python', 'docker', 'kubernetes',
    'aws', 'azure', 'gcp', 'git', 'linux', 'mongodb', 'postgresql', 'redis',
    'graphql', 'rest api', 'nextjs', 'vue', 'angular', 'svelte', 'deno',
    'rust', 'go', 'swift', 'kotlin', 'flutter', 'react native', 'electron',
    'webpack', 'vite', 'babel', 'eslint', 'prettier', 'jest', 'cypress',
    'playwright', 'selenium', 'terraform', 'ansible', 'jenkins', 'github actions',
    'ci/cd', 'microservices', 'serverless', 'websocket', 'oauth', 'jwt',
    'nginx', 'apache', 'tailwindcss', 'bootstrap', 'sass', 'css', 'html5',
    'webassembly', 'three.js', 'd3.js', 'chart.js', 'socket.io',
    'express', 'fastify', 'django', 'flask', 'spring boot', 'rails',
    'laravel', 'symfony', 'asp.net', 'rabbitmq', 'kafka', 'elasticsearch',
    'datadog', 'prometheus', 'grafana', 'jaeger', 'opentelemetry', 'grpc',
    'prisma', 'typeorm', 'sequelize', 'mongoose', 'firebase', 'supabase',
    'netlify', 'vercel', 'heroku', 'digitalocean', 'react query', 'redux',
    'styled-components', 'framer-motion', 'apollo', 'nx', 'turborepo',
  ],
  devops: [
    'terraform', 'ansible', 'chef', 'puppet', 'packer',
    'vagrant', 'docker compose', 'docker swarm', 'nomad', 'consul',
    'vault', 'argocd', 'flux', 'helm', 'istio', 'linkerd', 'envoy',
    'traefik', 'haproxy', 'cloudformation', 'pulumi', 'kustomize',
  ],
  education: [
    'leetcode', 'hackerrank', 'codewars', 'codeforces', 'topcoder',
    'udemy', 'coursera', 'edx', 'pluralsight', 'udacity', 'datacamp',
    'khan academy', 'freecodecamp', 'the odin project', 'codecademy',
    'mit ocw', 'cs50', 'system design interview', 'algorithms',
    'data structures', 'machine learning', 'deep learning', 'nlp',
    'computer vision', 'blockchain', 'solidity', 'smart contracts',
  ],
  gadgets: [
    'iphone', 'samsung', 'google pixel', 'oneplus', 'xiaomi', 'oppo',
    'vivo', 'realme', 'motorola', 'nokia', 'sony', 'lg',
    'ipad', 'samsung tablet', 'macbook', 'dell xps', 'thinkpad',
    'surface pro', 'airpods', 'galaxy buds', 'pixel buds',
    'apple watch', 'galaxy watch', 'fitbit', 'garmin',
    'playstation', 'xbox', 'nintendo switch', 'steam deck',
  ],
  programming: [
    'vscode', 'vim', 'neovim', 'emacs', 'intellij', 'webstorm',
    'pycharm', 'goland', 'sublime text', 'atom',
    'git', 'github', 'gitlab', 'bitbucket', 'svn',
    'bash', 'zsh', 'fish shell', 'powershell', 'terminal',
    'npm', 'yarn', 'pnpm', 'bun', 'pip', 'cargo',
    'sql', 'nosql', 'orm', 'acid', 'cap theorem',
    'rest', 'graphql', 'soap', 'grpc', 'websocket',
    'tdd', 'bdd', 'design patterns', 'clean architecture',
  ],
  travel: [
    'hotels', 'flights', 'vacation', 'backpacking', 'road trip',
    'travel insurance', 'visa', 'passport', 'airbnb', 'booking.com',
    'expedia', 'skyscanner', 'kayak', 'tripadvisor',
    'tokyo', 'paris', 'london', 'new york', 'bali', 'thailand',
    'japan', 'italy', 'spain', 'australia', 'iceland', 'switzerland',
    'hiking', 'camping', 'hostel', 'resort', 'all inclusive',
    'solo travel', 'family vacation', 'budget travel', 'luxury travel',
  ],
  food: [
    'recipes', 'keto', 'vegan', 'paleo', 'mediterranean diet',
    'air fryer', 'instant pot', 'slow cooker', 'grilling',
    'meal prep', 'smoothie', 'salad', 'soup', 'pasta', 'pizza',
    'sushi', 'ramen', 'tacos', 'burrito', 'curry', 'stir fry',
    'baking', 'dessert', 'cake', 'cookies', 'bread', 'sourdough',
    'coffee', 'espresso', 'matcha', 'tea', 'protein shake',
    'calories', 'nutrition', 'vitamins', 'supplements',
    'restaurant', 'takeout', 'delivery',
  ],
  health: [
    'yoga', 'meditation', 'pilates', 'crossfit', 'weight training',
    'running', 'cycling', 'swimming', 'martial arts', 'boxing',
    'mental health', 'anxiety', 'depression', 'therapy',
    'sleep', 'insomnia', 'melatonin', 'sleep apnea',
    'skin care', 'acne', 'sunscreen', 'moisturizer', 'retinol',
    'hair care', 'hair loss', 'minoxidil',
    'weight loss', 'diet', 'intermittent fasting',
    'fitness tracker', 'blood pressure', 'glucose',
  ],
  lifestyle: [
    'productivity', 'time management', 'pomodoro', 'bullet journal',
    'minimalism', 'declutter', 'organizing',
    'remote work', 'coworking', 'digital nomad',
    'finance', 'investing', 'stocks', 'crypto', 'real estate',
    'budgeting', 'saving', 'retirement', '401k',
    'insurance', 'health insurance', 'life insurance',
    'credit card', 'chase sapphire', 'amex', 'capital one',
    'banking', 'checking', 'savings',
    'tax', 'tax return', 'deductions',
  ],
  entertainment: [
    'netflix', 'hulu', 'disney+', 'hbo max', 'prime video', 'apple tv+',
    'spotify', 'apple music', 'youtube music', 'tidal',
    'youtube', 'twitch', 'tiktok', 'instagram', 'twitter', 'reddit',
    'movies', 'tv shows', 'anime', 'documentary', 'true crime',
    'gaming', 'pc gaming', 'console gaming', 'mobile gaming',
    'books', 'audiobooks', 'podcasts',
  ],
  careers: [
    'software engineer', 'data scientist', 'product manager', 'designer',
    'frontend developer', 'backend developer', 'full stack developer',
    'devops engineer', 'sre', 'cloud architect',
    'resume', 'cover letter', 'linkedin', 'portfolio', 'github',
    'interview', 'salary negotiation',
    'internship', 'new grad', 'junior', 'senior', 'staff',
    'remote jobs', 'freelance', 'contract', 'consulting',
    'startup', 'faang', 'big tech',
    'networking', 'mentorship', 'career change',
  ],
  ai: [
    'chatgpt', 'gpt-4', 'gpt-4o', 'claude', 'gemini', 'copilot',
    'llama', 'mistral', 'stable diffusion', 'midjourney', 'dall-e',
    'langchain', 'llamaindex', 'pinecone',
    'weaviate', 'chromadb', 'qdrant', 'milvus',
    'openai', 'anthropic', 'hugging face', 'replicate',
    'fine tuning', 'rag', 'embeddings', 'tokenization',
    'vector database', 'semantic search', 'similarity search',
    'neural network', 'transformer', 'attention', 'bert', 'gpt',
    'cnn', 'rnn', 'lstm', 'gan', 'diffusion model',
    'tensorflow', 'pytorch', 'jax', 'keras', 'scikit-learn',
    'llm ops', 'model deployment', 'model serving',
  ],
  shopping: [
    'wireless earbuds', 'usb c hub', 'laptop stand', 'mechanical keyboard',
    'mouse pad', 'webcam', 'microphone', 'monitor arm', 'desk lamp',
    'external hard drive', 'ssd', 'sd card', 'usb drive',
    'hdmi cable', 'ethernet cable', 'power bank', 'phone case',
    'screen protector', 'wall charger', 'car charger',
    'backpack', 'duffel bag', 'luggage', 'travel pillow',
    'water bottle', 'lunch box', 'tote bag', 'umbrella',
    'sneakers', 'running shoes', 'boots', 'sandals',
    't shirt', 'hoodie', 'jacket', 'jeans', 'shorts', 'dress',
    'watch', 'sunglasses', 'wallet', 'belt', 'hat',
  ],
  database: [
    'mysql', 'postgresql', 'mongodb', 'sqlite', 'mariadb', 'oracle',
    'sql server', 'dynamodb', 'cassandra', 'couchdb', 'firebase',
    'supabase', 'neo4j', 'arangodb', 'cockroachdb', 'timescaledb',
    'influxdb', 'prometheus', 'elasticsearch', 'redis', 'memcached',
    'snowflake', 'bigquery', 'redshift', 'clickhouse', 'druid',
    'sql', 'pl/sql', 't-sql', 'nosql', 'acid', 'base', 'cap',
    'indexing', 'sharding', 'replication', 'partitioning',
    'orm', 'prisma', 'typeorm', 'sequelize', 'drizzle',
  ],
};

const tempVariants: Record<string, string[]> = {
  tech: ['framework', 'library', 'tool', 'platform', 'runtime'],
  devops: ['tool', 'platform', 'orchestrator', 'service mesh'],
  education: ['platform', 'course', 'bootcamp', 'resource'],
  gadgets: ['model', 'device', 'smartphone', 'tablet', 'watch'],
  programming: ['editor', 'ide', 'tool', 'language', 'standard'],
  food: ['diet', 'cuisine', 'dish', 'ingredient'],
  health: ['routine', 'exercise', 'practice', 'therapy'],
  ai: ['model', 'tool', 'platform', 'api'],
};

const modifiers = [
  'best', 'top', 'ultimate', 'complete', 'essential', 'modern',
  'advanced', 'beginner', 'professional', 'practical', 'free',
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateQueries(targetCount: number): Map<string, number> {
  const queryMap = new Map<string, number>();
  const seen = new Set<string>();
  const allTopics: { term: string; cat: string }[] = [];

  for (const [cat, terms] of Object.entries(topics)) {
    for (const term of terms) {
      allTopics.push({ term, cat });
    }
  }

  function addBatch(templates: ((t: string) => string)[], weight: number) {
    const batchSize = Math.ceil((targetCount * weight) / 100);
    const pool = [...allTopics];
    let attempts = 0;

    while (seen.size < targetCount && attempts < batchSize * 3) {
      attempts++;
      const { term, cat } = pick(pool);
      const template = pick(templates);
      const mod = pick(modifiers);
      let query: string;

      if (Math.random() < 0.3) {
        const term2 = pick(pool).term;
        query = template(`${term} ${term2}`);
      } else if (Math.random() < 0.3) {
        query = template(`${mod} ${term}`);
      } else {
        query = template(term);
      }

      query = query.toLowerCase().trim().replace(/\s+/g, ' ');
      if (query.length < 3 || query.length > 120) continue;
      if (seen.has(query)) continue;
      seen.add(query);
    }
  }

  const templates1 = [
    (t: string) => t,
    (t: string) => `${t} tutorial`,
    (t: string) => `${t} guide`,
    (t: string) => `${t} best practices`,
    (t: string) => `${t} how to`,
    (t: string) => `${t} what is`,
    (t: string) => `${t} examples`,
    (t: string) => `${t} for beginners`,
    (t: string) => `${t} interview questions`,
    (t: string) => `${t} cheatsheet`,
    (t: string) => `${t} documentation`,
    (t: string) => `${t} api`,
    (t: string) => `${t} review`,
    (t: string) => `${t} tips`,
    (t: string) => `${t} course`,
    (t: string) => `${t} certification`,
    (t: string) => `${t} vs`,
    (t: string) => `${t} online`,
    (t: string) => `${t} near me`,
    (t: string) => `${t} price`,
    (t: string) => `${t} download`,
    (t: string) => `${t} jobs`,
    (t: string) => `${t} salary`,
    (t: string) => `${t} projects`,
    (t: string) => `${t} performance`,
    (t: string) => `${t} security`,
    (t: string) => `${t} testing`,
  ];

  const templates2 = [
    (t: string) => `${t} for web development`,
    (t: string) => `${t} for mobile development`,
    (t: string) => `${t} for data science`,
    (t: string) => `${t} for machine learning`,
    (t: string) => `${t} deployment`,
    (t: string) => `${t} monitoring`,
    (t: string) => `${t} debugging`,
    (t: string) => `${t} alternative`,
    (t: string) => `${t} roadmap 2026`,
    (t: string) => `${t} book recommendation`,
    (t: string) => `${t} npm package`,
    (t: string) => `${t} github repository`,
    (t: string) => `${t} open source project`,
    (t: string) => `${t} docker image`,
    (t: string) => `${t} rest api example`,
    (t: string) => `${t} design patterns`,
    (t: string) => `${t} architecture`,
    (t: string) => `${t} microservices`,
    (t: string) => `${t} serverless`,
    (t: string) => `${t} cloud deployment`,
    (t: string) => `${t} production`,
    (t: string) => `${t} scalability`,
  ];

  const templates3 = [
    (t: string) => `best ${t}`,
    (t: string) => `top ${t}`,
    (t: string) => `free ${t}`,
    (t: string) => `learn ${t}`,
    (t: string) => `build ${t}`,
    (t: string) => `why ${t}`,
    (t: string) => `${t} vs ${t}`,
  ];

  addBatch(templates1, 45);
  addBatch(templates2, 25);
  addBatch(templates3, 30);

  if (seen.size < targetCount) {
    const remaining = targetCount - seen.size;
    for (let i = 0; i < remaining; i++) {
      const t1 = pick(allTopics);
      const t2 = pick(allTopics);
      const phrased = [
        `${t1.term} ${t2.term}`,
        `${pick(modifiers)} ${t1.term} ${t2.term}`,
        `${t1.term} ${t2.term} tutorial`,
        `${t1.term} and ${t2.term}`,
        `${t1.term} with ${t2.term}`,
        `${t1.term} for ${t2.term}`,
        `how to ${t1.term} ${t2.term}`,
        `${pick(modifiers)} ${t1.term} for ${t2.term}`,
      ];
      const q = pick(phrased).toLowerCase().trim();
      if (q.length >= 3 && q.length <= 120 && !seen.has(q)) {
        seen.add(q);
      }
    }
  }

  let rank = 0;
  const queries = Array.from(seen);
  for (const q of queries) {
    rank++;
    const exponent = -1.3 + Math.random() * 0.4;
    const normalized = Math.pow(rank / queries.length, exponent);
    const count = Math.max(1, Math.min(500000, Math.round(normalized * 500)));
    queryMap.set(q, count);
  }

  return queryMap;
}

const target = 500000;
console.log(`Generating ${target.toLocaleString()} unique queries...`);

const queries = generateQueries(target);
const outputDir = path.join(__dirname, '..', 'dataset');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, 'queries.tsv');
const lines: string[] = ['query\tcount'];
const sorted = Array.from(queries.entries()).sort((a, b) => b[1] - a[1]);

for (const [query, count] of sorted) {
  lines.push(`${query}\t${count.toLocaleString()}`);
}

fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8');
console.log(`Generated ${queries.size.toLocaleString()} queries.`);
console.log(`Saved to: ${outputPath}`);

const countRanges = sorted.reduce((acc, [, c]) => {
  if (c >= 100000) acc['100k+'] = (acc['100k+'] || 0) + 1;
  else if (c >= 10000) acc['10k+'] = (acc['10k+'] || 0) + 1;
  else if (c >= 1000) acc['1k+'] = (acc['1k+'] || 0) + 1;
  else if (c >= 100) acc['100+'] = (acc['100+'] || 0) + 1;
  else acc['<100'] = (acc['<100'] || 0) + 1;
  return acc;
}, {} as Record<string, number>);
console.log('Distribution:', JSON.stringify(countRanges));
