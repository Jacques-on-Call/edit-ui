export function postPreviewMessage(iframe, type, payload) {
  if (!iframe || !iframe.contentWindow) {
    return;
  }
  iframe.contentWindow.postMessage({ type, payload }, '*');
}

export function updateCssVar(iframe, name, value) {
  postPreviewMessage(iframe, 'sc:update-css-var', { name, value });
}

export function updateText(iframe, selector, text) {
  postPreviewMessage(iframe, 'sc:update-text', { selector, text });
}
