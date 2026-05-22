const fs = require('fs');
const https = require('https');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const BLOG_REPO = 'jeremyteaches76-ui/jeremyivy-blog';
const POSTS_DIR = 'posts';
const OUTPUT_FILE = 'blog.html';

if (!GITHUB_TOKEN) {
  console.error('GITHUB_TOKEN not set');
  process.exit(1);
}

function mdToHtml(md) {
  return md
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    .replace(/\n/gim, '<br>');
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };

  const meta = {};
  match[1].split('\n').forEach(line => {
    const [key, ...vals] = line.split(':');
    if (key && vals.length) meta[key.trim()] = vals.join(':').trim();
  });

  return { meta, body: match[2].trim() };
}

function githubRequest(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'jeremyivy-blog-builder'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`GitHub API ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
  });
}

async function fetchFileContent(url) {
  const data = await githubRequest(url);
  return Buffer.from(data.content, 'base64').toString('utf8');
}

async function build() {
  console.log('Fetching posts from private repo...');

  const files = await githubRequest(
    `https://api.github.com/repos/${BLOG_REPO}/contents/${POSTS_DIR}`
  );

  const mdFiles = files.filter(f => f.name.endsWith('.md'));
  console.log(`Found ${mdFiles.length} posts`);

  const posts = [];
  for (const file of mdFiles) {
    console.log(`Fetching ${file.name}...`);
    const content = await fetchFileContent(file.url);
    const { meta, body } = parseFrontmatter(content);

    posts.push({
      title: meta.title || file.name.replace('.md', ''),
      date: meta.date || '',
      slug: meta.slug || file.name.replace('.md', ''),
      html: mdToHtml(body)
    });
  }

  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  const postsHtml = posts.map(post => `
    <article id="${post.slug}">
      <h2>${post.title}</h2>
      <time>${post.date}</time>
      <div class="content">
        ${post.html}
      </div>
    </article>
  `).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blog — Jeremy Ivy</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 65ch; margin: 0 auto; padding: 2rem 1rem; color: #111; background: #fff; }
    h1 { font-size: 1.8rem; margin-bottom: 2rem; }
    article { margin-bottom: 3rem; padding-bottom: 2rem; border-bottom: 1px solid #eee; }
    article:last-child { border-bottom: none; }
    h2 { font-size: 1.3rem; margin-bottom: 0.3rem; }
    time { color: #666; font-size: 0.85rem; display: block; margin-bottom: 1rem; }
    .content p { margin-bottom: 1rem; }
    .content h3 { font-size: 1.1rem; margin: 1.5rem 0 0.5rem; }
    .content code { background: #f4f4f4; padding: 0.1rem 0.3rem; border-radius: 3px; font-size: 0.9em; }
    a { color: #0066cc; }
    nav { margin-bottom: 2rem; }
    nav a { text-decoration: none; }
    @media (prefers-color-scheme: dark) {
      body { background: #111; color: #eee; }
      .content code { background: #222; }
      time { color: #999; }
      article { border-color: #333; }
    }
  </style>
</head>
<body>
  <nav><a href="/">&larr; Home</a></nav>
  <h1>Blog</h1>
  ${postsHtml}
</body>
</html>`;

  fs.writeFileSync(OUTPUT_FILE, html);
  console.log(`Wrote ${OUTPUT_FILE}`);
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});