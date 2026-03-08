// Store responses in this array
const collectedData = [];

// 1. Intercept fetch requests
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  const response = await originalFetch.apply(this, args);
  
  // Check if this is the request you want to intercept
  const url = args[0];
  if (url.includes('transactions?accountId')) {
    const clonedResponse = response.clone(); // Clone to avoid consuming
    const data = await clonedResponse.json();
    collectedData.push(data);
    console.log('Intercepted fetch response:', data);
  }
  
  return response;
};

// 2. Intercept XMLHttpRequest
const originalOpen = XMLHttpRequest.prototype.open;
const originalSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function(method, url) {
  this._url = url;
  return originalOpen.apply(this, arguments);
};

XMLHttpRequest.prototype.send = function(body) {
  this.addEventListener('load', function() {
    if (this._url.includes('transactions?accountId')) {
      try {
        const data = JSON.parse(this.responseText);
        collectedData.push(data);
        console.log('Intercepted XHR response:', data);
      } catch (e) {
        collectedData.push(this.responseText);
      }
    }
  });
  
  return originalSend.apply(this, arguments);
};

// View collected data
console.log('Collected data:', collectedData);