import { spawn } from 'child_process';
import { resolve, join } from 'path';
import fs from 'fs/promises';

// This script is run from the `easy-seo` directory, so the root is one level up.
const rootDir = resolve(process.cwd(), '..');
const outputDir = resolve(process.cwd(), 'public', 'preview');
const statusFilePath = join(outputDir, 'build-status.json');

async function buildPreview() {
  console.log('🚀 Starting Astro preview build from build-preview.js...');

  try {
    // 1. Ensure the output directory exists and is clean.
    await fs.rm(outputDir, { recursive: true, force: true });
    await fs.mkdir(outputDir, { recursive: true });

    // 2. Write an initial "building" status.
    await writeStatus('building', 'Astro build is in progress...');

    // 3. Execute the build command. The CWD needs to be the Astro project root.
    const output = await executeBuild();

    // 4. Write success status.
    await writeStatus('success', 'Build completed successfully.', output);
    console.log('✅ Preview build completed successfully.');

  } catch (error) {
    // 5. Write error status.
    console.error('❌ Preview build failed.');
    // Ensure the error object is stringified properly for the JSON file.
    const errorDetails = error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) };
    await writeStatus('error', errorDetails.message, errorDetails.stack);
  }
}

function executeBuild() {
  return new Promise((resolve, reject) => {
    // The output path should be relative to the `easy-seo` directory,
    // because `npm --prefix` effectively runs the command from there.
    const outDirForVite = join('public', 'preview');

    const buildProcess = spawn(
      'npm',
      // Use --prefix to target the package.json inside the easy-seo directory
      ['run', 'build', '--prefix', 'easy-seo', '--', `--out-dir=${outDirForVite}`],
      {
        cwd: rootDir, // Execute the npm command from the project root
        stdio: 'pipe',
        shell: true,
      }
    );

    let stdout = '';
    let stderr = '';

    buildProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(data.toString()); // Log output as it comes
    });

    buildProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error(data.toString()); // Log errors as they come
    });

    buildProcess.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        const errorMessage = `Build process exited with code ${code}\n\nSTDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`;
        reject(new Error(errorMessage));
      }
    });

    buildProcess.on('error', (err) => {
      reject(new Error(`Failed to start build process: ${err.message}`));
    });
  });
}

async function writeStatus(status, message, details = '') {
  try {
    const content = JSON.stringify({
      status,
      message,
      details,
      timestamp: new Date().toISOString(),
    }, null, 2);
    await fs.writeFile(statusFilePath, content);
  } catch (writeError) {
    console.error('🔥 Critical: Could not write build status file.', writeError);
  }
}

buildPreview();