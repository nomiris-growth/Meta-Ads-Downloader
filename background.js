importScripts('jszip.min.js');

// Background service worker for handling downloads
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'downloadFile') {
        handleDownload(message.url, message.filename)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (message.action === 'downloadData') {
        handleDataDownload(message.data, message.filename, message.isBase64)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (message.action === 'processBulkJob') {
        handleBulkJob(message.job)
            .then(result => {
                console.log('Bulk Job Success:', result);
                sendResponse(result);
            })
            .catch(error => {
                console.error('Bulk Job Failed:', error);
                sendResponse({ success: false, error: error.message });
            });
        return true;
    }
});

async function handleBulkJob(job) {
    const { items, filename } = job;
    const zip = new JSZip();

    for (const item of items) {
        try {
            if (item.type === 'url') {
                // background fetch
                const response = await fetch(item.url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const buffer = await response.arrayBuffer();
                zip.file(item.filename, buffer);
            } else {
                zip.file(item.filename, item.data);
            }
        } catch (err) {
            console.warn(`Background fetch failed: ${item.filename}`, err);
            zip.file(`FAILED_${item.filename}.txt`, `Reason: ${err.message}`);
        }
    }

    const content = await zip.generateAsync({ type: 'uint8array' });
    return handleDataDownload(content, filename, false);
}

async function handleDownload(url, filename) {
    try {
        const downloadId = await chrome.downloads.download({
            url: url,
            filename: filename,
            saveAs: false
        });
        return { success: true, downloadId };
    } catch (error) {
        console.error('Download error:', error);
        return { success: false, error: error.message };
    }
}

// Helper to convert Uint8Array to base64 safely
function bytesToBase64(bytes) {
    let binary = "";
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// Support Large Binary Data in Background (MV3)
async function handleDataDownload(data, filename, isBase64 = false) {
    try {
        let url;
        if (isBase64) {
            url = `data:application/zip;base64,${data}`;
        } else if (data instanceof Uint8Array || data instanceof ArrayBuffer) {
            // Service Workers lack URL.createObjectURL. Use data: URL.
            // For 5 ads, this is safely under the string length limit.
            const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
            const base64 = bytesToBase64(bytes);
            url = `data:application/zip;base64,${base64}`;
        } else {
            const encodedData = encodeURIComponent(data);
            url = `data:text/plain;charset=utf-8,${encodedData}`;
        }

        const downloadId = await chrome.downloads.download({
            url: url,
            filename: filename,
            saveAs: false
        });

        return { success: true, downloadId };
    } catch (error) {
        console.error('Data download error:', error);
        return { success: false, error: error.message };
    }
}
