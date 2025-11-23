const { createAppAuth } = require("@octokit/auth-app");
const fs = require("fs");
const path = require("path");

// Load private key
const privateKeyPath = path.resolve(process.env.GITHUB_PRIVATE_KEY_PATH || "contextcode.private-key.pem");
let privateKey;
try {
  privateKey = fs.readFileSync(privateKeyPath, "utf8");
} catch (e) {
  console.warn("GitHub Private Key not found at:", privateKeyPath);
  // Fallback for dev/testing if key is missing, though it will fail actual auth
  privateKey = "PLACEHOLDER_KEY";
}

const auth = createAppAuth({
  appId: process.env.GITHUB_APP_ID,
  privateKey: privateKey,
  installationId: process.env.GITHUB_INSTALLATION_ID,
});

/**
 * Generates an authenticated URL for cloning a repository.
 * @param {string} repoUrl - The public URL of the repository (e.g., https://github.com/owner/repo)
 * @returns {Promise<string>} - The URL with the access token injected.
 */
async function getAuthenticatedCloneUrl(repoUrl) {
  try {
    const installationAuthentication = await auth({ type: "installation" });
    const token = installationAuthentication.token;

    // Insert token into URL: https://x-access-token:TOKEN@github.com/owner/repo.git
    const urlObj = new URL(repoUrl);
    urlObj.username = "x-access-token";
    urlObj.password = token;

    return urlObj.toString();
  } catch (error) {
    console.error("Error getting GitHub authentication:", error);
    throw new Error("Failed to authenticate with GitHub App");
  }
}

module.exports = { getAuthenticatedCloneUrl };
