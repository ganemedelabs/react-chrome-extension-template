/**
 * @file Publish script for Chrome Extensions. Uploads a pre-built ZIP file to the Chrome Web Store
 * using OAuth 2.0 credentials. Performs the following actions:
 *
 * 1. Loads manifest.json to determine the ZIP file name based on extension name and version
 * 2. Verifies the existence of the ZIP file generated by build.cjs
 * 3. Ensures required Chrome Web Store credentials (CLIENT_ID, CLIENT_SECRET) are present
 * 4. Automatically obtains a refresh token if missing or invalid
 * 5. Fetches an OAuth 2.0 access token
 * 6. Uploads the ZIP file to the Chrome Web Store if EXTENSION_ID is available
 * 7. Logs detailed status updates and results
 *
 * **Prerequisites:**
 * - A ZIP file must exist from a prior run of build.cjs
 * - The extension must be published at least once to obtain a valid EXTENSION_ID
 * - Create a `.env` file in the project root with:
 *   - `CLIENT_ID`: OAuth 2.0 Client ID (see "How to obtain CLIENT_ID and CLIENT_SECRET" below)
 *   - `CLIENT_SECRET`: OAuth 2.0 Client Secret (see "How to obtain CLIENT_ID and CLIENT_SECRET" below)
 *   - `EXTENSION_ID`: Chrome Extension ID from [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard)
 * - `REFRESH_TOKEN` will be automatically obtained and saved to `.env` if missing or expired
 *
 * **Example:**
 * ```env
 * CLIENT_ID=your_client_id
 * CLIENT_SECRET=your_client_secret
 * EXTENSION_ID=your_extension_id
 * ```
 *
 * **How to obtain CLIENT_ID and CLIENT_SECRET:**
 * To interact with the Chrome Web Store API, you need OAuth 2.0 credentials. Follow these steps:
 * 1. Visit [Google Cloud Console](https://console.developers.google.com/apis/credentials), create a project (e.g., `chrome-webstore-item`), and set up the OAuth consent screen (select "External," and add your email as a test user).
 * 2. Go to [https://console.developers.google.com/apis/library/chromewebstore.googleapis.com](https://console.developers.google.com/apis/library/chromewebstore.googleapis.com) and enable the Chrome Web Store API.
 * 3. Go to [https://console.developers.google.com/apis/credentials](https://console.developers.google.com/apis/credentials) and create an OAuth client ID (select "Desktop app," and give it a name e.g., `Chrome Webstore Item`).
 * 4. Save the generated `CLIENT_ID` and `CLIENT_SECRET`.
 *
 * @module PublishScript
 * @requires fs
 * @requires path
 * @requires http
 * @requires url
 * @requires readline
 * @requires child_process
 * @requires google-auth-library
 * @requires dotenv
 */

/* eslint-disable no-undef */

const fs = require("fs");
const path = require("path");
const http = require("http");
const url = require("url");
const readline = require("readline");
const { exec } = require("child_process");
const { OAuth2Client } = require("google-auth-library");
require("dotenv").config();

const RED = "\x1b[1;31m";
const GREEN = "\x1b[1;32m";
const BLUE = "\x1b[1;34m";
const YELLOW = "\x1b[1;33m";
const RESET = "\x1b[0m";

function red(text) {
    return `${RED}${text}${RESET}`;
}

function green(text) {
    return `${GREEN}${text}${RESET}`;
}

function blue(text) {
    return `${BLUE}${text}${RESET}`;
}

function yellow(text) {
    return `${YELLOW}${text}${RESET}`;
}

/**
 * Fetches an access token for Chrome Web Store API using OAuth 2.0 credentials.
 * @returns {Promise<string>} Access token
 * @throws {Error} If the refresh token is invalid or other errors occur
 */
async function getAccessToken() {
    const { CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN } = process.env;
    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            refresh_token: REFRESH_TOKEN,
            grant_type: "refresh_token",
        }),
    });
    const data = await response.json();
    if (!response.ok) {
        if (data.error === "invalid_grant") {
            throw new Error("Invalid refresh token");
        }
        throw new Error(data.error_description || "Failed to get access token");
    }
    return data.access_token;
}

/**
 * Obtains a refresh token by starting a local server and handling OAuth 2.0 authorization.
 * @param {string} clientId - OAuth 2.0 Client ID
 * @param {string} clientSecret - OAuth 2.0 Client Secret
 * @returns {Promise<string>} Refresh token
 */
