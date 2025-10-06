import { spawn } from 'child_process';
import chokidar from 'chokidar';
import { resolve } from 'path';

const rootDir = resolve(process.cwd(), '..');

class BuildWatcher {
  constructor() {
    this.srcPath = resolve(rootDir, 'src');
    this.publicPath = resolve(rootDir, 'public');
    this.isBuilding = false;
    this.buildQueue = [];
  }

  start() {
    console.log('👀 Watching for file changes...');

    // Watch source files
    chokidar.watch([this.srcPath, this.publicPath], {
      ignored: /node_modules|dist/,
      persistent: true
    }).on('all', (event, path) => {
      if (event === 'change' || event === 'add') {
        this.scheduleBuild();
      }
    });

    // Initial build
    this.runBuild();
  }

  scheduleBuild() {
    if (this.isBuilding) {
      this.buildQueue.push(true);
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
      console.log('✅ Build completed');
    } catch (error) {
      console.error('❌ Build failed:', error);
    } finally {
      this.isBuilding = false;

      // Process queued builds
      if (this.buildQueue.length > 0) {
        this.buildQueue = [];
        setTimeout(() => this.runBuild(), 1000);
      }
    }
  }

  executeBuild() {
    return new Promise((resolve, reject) => {
      const build = spawn('npm', ['run', 'build'], {
        stdio: 'inherit',
        shell: true,
        cwd: rootDir // Execute in the root directory
      });

      build.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Build process exited with code ${code}`));
        }
      });
    });
  }
}

// Start watching
const watcher = new BuildWatcher();
watcher.start();