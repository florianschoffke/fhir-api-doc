import fs from 'fs';
import path from 'path';
import { JSDOM, ResourceLoader } from 'jsdom';
import { pathToFileURL, fileURLToPath } from 'url';
import { execSync } from 'child_process';


let DEBUG = false;

class LocalOnlyResourceLoader extends ResourceLoader {
    constructor(baseDir) {
        super();
        this.baseDir = baseDir;
    }

    fetch(url) {
        if (url.startsWith('file://')) {
            let filePath;

            try {
                const urlObj = new URL(url);
                filePath = urlObj.pathname;

                filePath = decodeURIComponent(filePath);
            } catch {
                return Promise.reject(new Error(`Invalid file URL: ${url}`));
            }

            const basename = path.basename(filePath);

            // Try multiple paths
            const candidates = [
                path.join(this.baseDir, basename),     // Basename in base dir
                path.join(this.baseDir, filePath),     // Relative to base dir
            ];

            for (const candidate of candidates) {
                if (fs.existsSync(candidate)) {
                    const content = fs.readFileSync(candidate);
                    if (DEBUG) console.log(`✅ Loaded: ${basename} (${content.length} bytes)`);
                    return Promise.resolve(content);
                }
            }

            return Promise.reject(new Error(`File not found: ${basename}`));
        }

        // Block anything else
        if (DEBUG) console.log(`🚫 Blocked: ${url}`);
        return Promise.reject(new Error(`Blocked: ${url}`));
    }
}

function copyDirectory(src, dest) {
    // Create destination directory if it doesn't exist
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    // Read all files/folders in source directory
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            // Recursively copy subdirectories
            copyDirectory(srcPath, destPath);
        } else {
            // Copy file
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function deleteDirectory(dir) {
    if (fs.existsSync(dir)) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                deleteDirectory(fullPath);
            } else {
                fs.unlinkSync(fullPath);
            }
        }

        fs.rmdirSync(dir);
    }
}

function setupTmpFolder(config) {
    const tmpDir = path.resolve('./.tmp');

    if (DEBUG) console.log('🔧 Setting up temporary folder...');

    // Remove existing tmp folder if it exists
    if (fs.existsSync(tmpDir)) {
        if (DEBUG) console.log('   Cleaning existing .tmp folder...');
        deleteDirectory(tmpDir);
    }

    // Create fresh tmp folder
    fs.mkdirSync(tmpDir, { recursive: true });

    // Copy files from configured source folders
    if (config.sourceFolders && Array.isArray(config.sourceFolders)) {
        for (const folder of config.sourceFolders) {
            const srcPath = path.resolve(folder);
            
            if (!fs.existsSync(srcPath)) {
                console.warn(`⚠️  Source folder not found: ${folder}`);
                continue;
            }

            if (DEBUG) console.log(`   Copying from ${folder}...`);
            copyDirectory(srcPath, tmpDir);
        }
    } else {
        console.warn('⚠️  No sourceFolders defined in config');
    }

    if (DEBUG) console.log('✅ Temporary folder ready\n');
    return tmpDir;
}

