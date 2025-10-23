export function postPreviewMessage(iframe, type, payload) {
  if (!iframe || !iframe.contentWindow) {
    return;
  }
  const message = {
    channel: 'sc-preview',
    version: '1',
    type,
    payload,
  };
  iframe.contentWindow.postMessage(message, window.location.origin);
}

export function updateCssVar(iframe, name, value) {
  postPreviewMessage(iframe, 'update-css-var', { name, value });
}

export function updateText(iframe, selector, text) {
  postPreviewMessage(iframe, 'update-text', { selector, text });
}
