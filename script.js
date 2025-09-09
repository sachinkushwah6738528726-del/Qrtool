// Global variables
let currentType = 'url';
let qrCode = null;
let currentData = '';

// DOM elements
const typeButtons = document.querySelectorAll('.type-btn');
const inputSections = document.querySelectorAll('.input-section');
const qrDisplay = document.getElementById('qr-display');
const qrSize = document.getElementById('qr-size');
const errorLevel = document.getElementById('error-level');
const downloadPng = document.getElementById('download-png');
const downloadSvg = document.getElementById('download-svg');
const shareBtn = document.getElementById('share-btn');
const status = document.getElementById('status');

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    generateQR(); // Generate initial QR with default URL
});

// Setup all event listeners
function setupEventListeners() {
    // Type selection buttons
    typeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            typeButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            // Update current type
            currentType = this.dataset.type;
            // Show corresponding input section
            showInputSection();
            // Generate QR code
            generateQR();
        });
    });

    // Input changes with debounce for better performance
    let debounceTimer;
    document.addEventListener('input', function(e) {
        if (e.target.matches('.input, .textarea, .select')) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(generateQR, 300);
        }
    });

    // Download and share buttons
    downloadPng.addEventListener('click', downloadAsPNG);
    downloadSvg.addEventListener('click', downloadAsSVG);
    shareBtn.addEventListener('click', shareQR);
}

// Show correct input section based on selected type
function showInputSection() {
    // Hide all sections
    inputSections.forEach(section => section.classList.remove('active'));
    // Show active section
    const activeSection = document.getElementById(`${currentType}-section`);
    if (activeSection) {
        activeSection.classList.add('active');
    }
}

