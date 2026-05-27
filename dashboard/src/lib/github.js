// The dashboard no longer talks to the GitHub API — it signs licenses and you commit
// them with git. This just builds the raw URL the SDK should fetch.

export function rawUrl({ owner, repo, branch, path }) {
  const safePath = path.split('/').map(encodeURIComponent).join('/');
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${safePath}`;
}
