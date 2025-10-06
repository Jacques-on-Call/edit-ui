import { spawn } from 'child_process';
import chokidar from 'chokidar';
import { resolve, join } from 'path';
import fs from 'fs/promises';

const MAX_QUEUE_LENGTH = 5;

class BuildWatcher {
  constructor() {
    // Resolve paths from the root of the project, not from easy-seo/
    this.rootDir = resolve(process.cwd(), '..');
    this.srcPath = resolve(this.rootDir, 'src');
    this.publicPath = resolve(this.rootDir, 'public');
    this.distPath = resolve(this.rootDir, 'dist');
    this.statusFilePath = join(this.distPath, 'build-status.json');
    this.lastSuccessTimestampPath = join(this.distPath, '.last_success');

    this.isBuilding = false;
    this.buildQueue = [];
    this.lastSuccessTimestamp = null;
  }

  async start() {
    console.log('👀 Watching for file changes in src/ and public/...');

    try {
        this.lastSuccessTimestamp = await fs.readFile(this.lastSuccessTimestampPath, 'utf-8');
    } catch (e) {
        this.lastSuccessTimestamp = 'never';
    }

    // Watch source files
    chokidar.watch([this.srcPath, this.publicPath], {
      ignored: /node_modules|dist/,
      persistent: true
    }).on('all', (event, path) => {
      if (['change', 'add', 'unlink'].includes(event)) {
        console.log(`\nFile ${event}: ${path}`);
        this.scheduleBuild();
      }
    });

    // Initial build
    this.runBuild();

    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping build watcher...');
      process.exit(0);
    });
  }

  scheduleBuild() {
    if (this.isBuilding) {
      if (this.buildQueue.length < MAX_QUEUE_LENGTH) {
        console.log('Build in progress. Queuing request...');
        this.buildQueue.push(true);
      } else {
        console.log('Build queue is full. Ignoring request.');
      }
      return;
    }

    // Debounce builds
    clearTimeout(this.buildTimeout);
    this.buildTimeout = setTimeout(() => {
      this.runBuild();
    }, 500);
  }

  async runBuild() {
    if (this.isBuilding) return;

    this.isBuilding = true;
    console.log('🏗️  Building Astro site...');

    try {
      await this.executeBuild();
      const timestamp = new Date().toISOString();
      this.lastSuccessTimestamp = timestamp;
      await this.writeStatus('success', 'Build completed successfully.');
      await fs.writeFile(this.lastSuccessTimestampPath, timestamp);
      console.log(`✅ Build completed at ${timestamp}`);
    } catch (error) {
      console.error('❌ Build failed. See build-status.json for details.');
      await this.writeStatus('error', error.message);
    } finally {
      this.isBuilding = false;

      // Process queued builds
      if (this.buildQueue.length > 0) {
        console.log('Processing next build from queue...');
        this.buildQueue.shift(); // Dequeue
        setTimeout(() => this.runBuild(), 1000); // Small delay before next build
      }
    }
  }

  async writeStatus(status, message) {
      try {
        await fs.mkdir(this.distPath, { recursive: true });
        const content = JSON.stringify({
            status,
            message,
            timestamp: new Date().toISOString(),
            lastSuccess: this.lastSuccessTimestamp
        }, null, 2);
        await fs.writeFile(this.statusFilePath, content);
      } catch (writeError) {
          console.error('🔥 Critical: Could not write build status file.', writeError);
      }
  }

  executeBuild() {
    return new Promise((resolve, reject) => {
      const buildProcess = spawn('npm', ['run', 'build'], {
        // Run this from the root directory
        cwd: this.rootDir,
        stdio: 'pipe', // Capture output
        shell: true
      });

      let output = '';
      buildProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      buildProcess.stderr.on('data', (data) => {
        output += data.toString();
      });

      buildProcess.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          const errorMessage = `Build process exited with code ${code}\n\n${output}`;
          reject(new Error(errorMessage));
        }
      });

      buildProcess.on('error', (err) => {
          reject(new Error(`Failed to start build process: ${err.message}`));
      });
    });
  }
}

// Start watching
const watcher = new BuildWatcher();
watcher.start();