// Get QR data based on current type and inputs
function getQRData() {
    try {
        let data = '';
        
        switch(currentType) {
            case 'url':
                data = document.getElementById('url-input').value.trim();
                // Add https:// if no protocol specified
                if (data && !data.startsWith('http')) {
                    data = 'https://' + data;
                }
                break;
                
            case 'text':
                data = document.getElementById('text-input').value.trim();
                break;
                
            case 'wifi':
                const ssid = document.getElementById('wifi-ssid').value.trim();
                const password = document.getElementById('wifi-password').value;
                const security = document.getElementById('wifi-security').value;
                if (ssid) {
                    data = `WIFI:T:${security};S:${ssid};P:${password};;`;
                }
                break;
                
            case 'vcard':
                const fname = document.getElementById('vcard-fname').value.trim();
                const lname = document.getElementById('vcard-lname').value.trim();
                const phone = document.getElementById('vcard-phone').value.trim();
                const email = document.getElementById('vcard-email').value.trim();
                
                // Only create vCard if at least one field is filled
                if (fname || lname || phone || email) {
                    data = `BEGIN:VCARD\nVERSION:3.0\nFN:${fname} ${lname}\nTEL:${phone}\nEMAIL:${email}\nEND:VCARD`;
                }
                break;
                
            case 'email':
                const emailTo = document.getElementById('email-to').value.trim();
                const subject = document.getElementById('email-subject').value;
                const body = document.getElementById('email-body').value;
                if (emailTo) {
                    data = `mailto:${emailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                }
                break;
                
            case 'sms':
                const smsPhone = document.getElementById('sms-phone').value.trim();
                const smsMsg = document.getElementById('sms-message').value;
                if (smsPhone) {
                    data = `sms:${smsPhone}?body=${encodeURIComponent(smsMsg)}`;
                }
                break;
        }
        
        return data;
    } catch (error) {
        console.error('Error getting QR data:', error);
        return '';
    }
}

// Main QR code generation function
function generateQR() {
    const data = getQRData();
    currentData = data;
    
    // Show placeholder if no data
    if (!data) {
        showPlaceholder();
        return;
    }

    try {
        // Check data length and show appropriate message
        if (data.length > 1000) {
            showStatus('⚠️ Data too long, using lower error correction', 'error');
        } else {
            showStatus('✅ QR Code generated successfully', 'success');
        }

        // Create QR code instance with proper settings
        const size = parseInt(qrSize.value);
        const level = data.length > 1000 ? 'L' : errorLevel.value; // Auto-adjust error correction
        
        qrCode = qrcode(0, level);
        qrCode.addData(data);
        qrCode.make();
        
        // Generate and display SVG
        const cellSize = size;
        const margin = 4;
        const svg = qrCode.createSvgTag(cellSize, margin);
        
        // Update display
        qrDisplay.innerHTML = svg;
        qrDisplay.classList.add('has-qr');
        
    } catch (error) {
        console.error('QR Generation Error:', error);
        showError();
    }
}

// Show placeholder when no data
function showPlaceholder() {
    qrDisplay.innerHTML = `
        <div class="qr-placeholder">
            <div class="qr-icon">📱</div>
            <div>Enter data to generate QR code</div>
        </div>
    `;
    qrDisplay.classList.remove('has-qr');
    status.innerHTML = '';
}

// Show error message
function showError() {
    qrDisplay.innerHTML = `
        <div style="color: #ef4444;">
            <div style="font-size: 2rem; margin-bottom: 1rem;">❌</div>
            <div>Error generating QR code</div>
            <div style="font-size: 0.8rem; margin-top: 0.5rem;">Data might be too long</div>
        </div>
    `;
    qrDisplay.classList.remove('has-qr');
    showStatus('❌ Generation failed', 'error');
}

// Show status message
function showStatus(message, type) {
    status.innerHTML = `<div class="${type}">${message}</div>`;
}

// Download QR code as PNG
function downloadAsPNG() {
    if (!qrCode || !currentData) {
        alert('Please generate a QR code first!');
        return;
    }
    
    // Add loading state
    const originalText = downloadPng.innerHTML;
    downloadPng.classList.add('loading');
    downloadPng.disabled = true;
    downloadPng.innerHTML = 'Generating...';
    
    try {
        // Create canvas from SVG
        const svg = qrDisplay.querySelector('svg');
        if (!svg) {
            throw new Error('No SVG found');
        }
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Get SVG data
        const svgData = new XMLSerializer().serializeToString(svg);
        const img = new Image();
        
        img.onload = function() {
            // Set canvas size
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Draw white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw QR code
            ctx.drawImage(img, 0, 0);
            
            // Create download link
            const link = document.createElement('a');
            link.download = `qrcode-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            // Reset button and show success
            resetButton(downloadPng, originalText, '✅ PNG Downloaded!');
        };
        
        img.onerror = function() {
            resetButton(downloadPng, originalText, '❌ PNG Failed!');
        };
        
        // Load SVG as image
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
        
    } catch (error) {
        console.error('PNG download error:', error);
        resetButton(downloadPng, originalText, '❌ PNG Failed!');
    }
}

// Download QR code as SVG
function downloadAsSVG() {
    if (!qrCode || !currentData) {
        alert('Please generate a QR code first!');
        return;
    }
    
    // Add loading state
    const originalText = downloadSvg.innerHTML;
    downloadSvg.classList.add('loading');
    downloadSvg.disabled = true;
    downloadSvg.innerHTML = 'Generating...';
    
    try {
        const svg = qrDisplay.querySelector('svg');
        if (!svg) {
            throw new Error('No SVG found');
        }
        
        // Get SVG data and create blob
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        
        // Create download link
        const link = document.createElement('a');
        link.download = `qrcode-${Date.now()}.svg`;
        link.href = URL.createObjectURL(blob);
        link.click();
        
        // Cleanup
        URL.revokeObjectURL(link.href);
        
        // Reset button and show success
        resetButton(downloadSvg, originalText, '✅ SVG Downloaded!');
        
    } catch (error) {
        console.error('SVG download error:', error);
        resetButton(downloadSvg, originalText, '❌ SVG Failed!');
    }
}

// Reset button state after download
function resetButton(button, originalText, statusMessage) {
    button.classList.remove('loading');
    button.disabled = false;
    button.innerHTML = statusMessage;
    
    // Reset to original text after 2 seconds
    setTimeout(() => {
        button.innerHTML = originalText;
    }, 2000);
}

// Share QR code data
function shareQR() {
    if (!currentData) {
        alert('Please generate a QR code first!');
        return;
    }
    
    try {
        // Try native Web Share API first
        if (navigator.share) {
            navigator.share({
                title: 'QR Code',
                text: `Check out this QR code: ${currentData}`
            }).then(() => {
                showStatus('✅ Shared successfully!', 'success');
            }).catch((error) => {
                if (error.name !== 'AbortError') {
                    fallbackShare();
                }
            });
        } else {
            // Fallback to clipboard
            fallbackShare();
        }
    } catch (error) {
        console.error('Share error:', error);
        fallbackShare();
    }
}

// Fallback share method using clipboard
function fallbackShare() {
    try {
        // Modern clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(currentData).then(() => {
                showStatus('✅ Data copied to clipboard!', 'success');
            }).catch(() => {
                legacyFallbackShare();
            });
        } else {
            // Legacy fallback
            legacyFallbackShare();
        }
    } catch (error) {
        legacyFallbackShare();
    }
}

// Legacy fallback for older browsers
function legacyFallbackShare() {
    try {
        const textArea = document.createElement('textarea');
        textArea.value = currentData;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const result = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (result) {
            showStatus('✅ Data copied to clipboard!', 'success');
        } else {
            showStatus('❌ Could not copy data', 'error');
        }
    } catch (error) {
        console.error('Legacy copy failed:', error);
        showStatus('❌ Copy failed', 'error');
    }
}

// Utility function to validate URL
function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Utility function to truncate long text
function truncateText(text, maxLength = 50) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Add some helper functions for better UX
function showToast(message, type = 'info') {
    // You can implement a toast notification system here
    console.log(`${type.toUpperCase()}: ${message}`);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + S to download PNG
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        downloadAsPNG();
    }
    
    // Ctrl/Cmd + Shift + S to download SVG
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        downloadAsSVG();
    }
    
    // Ctrl/Cmd + Shift + C to share/copy
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        shareQR();
    }
});

// Add some debugging helpers (can be removed in production)
window.QRDebug = {
    getCurrentData: () => currentData,
    getCurrentType: () => currentType,
    regenerateQR: generateQR,
    getQRCode: () => qrCode
};

console.log('🎯 QR Code Generator loaded successfully!');
console.log('Keyboard shortcuts:');
console.log('  Ctrl/Cmd + S: Download PNG');
console.log('  Ctrl/Cmd + Shift + S: Download SVG');
console.log('  Ctrl/Cmd + Shift + C: Share/Copy');
