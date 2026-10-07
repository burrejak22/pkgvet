const https = require("https");

// tiny get-json helper, no deps needed
function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "pkgvet/0.1.0" } }, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`registry said ${res.statusCode} for ${url}`));
          res.resume();
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString()));
          } catch (e) {
            reject(new Error("registry returned garbage"));
          }
        });
      })
      .on("error", reject);
  });
}

async function fetchDoc(name) {
  // full packument: versions, times, maintainers, the lot
  return get(`https://registry.npmjs.org/${encodeURIComponent(name)}`);
}

async function fetchDownloads(name) {
  try {
    const d = await get(`https://api.npmjs.org/downloads/point/last-month/${encodeURIComponent(name)}`);
    return typeof d.downloads === "number" ? d.downloads : null;
  } catch {
    return null; // stats missing shouldn't kill the whole report
  }
}

module.exports = { fetchDoc, fetchDownloads };
