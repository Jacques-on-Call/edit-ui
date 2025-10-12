# OAuth Flow Visual Debugger (Cloudflare Worker Edition)

This debugger is designed to provide a real-time visual trace of a complex OAuth 2.0 flow, especially one that involves popup windows and a Cloudflare Worker backend.

## How to Use

1.  **Inject into HTML:** Copy the entire `<!DOCTYPE html>...</html>` block below and temporarily paste it into the main `index.html` of the frontend application you need to debug.
2.  **Deploy & Run:** Deploy the application. When you load the page, the debugger panel will appear in the top-right corner.
3.  **Trigger OAuth Flow:** Initiate the login process.
4.  **Observe Logs:** Watch the debugger trace the entire flow in real-time. Pay close attention to the color-coded events:
    *   **Purple:** Popup window events (opening, closing).
    *   **Cyan:** Cloudflare Worker requests and responses.
    *   **Green:** Successful operations (e.g., receiving an OAuth code).
    *   **Red:** Errors. This is often the most important log entry.
    *   **Yellow:** Warnings or non-critical events.
5.  **Remove After Debugging:** Once the issue is resolved, remember to remove the debugger code from your `index.html` file.

## Full Debugger Code

```html
<!DOCTYPE html>
<html>
<head>
    <title>GitHub OAuth Flow Debugger</title>
    <style>
        .debug-container {
            position: fixed;
            top: 10px;
            right: 10px;
            width: 400px;
            background: #1a1a1a;
            color: #00ff00;
            padding: 15px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            max-height: 80vh;
            overflow-y: auto;
            border: 2px solid #444;
        }
        .log-entry {
            margin: 8px 0;
            padding: 5px;
            border-left: 3px solid #444;
            padding-left: 10px;
        }
        .success { border-left-color: #00ff00; }
        .error { border-left-color: #ff4444; background: #330000; }
        .warning { border-left-color: #ffaa00; }
        .info { border-left-color: #4444ff; }
        .popup-event { border-left-color: #ff00ff; background: #220022; }
        .worker-event { border-left-color: #00ffff; background: #002222; }
        .debug-toggle {
            background: #333;
            color: white;
            border: none;
            padding: 5px 10px;
            cursor: pointer;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <!-- Debug Panel -->
    <div class="debug-container" id="debugPanel">
        <button class="debug-toggle" onclick="toggleDebug()">Hide Debugger</button>
        <div id="debugLog"></div>
    </div>

    <script>
        // Debugger state
        let debugEnabled = true;
        let popupWindow = null;
        let popupCheckInterval = null;

        // Initialize debugger
        function initDebugger() {
            logEvent('🔧 Debugger initialized', 'info');
            logEvent('📍 Current URL: ' + window.location.href, 'info');

            // Monitor for OAuth trigger elements
            monitorOAuthButtons();

            // Track popup state
            monitorPopups();

            // Track URL changes (for redirects)
            monitorUrlChanges();

            // Track storage changes (for token storage)
            monitorStorage();

            logEvent('👀 Monitoring OAuth buttons and popups...', 'success');
        }

        function logEvent(message, type = 'info') {
            if (!debugEnabled) return;

            const logEntry = document.createElement('div');
            logEntry.className = `log-entry ${type}`;
            logEntry.innerHTML = `[${new Date().toLocaleTimeString()}] ${message}`;

            document.getElementById('debugLog').appendChild(logEntry);
            console.log(`[OAuth Debug] ${message}`);
        }

        function toggleDebug() {
            debugEnabled = !debugEnabled;
            const panel = document.getElementById('debugPanel');
            const button = document.querySelector('.debug-toggle');

            if (debugEnabled) {
                panel.style.display = 'block';
                button.textContent = 'Hide Debugger';
                logEvent('🔧 Debugger re-enabled', 'success');
            } else {
                panel.style.display = 'none';
                button.textContent = 'Show Debugger';
            }
        }

        function monitorOAuthButtons() {
            // Look for common OAuth trigger elements
            const buttons = document.querySelectorAll([
                '[href*="github.com/oauth"]',
                '[href*="github.com/login/oauth"]',
                '[onclick*="github"]',
                'button:contains("GitHub")',
                'button:contains("Login")',
                'a[href*="auth"]'
            ].join(','));

            buttons.forEach(btn => {
                btn.addEventListener('click', function(e) {
                    logEvent(`🎯 OAuth triggered: ${this.textContent || this.href || 'Unknown button'}`, 'popup-event');
                    logEvent(`🔗 Target: ${this.href || 'No href'}`, 'popup-event');
                });
            });
        }

        function monitorPopups() {
            const originalOpen = window.open;
            window.open = function(...args) {
                logEvent(`🪟 Popup opened: ${args[0]}`, 'popup-event');
                popupWindow = originalOpen.apply(this, args);

                if (popupWindow) {
                    // Monitor popup status
                    popupCheckInterval = setInterval(() => {
                        if (popupWindow.closed) {
                            logEvent('🪟 Popup closed by user', 'warning');
                            clearInterval(popupCheckInterval);
                        }
                    }, 500);

                    // Try to intercept popup messages
                    window.addEventListener('message', function(event) {
                        logEvent(`📨 Message received from popup: ${JSON.stringify(event.data)}`, 'worker-event');
                        logEvent(`🌐 Message origin: ${event.origin}`, 'worker-event');
                    });
                }

                return popupWindow;
            };
        }

        function monitorUrlChanges() {
            let currentUrl = window.location.href;
            setInterval(() => {
                if (window.location.href !== currentUrl) {
                    logEvent(`🔄 URL changed to: ${window.location.href}`, 'info');
                    currentUrl = window.location.href;

                    // Check for OAuth callback parameters
                    checkOAuthParams();
                }
            }, 100);
        }

        function monitorStorage() {
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = function(key, value) {
                if (key.includes('token') || key.includes('auth') || key.includes('oauth')) {
                    logEvent(`💾 Storage updated: ${key} = ${value ? '***' + value.slice(-4) : 'empty'}`, 'success');
                }
                return originalSetItem.apply(this, arguments);
            };
        }

        function checkOAuthParams() {
            const urlParams = new URLSearchParams(window.location.search);
            const hashParams = new URLSearchParams(window.location.hash.substring(1));

            // Check for OAuth success parameters
            if (urlParams.has('code')) {
                logEvent('✅ GitHub OAuth code received!', 'success');
                logEvent(`🔐 Code: ${urlParams.get('code')}`, 'success');
            }

            if (urlParams.has('error')) {
                logEvent(`❌ OAuth error: ${urlParams.get('error')}`, 'error');
                logEvent(`📝 Error description: ${urlParams.get('error_description')}`, 'error');
            }

            if (hashParams.has('access_token')) {
                logEvent('🎉 Access token received in URL hash!', 'success');
            }
        }

        // Cloudflare Worker specific debugging
        function debugWorkerRequest(url, options = {}) {
            logEvent(`☁️ Worker Request: ${url}`, 'worker-event');
            logEvent(`⚙️ Request options: ${JSON.stringify(options)}`, 'worker-event');

            return fetch(url, options)
                .then(response => {
                    logEvent(`☁️ Worker Response: ${response.status} ${response.statusText}`, 'worker-event');
                    return response;
                })
                .catch(error => {
                    logEvent(`❌ Worker Request Failed: ${error.message}`, 'error');
                    throw error;
                });
        }

        // Start the debugger when page loads
        document.addEventListener('DOMContentLoaded', initDebugger);

        // Export for manual debugging
        window.oauthDebugger = {
            logEvent,
            debugWorkerRequest,
            checkOAuthParams,
            clearLogs: () => { document.getElementById('debugLog').innerHTML = ''; }
        };
    </script>
</body>
</html>
```