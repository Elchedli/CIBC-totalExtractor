// ==================== 1. INTERCEPTOR SETUP ====================
const interceptedData = [];
let isCollecting = false;

// Override fetch API
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  const url = args[0];
  const response = await originalFetch.apply(this, args);
  
  // Clone response to read without consuming
  const responseClone = response.clone();
  
  // Check if this is a request we want to intercept
  if (isCollecting && typeof url === 'string') {
    const urlPattern = 'transactions?accountId'; // CHANGE THIS
    if (url.includes(urlPattern)) {
      try {
        // Try to parse as JSON first
        const data = await responseClone.json();
        console.log(`✅ Intercepted: ${url}`, data);
        interceptedData.push({
          url: url,
          data: data,
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        // If not JSON, try as text
        const text = await responseClone.text();
        console.log(`✅ Intercepted (text): ${url}`);
        interceptedData.push({
          url: url,
          data: text,
          timestamp: new Date().toISOString()
        });
      }
    }
  }
  
  return response;
};

// Override XMLHttpRequest
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function(method, url) {
  this._interceptUrl = url;
  return originalXHROpen.apply(this, arguments);
};

XMLHttpRequest.prototype.send = function(body) {
  const originalOnReadyStateChange = this.onreadystatechange;
  const xhr = this;
  
  this.onreadystatechange = function() {
    if (xhr.readyState === 4 && isCollecting) {
      if (xhr._interceptUrl && xhr._interceptUrl.includes('transactions?accountId')) {
        try {
          const data = JSON.parse(xhr.responseText);
          console.log(`✅ Intercepted XHR: ${xhr._interceptUrl}`, data);
          interceptedData.push({
            url: xhr._interceptUrl,
            data: data,
            timestamp: new Date().toISOString()
          });
        } catch (e) {
          interceptedData.push({
            url: xhr._interceptUrl,
            data: xhr.responseText,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
    
    if (originalOnReadyStateChange) {
      originalOnReadyStateChange.apply(this, arguments);
    }
  };
  
  return originalXHRSend.apply(this, arguments);
};

// ==================== 2. PAGINATION CONTROLLER ====================
async function collectPaginatedData(config) {
  const {
    maxPages = 10,
    delayBetweenPages = 1500,
    pageParam = 'page',
    startPage = 1,
    // Optional: CSS selector for next button if not URL-based
    nextButtonSelector = null
  } = config;
  
  isCollecting = true;
  console.log(`🎯 Starting collection (${maxPages} pages max)`);
  
  for (let page = startPage; page <= startPage + maxPages - 1; page++) {
    console.log(`📄 Processing page ${page}...`);
    
    if (nextButtonSelector) {
      // Method A: Click next button (for SPA with client-side routing)
      const nextBtn = document.querySelector(nextButtonSelector);
      if (!nextBtn || nextBtn.disabled) {
        console.log('⏹️ No more pages available');
        break;
      }
      nextBtn.click();
    } else {
      // Method B: Modify URL parameters (for query-based pagination)
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set(pageParam, page);
      
      // Use history.pushState to change URL without full reload
      window.history.pushState({}, '', currentUrl.toString());
      
      // Trigger any page change events if needed
      window.dispatchEvent(new Event('popstate'));
    }
    
    // Wait for data to load
    await new Promise(resolve => setTimeout(resolve, delayBetweenPages));
    
    // Check if we should continue (optional: detect end of data)
    if (config.stopCondition && config.stopCondition()) {
      console.log('⏹️ Stop condition met');
      break;
    }
  }
  
  isCollecting = false;
  console.log(`✅ Collection complete! Captured ${interceptedData.length} responses`);
  return interceptedData;
}

// ==================== 3. DOWNLOAD UTILITIES ====================
function downloadCollectedData(filename = 'collected-data.json') {
  const dataStr = JSON.stringify(interceptedData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log(`💾 Downloaded ${interceptedData.length} responses as ${filename}`);
}

function downloadAsCSV() {
  // Simple CSV conversion (adjust based on your data structure)
  if (interceptedData.length === 0) return;
  
  const headers = ['URL', 'Timestamp', 'Data'];
  const rows = interceptedData.map(item => [
    item.url,
    item.timestamp,
    typeof item.data === 'string' ? item.data : JSON.stringify(item.data)
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'collected-data.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ==================== 4. QUICK START FUNCTIONS ====================
// Example 1: Simple collection with URL pagination
function startCollection() {
  // First, configure what to intercept (CHANGE THIS)
  const targetUrl = 'api/data'; // or 'graphql' or '/products' etc
  
  // Replace the URL check in our interceptors
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = args[0];
    const response = await originalFetch.apply(this, args);
    
    if (typeof url === 'string' && url.includes(targetUrl)) {
      const clone = response.clone();
      try {
        const data = await clone.json();
        interceptedData.push({
          url: url,
          data: data,
          timestamp: new Date().toISOString()
        });
        console.log(`📥 Captured: ${url.split('?')[0]}`);
      } catch (e) {
        const text = await clone.text();
        interceptedData.push({
          url: url,
          data: text,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return response;
  };
  
  // Start collecting
  isCollecting = true;
  console.log('🎯 Collection started. Navigate pages manually or use pagination functions.');
}

// Example 2: Auto-paginate with scroll
async function collectByScrolling(pages = 5) {
  isCollecting = true;
  console.log(`🎯 Starting scroll-based collection (${pages} pages)`);
  
  for (let i = 0; i < pages; i++) {
    // Scroll to bottom
    window.scrollTo(0, document.body.scrollHeight);
    console.log(`⬇️ Scrolled to bottom (page ${i + 1}/${pages})`);
    
    // Wait for new content to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if we're at the end
    const prevHeight = document.body.scrollHeight;
    await new Promise(resolve => setTimeout(resolve, 500));
    const newHeight = document.body.scrollHeight;
    
    if (prevHeight === newHeight) {
      console.log('⏹️ No more content loading');
      break;
    }
  }
  
  isCollecting = false;
  console.log(`✅ Done! Captured ${interceptedData.length} responses`);
}

// ==================== 5. HELPER FUNCTIONS ====================
function clearCollection() {
  interceptedData.length = 0;
  console.log('🗑️ Collection cleared');
}

function showStats() {
  console.log(`📊 Collection Stats:
  - Total responses: ${interceptedData.length}
  - URLs collected: ${[...new Set(interceptedData.map(d => d.url))].length}
  - Data types: ${[...new Set(interceptedData.map(d => typeof d.data))].join(', ')}`);
}

// ==================== 6. USAGE EXAMPLES ====================
console.log(`
🚀 Data Collection Tools Loaded!
Available functions:

1. startCollection() - Start intercepting requests
2. collectPaginatedData(config) - Auto-paginate
3. collectByScrolling(pages) - Scroll to load more
4. downloadCollectedData(filename) - Save as JSON
5. downloadAsCSV() - Save as CSV
6. clearCollection() - Clear collected data
7. showStats() - Show statistics

To start:
1. First identify the API endpoint in Network tab
2. Call startCollection() with your target URL
3. Either navigate manually or use auto-pagination
4. Download when done

Example for API with ?page= parameter:
collectPaginatedData({
  maxPages: 10,
  pageParam: 'page',
  startPage: 1
});
`);

// Make functions globally available
window.dataCollector = {
  start: startCollection,
  collect: collectPaginatedData,
  scrollCollect: collectByScrolling,
  download: downloadCollectedData,
  downloadCSV: downloadAsCSV,
  clear: clearCollection,
  stats: showStats,
  data: interceptedData
};