async function getRefreshToken(clientId, clientSecret) {
    const oAuth2Client = new OAuth2Client(clientId, clientSecret, "http://localhost:3000/");
    const SCOPES = ["https://www.googleapis.com/auth/chromewebstore"];

    const authorizeUrl = oAuth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
        prompt: "consent",
    });

    console.log("ℹ️  Authorize this app by visiting this URL:");
    console.log(yellow(authorizeUrl));
    console.log(`Press ${blue("ENTER")} to open in the browser...`);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question("", () => {
        if (process.platform === "darwin") {
            exec(`open "${authorizeUrl}"`);
        } else if (process.platform === "win32") {
            exec(`start "" "${authorizeUrl}"`);
        } else {
            exec(`xdg-open "${authorizeUrl}"`);
        }
    });

    return new Promise((resolve, reject) => {
        const server = http.createServer(async (req, res) => {
            try {
                const requestUrl = url.parse(req.url, true);
                const code = requestUrl.query.code;

                if (!code) {
                    res.writeHead(400, { "Content-Type": "text/plain" });
                    res.end("Error: No authorization code received");
                    return;
                }

                const { tokens } = await oAuth2Client.getToken(code);
                res.writeHead(200, { "Content-Type": "text/html" });
                res.end("<h1>Authorization successful!</h1><p>You can close this window.</p>");
                resolve(tokens.refresh_token);
                rl.close();
                server.close();
            } catch (error) {
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("Internal server error");
                reject(error);
                rl.close();
                server.close();
            }
        });

        server.listen(3000);

        server.on("error", (err) => {
            reject(err);
            rl.close();
        });
    });
}

/**
 * Ensures a valid access token is available, obtaining a new refresh token if necessary.
 * @returns {Promise<string>} Access token
 */
async function ensureAccessToken() {
    if (!process.env.REFRESH_TOKEN) {
        console.log("⚠️  Refresh token not found. Starting authorization process...");
        const refreshToken = await getRefreshToken(process.env.CLIENT_ID, process.env.CLIENT_SECRET);
        process.env.REFRESH_TOKEN = refreshToken;
        saveRefreshToken(refreshToken);
    }
    try {
        console.log("🔄 Fetching access token...");
        return await getAccessToken();
    } catch (error) {
        if (error.message === "Invalid refresh token") {
            console.log("⚠️  Refresh token is invalid. Starting authorization process...");
            const refreshToken = await getRefreshToken(process.env.CLIENT_ID, process.env.CLIENT_SECRET);
            process.env.REFRESH_TOKEN = refreshToken;
            saveRefreshToken(refreshToken);
            return await getAccessToken();
        } else {
            throw error;
        }
    }
}

/**
 * Saves the refresh token to the .env file if it exists, or logs instructions.
 * @param {string} refreshToken - The refresh token to save
 */
function saveRefreshToken(refreshToken) {
    const dotenvPath = path.join(__dirname, ".env");
    if (fs.existsSync(dotenvPath)) {
        fs.appendFileSync(dotenvPath, `\nREFRESH_TOKEN=${refreshToken}\n`);
        console.log(`📝 Refresh token saved to ${green(".env")} file.`);
    } else {
        console.log(`ℹ️  Please add the following line to your ${green(".env")} file:`);
        console.log(yellow(`REFRESH_TOKEN=${refreshToken}`));
    }
}

/**
 * Uploads the ZIP file to the Chrome Web Store.
 * @param {string} zipFilePath - Path to the ZIP file
 * @param {string} extensionId - Chrome Extension ID
 */
async function uploadToChromeWebStore(zipFilePath, extensionId) {
    const accessToken = await ensureAccessToken();
    const apiUrl = `https://www.googleapis.com/upload/chromewebstore/v1.1/items/${extensionId}`;
    const headers = {
        Authorization: `Bearer ${accessToken}`,
        "x-goog-api-version": "2",
        "Content-Type": "application/zip",
    };
    console.log(`📦 Uploading ${green(path.basename(zipFilePath))} to Chrome Web Store...`);
    const response = await fetch(apiUrl, {
        method: "PUT",
        headers,
        body: fs.readFileSync(zipFilePath),
    });
    const result = await response.json();
    if (response.ok && result.uploadState === "SUCCESS") {
        console.log(`✅ Successfully uploaded ${green(path.basename(zipFilePath))} to Chrome Web Store.`);
    } else {
        throw new Error(red(`❌ Upload failed: ${JSON.stringify(result)}`));
    }
}

/**
 * Main publish script orchestrator.
 */
async function main() {
    try {
        // Check required credentials
        if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET) {
            throw new Error("CLIENT_ID and CLIENT_SECRET must be set in .env to proceed.");
        }

        // Load manifest.json to determine the ZIP file
        const manifestPath = path.join(__dirname, "static", "manifest.json");
        if (!fs.existsSync(manifestPath)) {
            throw new Error(`Manifest file ${green("manifest.json")} not found`);
        }
        const manifestJson = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
        const packageName = manifestJson.name.toLowerCase().replace(/\s+/g, "-");
        const version = manifestJson.version;
        const formattedVersion = `v${version.replace(/\./g, "-")}`;
        const zipFileName = `${packageName}-${formattedVersion}.zip`;
        const zipFilePath = path.join(__dirname, zipFileName);

        // Check if the ZIP file exists
        if (!fs.existsSync(zipFilePath)) {
            throw new Error(`ZIP file ${green(zipFileName)} not found. Run build.js first.`);
        }

        // Upload if EXTENSION_ID is available
        if (process.env.EXTENSION_ID) {
            await uploadToChromeWebStore(zipFilePath, process.env.EXTENSION_ID);
        } else {
            console.log(`⚠️  EXTENSION_ID not found. ${green(zipFileName)} is ready for manual upload.`);
        }
    } catch (error) {
        console.error(red(`❌ Error: ${error.message}`));
        process.exit(1);
    }
}

main();
