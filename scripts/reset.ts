const baseUrl = process.env.SANDBOX_URL ?? "http://127.0.0.1:4100";
const response = await fetch(`${baseUrl}/test/reset`, { method: "POST" });
if (!response.ok) throw new Error(`Sandbox not reset: ${response.status}`);
console.log(JSON.stringify(await response.json(), null, 2));
