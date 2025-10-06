import { spawn } from 'child_process';
import { join } from 'path';
import fs from 'fs/promises';

// --- Simplified Path Resolution ---
// This script now assumes it's being run from the project root,
// which is set by the build-trigger-server.js.
const outputDir = join('easy-seo', 'public', 'preview');
const statusFilePath = join(outputDir, 'build-status.json');

async function buildPreview() {
  console.log('🚀 Starting Astro preview build from simplified build-preview.js...');

  try {
    await fs.rm(outputDir, { recursive: true, force: true });
    await fs.mkdir(outputDir, { recursive: true });
    await writeStatus('building', 'Astro build is in progress...');
    const output = await executeBuild();
    await writeStatus('success', 'Build completed successfully.', output);
    console.log('✅ Preview build completed successfully.');
  } catch (error) {
    console.error('❌ Preview build failed.');
    const errorDetails = error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) };
    await writeStatus('error', errorDetails.message, errorDetails.stack);
  }
}

function executeBuild() {
  return new Promise((resolve, reject) => {
    const buildProcess = spawn(
      'npm',
      // This command runs the 'build:preview' script from the root package.json
      ['run', 'build:preview'],
      {
        // The cwd is now set by the trigger server, so it's not needed here.
        stdio: 'pipe',
        shell: true,
      }
    );

    let stdout = '';
    let stderr = '';

    buildProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(data.toString());
    });

    buildProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error(data.toString());
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