async function capturePageSingle(page) {
    const html = fs.readFileSync(page, 'utf-8');
    const baseDir = path.dirname(path.resolve(page));
    const absolutePagePath = path.resolve(page);

    const loader = new LocalOnlyResourceLoader(baseDir);

    if (DEBUG) console.log(`\n🔄 Processing: ${page}`);
    if (DEBUG) console.log(`   Base directory: ${baseDir}\n`);

    const dom = new JSDOM(html, {
        runScripts: "dangerously",
        resources: loader,
        url: pathToFileURL(absolutePagePath).href
    });

    const blobStore = new Map();
    let blobCounter = 0;

    // Simple polyfill - accepts any blob
    dom.window.URL.createObjectURL = (blob) => {
        const blobId = `blob:${blobCounter++}`;
        blobStore.set(blobId, blob);
        if (DEBUG) console.log(`✅ Created object URL: ${blobId}`);
        return blobId;
    };

    // Custom fetch that resolves relative URLs
    dom.window.fetch = async (url) => {
        // Handle blob URLs
        if (url.startsWith('blob:')) {
            const blob = blobStore.get(url);
            if (blob) {
                const content = await blob.text();
                return {
                    ok: true,
                    status: 200,
                    headers: new Map([['content-type', blob.type || 'application/octet-stream']]),
                    text: async () => content,
                    json: async () => JSON.parse(content),
                    arrayBuffer: async () => blob.arrayBuffer(),
                    blob: async () => blob,
                };
            }
            throw new Error(`Blob URL not found: ${url}`);
        }

        // Resolve relative URLs against the document base
        const absoluteUrl = new URL(url, dom.window.location.href).href;

        // Check if it's a file URL or a relative path that resolves to a local file
        if (absoluteUrl.startsWith('file://')) {
            try {
                // Convert file:// URL to local path
                let filePath = fileURLToPath(absoluteUrl);

                // If the path doesn't exist, try resolving it relative to baseDir
                if (!fs.existsSync(filePath)) {
                    // Extract just the filename/relative path from the URL
                    const urlPath = new URL(absoluteUrl).pathname;
                    const relativePath = urlPath.replace(/^\//, ''); // Remove leading slash
                    filePath = path.join(baseDir, relativePath);

                    if (DEBUG) console.log(`   Trying alternate path: ${filePath}`);
                }

                // Check if file exists
                if (!fs.existsSync(filePath)) {
                    if (DEBUG) console.log(`❌ File not found: ${path.basename(filePath)}`);
                    throw new Error(`File not found: ${filePath}`);
                }

                const content = fs.readFileSync(filePath, 'utf-8');
                if (DEBUG) console.log(`✅ fetch loaded: ${path.basename(filePath)}`);

                // Determine content type from extension
                const ext = path.extname(filePath).toLowerCase();
                const contentType = ext === '.json' ? 'application/json' :
                    ext === '.xml' ? 'application/xml' :
                        'text/plain';

                return {
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    headers: new Map([['content-type', contentType]]),
                    text: async () => content,
                    json: async () => JSON.parse(content),
                    arrayBuffer: async () => Buffer.from(content),
                    blob: async () => new Blob([content]),
                };
            } catch (error) {
                const fileName = path.basename(url);
                if (DEBUG) console.log(`❌ fetch error: ${fileName} - ${error.message}`);
                throw error;
            }
        }

        if (DEBUG) console.log(`🚫 fetch blocked (non-local): ${url}`);
        throw new Error(`fetch blocked: ${url}`);
    };

    // Wait for scripts to finish executing
    await new Promise((resolve) => {
        setTimeout(resolve, 20);
    });

    const output = dom.serialize();
    return output;
}

async function capturePages(configPath) {
    // Read config file
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);

    DEBUG = config.debug || DEBUG;

    // Validate config
    if (!config.pages || !Array.isArray(config.pages)) {
        throw new Error('Config must contain a "pages" array');
    }


    try {
        execSync('npm run build', { 
            encoding: 'utf-8',
            stdio: 'inherit' // Shows output in real-time
        });
    } catch (error) {
        console.error('Command failed:', error.message);
        process.exit(1);
    }

    // Setup tmp folder and copy source files
    const tmpDir = setupTmpFolder(config);

    const results = [];

    try {
        for (const page of config.pages) {
            // Get the basename of the page and look for it in tmp
            const pageBasename = path.basename(page);
            const tmpPagePath = path.join(tmpDir, pageBasename);

            if (!fs.existsSync(tmpPagePath)) {
                console.warn(`⚠️  Page not found in tmp folder: ${pageBasename}`);
                continue;
            }

            // Await each capture before moving to the next
            const output = await capturePageSingle(tmpPagePath);
            results.push({
                page: page, // Store original page path for output naming
                output
            });
            
            if (DEBUG) console.log(`✅ Finished processing: ${pageBasename}`);
        }
        
        if (DEBUG) console.log('\n✅ All pages captured successfully');
        
    } finally {
        if (DEBUG) console.log('\n🧹 Cleaning up temporary folder...');
        deleteDirectory(tmpDir);
        if (DEBUG) console.log('✅ Cleanup complete\n');
    }

    return results;
}

export default { capturePages };