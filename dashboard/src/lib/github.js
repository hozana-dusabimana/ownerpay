// Minimal GitHub REST client — just enough to publish a license file via the
// Contents API. Uses a fine-scoped Personal Access Token (Contents: read/write).

function headers(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

// base64 of a UTF-8 string (GitHub Contents API wants base64-encoded content)
function b64Utf8(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function contentsUrl({ owner, repo, path }) {
  const safePath = path.split('/').map(encodeURIComponent).join('/');
  return `https://api.github.com/repos/${owner}/${repo}/contents/${safePath}`;
}

/** Create or update a file. Returns the raw URL the SDK should fetch. */
export async function publishFile({ token, owner, repo, branch, path, content, message }) {
  const url = contentsUrl({ owner, repo, path });

  // Look up existing sha (required to update an existing file).
  let sha;
  const getRes = await fetch(`${url}?ref=${encodeURIComponent(branch)}`, { headers: headers(token) });
  if (getRes.ok) {
    sha = (await getRes.json()).sha;
  } else if (getRes.status !== 404) {
    throw new Error(`GitHub read failed (${getRes.status}): ${await getRes.text()}`);
  }

  const body = {
    message: message || `OwnerPay: update ${path}`,
    content: b64Utf8(content),
    branch,
    ...(sha ? { sha } : {}),
  };
  const res = await fetch(url, { method: 'PUT', headers: headers(token), body: JSON.stringify(body) });
  if (!res.ok) {
    throw new Error(`GitHub write failed (${res.status}): ${await res.text()}`);
  }
  return rawUrl({ owner, repo, branch, path });
}

/** Verify the token + repo are reachable before the user tries to publish. */
export async function checkAccess({ token, owner, repo }) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: headers(token) });
  if (res.status === 401) throw new Error('GitHub rejected the token (401). Check it has Contents: read/write.');
  if (res.status === 404) throw new Error('Repo not found (404). Check owner/repo and that the token can see it.');
  if (!res.ok) throw new Error(`GitHub error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return { private: data.private, defaultBranch: data.default_branch };
}

export function rawUrl({ owner, repo, branch, path }) {
  const safePath = path.split('/').map(encodeURIComponent).join('/');
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${safePath}`;
}
