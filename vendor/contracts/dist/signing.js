import { createHmac, timingSafeEqual } from "node:crypto";
const HEADER_PATTERN = /^t=(\d+),v1=([0-9a-f]{64})$/;
function digestFor(body, secret, timestampSec) {
    return createHmac("sha256", secret).update(`${timestampSec}.${body}`, "utf8").digest();
}
export function signBody(body, secret, timestampSec) {
    return `t=${timestampSec},v1=${digestFor(body, secret, timestampSec).toString("hex")}`;
}
export function verifySignature(body, header, secrets, opts) {
    const match = HEADER_PATTERN.exec(header);
    const timestampStr = match?.[1];
    const digestHex = match?.[2];
    if (!timestampStr || !digestHex)
        return { valid: false, reason: "malformed" };
    const timestampSec = Number(timestampStr);
    const tolerance = opts.toleranceSec ?? 300;
    if (Math.abs(opts.nowSec - timestampSec) > tolerance)
        return { valid: false, reason: "stale" };
    const given = Buffer.from(digestHex, "hex");
    for (const secret of secrets) {
        const expected = digestFor(body, secret, timestampSec);
        if (expected.length === given.length && timingSafeEqual(expected, given)) {
            return { valid: true };
        }
    }
    return { valid: false, reason: "mismatch" };
}
//# sourceMappingURL=signing.js.map