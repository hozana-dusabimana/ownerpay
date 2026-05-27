// Dashboard login gate. NOTE: this is a client-side gate on a static site — it deters
// casual access, it is NOT real authentication (a determined user can bypass it via
// devtools). The plaintext password is never stored; only its SHA-256 hash is here.
//
// To change the credentials: set USERNAME, and replace PASSWORD_SHA256 with
//   node -e "console.log(require('crypto').createHash('sha256').update('NEWPASS').digest('hex'))"

export const USERNAME = 'ownerpay';
const PASSWORD_SHA256 = 'b5f213a8366059336e31928bfdcffc2f53b9bd960c0027de9052df12810c13b9'; // sha256('Hozana@123')

async function sha256Hex(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function checkLogin(username, password) {
  if (username !== USERNAME) return false;
  return (await sha256Hex(password)) === PASSWORD_SHA256;
}
