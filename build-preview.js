import { spawn } from 'child_process';
import { resolve, join } from 'path';
import fs from 'fs/promises';

const rootDir = resolve(process.cwd(), '..');
const outputDir = resolve(rootDir, 'easy-seo', 'public', 'preview');
const statusFilePath = join(outputDir, 'build-status.json');

async function buildPreview() {
  console.log('🚀 Starting Astro preview build...');

  try {
    // 1. Ensure the output directory exists and is clean.
    await fs.rm(outputDir, { recursive: true, force: true });
    await fs.mkdir(outputDir, { recursive: true });

    // 2. Write an initial "building" status.
    await writeStatus('building', 'Astro build is in progress...');

    // 3. Execute the build command with a custom output directory.
    const output = await executeBuild();

    // 4. Write success status.
    await writeStatus('success', 'Build completed successfully.', output);
    console.log('✅ Preview build completed successfully.');
    console.log(`\nPreview is ready. Please go to the "Preview" tab in the editor and click "Load Preview".`);

  } catch (error) {
    // 5. Write error status.
    console.error('❌ Preview build failed.');
    await writeStatus('error', error.message, error.stack);
  }
}

function executeBuild() {
  return new Promise((resolve, reject) => {
    // Note: The output path is relative to the CWD of the spawn, which is rootDir.
    const outDirRelative = join('easy-seo', 'public', 'preview');

    const buildProcess = spawn(
      'npm',
      ['run', 'build', '--', `--out-dir=${outDirRelative}`],
      {
        cwd: rootDir,
        stdio: 'pipe',
        shell: true
      }
    );

    let stdout = '';
    let stderr = '';

    buildProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    buildProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    buildProcess.on('close', (code) => {
      if (code === 0) {
        console.log(stdout);
        resolve(stdout);
      } else {
        const errorMessage = `Build process exited with code ${code}\n\nSTDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`;
        console.error(errorMessage);
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