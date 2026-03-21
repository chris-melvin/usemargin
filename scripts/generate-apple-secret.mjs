/**
 * Generate Apple client secret JWT for Supabase Apple Sign-In
 *
 * Usage:
 *   node scripts/generate-apple-secret.mjs \
 *     --team-id VF84GD65GJ \
 *     --key-id YOUR_KEY_ID \
 *     --client-id com.ledgr.web \
 *     --key-file /path/to/AuthKey_XXXXX.p8
 */

import { readFileSync } from "fs";
import { createPrivateKey, createSign } from "crypto";

const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) {
    console.error(`Missing --${name}`);
    process.exit(1);
  }
  return args[idx + 1];
}

const teamId = getArg("team-id");
const keyId = getArg("key-id");
const clientId = getArg("client-id");
const keyFile = getArg("key-file");

const privateKeyPem = readFileSync(keyFile, "utf8");

// Build JWT header and payload
const header = {
  alg: "ES256",
  kid: keyId,
};

const now = Math.floor(Date.now() / 1000);
const payload = {
  iss: teamId,
  iat: now,
  exp: now + 15777000, // ~6 months (maximum allowed by Apple)
  aud: "https://appleid.apple.com",
  sub: clientId,
};

// Base64url encode
function base64url(obj) {
  return Buffer.from(JSON.stringify(obj))
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

const headerEncoded = base64url(header);
const payloadEncoded = base64url(payload);
const signingInput = `${headerEncoded}.${payloadEncoded}`;

// Sign with ES256
const key = createPrivateKey(privateKeyPem);
const sign = createSign("SHA256");
sign.update(signingInput);
const derSig = sign.sign(key);

// Convert DER signature to raw r||s format for ES256
function derToRaw(derSig) {
  // DER format: 0x30 [total-length] 0x02 [r-length] [r] 0x02 [s-length] [s]
  let offset = 2; // skip 0x30 and total length

  // Read r
  offset++; // skip 0x02
  let rLen = derSig[offset++];
  let r = derSig.subarray(offset, offset + rLen);
  offset += rLen;

  // Read s
  offset++; // skip 0x02
  let sLen = derSig[offset++];
  let s = derSig.subarray(offset, offset + sLen);

  // Trim leading zeros (DER adds 0x00 padding for positive numbers)
  if (r.length > 32) r = r.subarray(r.length - 32);
  if (s.length > 32) s = s.subarray(s.length - 32);

  // Pad to 32 bytes if needed
  const raw = Buffer.alloc(64);
  r.copy(raw, 32 - r.length);
  s.copy(raw, 64 - s.length);
  return raw;
}

const rawSig = derToRaw(derSig);
const sigEncoded = rawSig
  .toString("base64")
  .replace(/=/g, "")
  .replace(/\+/g, "-")
  .replace(/\//g, "_");

const jwt = `${signingInput}.${sigEncoded}`;

console.log("\n=== Apple Client Secret JWT ===\n");
console.log(jwt);
console.log("\nThis JWT expires in ~6 months. Paste it into Supabase → Authentication → Providers → Apple → Secret Key.\n");
