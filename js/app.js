/* ============================================
   MUKONO DISTRICT SURVEY APP - MAIN JAVASCRIPT
   Offline-capable, bilingual, data collection
   ============================================ */

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    appName: 'MukonoSurvey2026',
    version: '1.0.0',
    totalQuestions: 21,
    sections: ['section-a', 'section-b', 'section-c', 'section-d', 'section-e', 'section-f', 'section-g'],
    sectionQuestionCounts: [4, 3, 3, 2, 3, 3, 3], // Questions per section
    storageKey: 'mukono_survey_responses',
    language: 'en'
};

// ============================================
// STATE MANAGEMENT
// ============================================
let currentSectionIndex = 0;
let surveyStartTime = null;
let surveyData = {};
let responses = [];

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    // Load stored responses
    loadStoredResponses();

    // Check online status
    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Initialize language
    setLanguage('en');

    // Show admin panel on triple-click (researcher access)
    let clickCount = 0;
    document.addEventListener('click', function(e) {
        if (e.target.closest('.admin-panel') || e.target.closest('.admin-toggle')) return;
        clickCount++;
        if (clickCount >= 3) {
            document.getElementById('admin-panel').classList.remove('hidden');
            clickCount = 0;
        }
        setTimeout(() => clickCount = 0, 2000);
    });

    // Update progress
    updateProgress();

    // Check for "none" platform selection
    document.querySelectorAll('input[name="platforms"]').forEach(cb => {
        cb.addEventListener('change', handlePlatformSelection);
    });
}

// ============================================
// LANGUAGE SWITCHING
// ============================================
function setLanguage(lang) {
    CONFIG.language = lang;

    // Update button states
    document.getElementById('btn-en').classList.toggle('active', lang === 'en');
    document.getElementById('btn-lg').classList.toggle('active', lang === 'lg');

    // Update all elements with data attributes
    document.querySelectorAll(`[data-${lang}]`).forEach(el => {
        const text = el.getAttribute(`data-${lang}`);
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.placeholder = text;
        } else {
            // For elements with child elements, only update text nodes
            if (el.children.length === 0) {
                el.textContent = text;
            } else {
                // Find direct text nodes and update them
                Array.from(el.childNodes).forEach(node => {
                    if (node.nodeType === 3 && node.textContent.trim()) {
                        node.textContent = ' ' + text + ' ';
                    }
                });
            }
        }
    });

    // Update select options
    document.querySelectorAll('select option[data-' + lang + ']').forEach(opt => {
        opt.textContent = opt.getAttribute('data-' + lang);
    });
}

// ============================================
// SURVEY NAVIGATION
// ============================================
function startSurvey() {
    if (!document.getElementById('consent-check').checked) return;

    surveyStartTime = Date.now();
    document.getElementById('welcome-screen').classList.remove('active');
    document.getElementById('welcome-screen').classList.add('hidden');
    document.getElementById('survey-form').classList.remove('hidden');
    document.getElementById('section-a').classList.add('active');

    updateProgress();
}

function nextSection(nextId) {
    const currentSection = document.getElementById(CONFIG.sections[currentSectionIndex]);

    // Validate current section
    if (!validateSection(currentSection)) {
        showValidationError();
        return;
    }

    // Collect data from current section
    collectSectionData(currentSection);

    // Hide current, show next
    currentSection.classList.remove('active');
    currentSection.classList.add('hidden');

    currentSectionIndex++;
    const nextSection = document.getElementById(nextId);
    nextSection.classList.remove('hidden');
    nextSection.classList.add('active');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updateProgress();
}

function prevSection(prevId) {
    const currentSection = document.getElementById(CONFIG.sections[currentSectionIndex]);

    currentSection.classList.remove('active');
    currentSection.classList.add('hidden');

    currentSectionIndex--;
    const prevSectionEl = document.getElementById(prevId);
    prevSectionEl.classList.remove('hidden');
    prevSectionEl.classList.add('active');

    window.scrollTo({ top: 0, behavior: 'smooth' });
    updateProgress();
}

function validateSection(section) {
    const requiredInputs = section.querySelectorAll('[required]');
    let valid = true;

    requiredInputs.forEach(input => {
        if (input.type === 'radio') {
            const name = input.name;
            const checked = section.querySelector(`input[name="${name}"]:checked`);
            if (!checked) valid = false;
        } else if (input.type === 'select-one') {
            if (!input.value) valid = false;
        }
    });

    return valid;
}

function showValidationError() {
    // Simple shake animation on the section
    const section = document.getElementById(CONFIG.sections[currentSectionIndex]);
    section.style.animation = 'none';
    section.offsetHeight; // Trigger reflow
    section.style.animation = 'shake 0.5s ease';

    // Add shake keyframes if not present
    if (!document.getElementById('shake-style')) {
        const style = document.createElement('style');
        style.id = 'shake-style';
        style.textContent = `
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-10px); }
                75% { transform: translateX(10px); }
            }
        `;
        document.head.appendChild(style);
    }

    // Show alert
    const msg = CONFIG.language === 'en' 
        ? 'Please answer all required questions before continuing.' 
        : 'Nsaba oddamu ebibuuzo ebyetaagisa byonna nga weeyongerayo.';
    alert(msg);
}

function collectSectionData(section) {
    const inputs = section.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
        if (input.type === 'radio' && input.checked) {
            surveyData[input.name] = input.value;
        } else if (input.type === 'checkbox') {
            if (!surveyData[input.name]) surveyData[input.name] = [];
            if (input.checked) surveyData[input.name].push(input.value);
        } else if (input.type === 'range') {
            surveyData[input.name] = input.value;
        } else if (input.tagName === 'SELECT' || input.tagName === 'TEXTAREA') {
            surveyData[input.name] = input.value;
        }
    });
}

function updateProgress() {
    let answered = 0;

    // Count answered questions
    for (let i = 0; i <= currentSectionIndex; i++) {
        answered += CONFIG.sectionQuestionCounts[i];
    }

    const progress = Math.round((answered / CONFIG.totalQuestions) * 100);
    document.documentElement.style.setProperty('--progress', progress + '%');
    document.getElementById('progress-text').textContent = progress + '%';
}

// ============================================
// UI HELPERS
// ============================================
function toggleStartButton() {
    const btn = document.getElementById('start-btn');
    btn.disabled = !document.getElementById('consent-check').checked;
}

function updateSliderValue(slider, displayId) {
    const value = slider.value;
    const display = document.getElementById(displayId);

    let label = '';
    if (displayId === 'phone-hours-val') {
        label = value + (value === '1' ? ' hour' : ' hours');
    } else if (displayId === 'sm-hours-val') {
        label = value + (value === '1' ? ' hour' : ' hours');
    } else if (displayId === 'study-hours-val') {
        label = value + (value === '1' ? ' hour/week' : ' hours/week');
    }

    display.textContent = label;
}

function togglePhoneQuestions(show) {
    const block = document.getElementById('phone-details');
    if (show) {
        block.classList.remove('hidden');
    } else {
        block.classList.add('hidden');
        // Clear phone-related data
        delete surveyData.internet_access;
    }
}

function handlePlatformSelection(e) {
    const noneCheckbox = document.querySelector('input[name="platforms"][value="none"]');
    const otherCheckboxes = document.querySelectorAll('input[name="platforms"]:not([value="none"])');

    if (e.target.value === 'none' && e.target.checked) {
        // Uncheck all others
        otherCheckboxes.forEach(cb => cb.checked = false);
        // Hide duration question
        document.getElementById('sm-duration-block').classList.add('hidden');
    } else if (e.target.value !== 'none' && e.target.checked) {
        // Uncheck "none"
        noneCheckbox.checked = false;
        document.getElementById('sm-duration-block').classList.remove('hidden');
    }

    // If nothing checked, show duration
    const anyChecked = document.querySelectorAll('input[name="platforms"]:checked').length > 0;
    if (!anyChecked) {
        document.getElementById('sm-duration-block').classList.remove('hidden');
    }
}

// ============================================
// SUBMISSION & DATA STORAGE
// ============================================
function submitSurvey() {
    const currentSection = document.getElementById(CONFIG.sections[currentSectionIndex]);

    if (!validateSection(currentSection)) {
        showValidationError();
        return;
    }

    // Collect final section data
    collectSectionData(currentSection);

    // Add metadata
    surveyData._metadata = {
        responseId: generateResponseId(),
        timestamp: new Date().toISOString(),
        duration: Math.round((Date.now() - surveyStartTime) / 1000),
        language: CONFIG.language,
        userAgent: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        online: navigator.onLine
    };

    // Store locally
    storeResponse(surveyData);

    // Show thank you screen
    showThankYou(surveyData._metadata.responseId);

    // Try to sync if online
    if (navigator.onLine) {
        syncResponses();
    }
}

function generateResponseId() {
    const date = new Date();
    const prefix = 'MKS-' + date.getFullYear();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `${prefix}-${random}`;
}

function storeResponse(data) {
    let stored = JSON.parse(localStorage.getItem(CONFIG.storageKey) || '[]');
    stored.push(data);
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(stored));

    // Update admin panel count
    updateAdminCount();
}

function loadStoredResponses() {
    const stored = JSON.parse(localStorage.getItem(CONFIG.storageKey) || '[]');
    responses = stored;
    updateAdminCount();
}

function showThankYou(responseId) {
    document.getElementById('survey-form').classList.add('hidden');
    document.getElementById('thank-you').classList.remove('hidden');
    document.getElementById('thank-you').classList.add('active');

    document.getElementById('response-id').textContent = `Response ID: ${responseId}`;
    document.getElementById('daily-count').textContent = responses.length;

    // Reset for next survey
    surveyData = {};
    currentSectionIndex = 0;
    surveyStartTime = null;
}

// ============================================
// OFFLINE/ONLINE HANDLING
// ============================================
function updateOnlineStatus() {
    const banner = document.getElementById('offline-banner');
    if (navigator.onLine) {
        banner.classList.add('hidden');
        syncResponses();
    } else {
        banner.classList.remove('hidden');
    }
}

function syncResponses() {
    const stored = JSON.parse(localStorage.getItem(CONFIG.storageKey) || '[]');
    const unsynced = stored.filter(r => !r._metadata.synced);

    if (unsynced.length === 0) return;

    // In a real implementation, this would send to your server
    // For now, we simulate successful sync
    console.log(`Would sync ${unsynced.length} responses to server`);

    // Mark as synced
    stored.forEach(r => {
        if (!r._metadata.synced) {
            r._metadata.synced = true;
            r._metadata.syncedAt = new Date().toISOString();
        }
    });

    localStorage.setItem(CONFIG.storageKey, JSON.stringify(stored));
}

// ============================================
// ADMIN PANEL FUNCTIONS
// ============================================
function toggleAdmin() {
    document.getElementById('admin-panel').classList.toggle('open');
}

function updateAdminCount() {
    const stored = JSON.parse(localStorage.getItem(CONFIG.storageKey) || '[]');
    document.getElementById('local-count').textContent = stored.length;
}

function exportData() {
    const stored = JSON.parse(localStorage.getItem(CONFIG.storageKey) || '[]');

    if (stored.length === 0) {
        alert('No responses to export');
        return;
    }

    // Convert to CSV
    const csv = convertToCSV(stored);

    // Create download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `mukono_survey_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Show preview
    document.getElementById('export-area').textContent = csv.substring(0, 2000) + '...';
}

function convertToCSV(data) {
    if (data.length === 0) return '';

    // Flatten the data
    const flatData = data.map(item => {
        const flat = {};
        for (const [key, value] of Object.entries(item)) {
            if (key === '_metadata') {
                for (const [metaKey, metaValue] of Object.entries(value)) {
                    flat[`meta_${metaKey}`] = metaValue;
                }
            } else {
                flat[key] = Array.isArray(value) ? value.join(';') : value;
            }
        }
        return flat;
    });

    // Get all headers
    const headers = [...new Set(flatData.flatMap(Object.keys))];

    // Create CSV
    const csvRows = [headers.join(',')];

    flatData.forEach(row => {
        const values = headers.map(header => {
            const value = row[header] || '';
            // Escape quotes and wrap in quotes if contains comma
            const escaped = String(value).replace(/"/g, '""');
            return escaped.includes(',') ? `"${escaped}"` : escaped;
        });
        csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
}

function clearLocalData() {
    const confirmMsg = CONFIG.language === 'en' 
        ? 'WARNING: This will delete ALL stored responses. Are you sure?' 
        : 'OKULABULA: Kino kijja kugyawo eby'okuddamu byonna. Okakasa?';

    if (confirm(confirmMsg)) {
        localStorage.removeItem(CONFIG.storageKey);
        responses = [];
        updateAdminCount();
        document.getElementById('export-area').textContent = 'Data cleared';
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Auto-save draft every 30 seconds
setInterval(() => {
    if (Object.keys(surveyData).length > 0 && surveyStartTime) {
        localStorage.setItem('mukono_survey_draft', JSON.stringify({
            data: surveyData,
            sectionIndex: currentSectionIndex,
            timestamp: Date.now()
        }));
    }
}, 30000);

// Restore draft on load
window.addEventListener('load', () => {
    const draft = localStorage.getItem('mukono_survey_draft');
    if (draft) {
        const parsed = JSON.parse(draft);
        const age = Date.now() - parsed.timestamp;

        // Only restore if less than 24 hours old
        if (age < 24 * 60 * 60 * 1000) {
            const msg = CONFIG.language === 'en'
                ? 'You have an unfinished survey. Continue where you left off?'
                : 'Olina okusisinkana ogutamaliriziddwa. Weeyongereyo?';

            if (confirm(msg)) {
                surveyData = parsed.data;
                currentSectionIndex = parsed.sectionIndex;
                // Would need to repopulate form fields here
            }
        }
    }
});

// Clear draft on successful submission
function clearDraft() {
    localStorage.removeItem('mukono_survey_draft');
}

// ============================================
// ANALYTICS & VALIDATION
// ============================================
function validateResponse(data) {
    const errors = [];

    // Check for impossible values
    if (data.sm_hours && data.phone_hours) {
        if (parseInt(data.sm_hours) > parseInt(data.phone_hours)) {
            errors.push('Social media hours cannot exceed total phone hours');
        }
    }

    // Check for suspicious patterns
    if (data.study_hours && parseInt(data.study_hours) > 40) {
        errors.push('Study hours > 40/week seems unrealistic');
    }

    return errors;
}

// Log response time for quality control
function logResponseTime(questionId, timeSpent) {
    if (!surveyData._responseTimes) surveyData._responseTimes = {};
    surveyData._responseTimes[questionId] = timeSpent;
}

// ============================================
// KEYBOARD NAVIGATION
// ============================================
document.addEventListener('keydown', function(e) {
    // Enter key on radio cards
    if (e.key === 'Enter' && e.target.classList.contains('radio-card')) {
        e.target.querySelector('input').click();
    }

    // Arrow keys for slider
    if (e.target.type === 'range') {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            // Let default behavior happen, but update display
            setTimeout(() => {
                const displayId = e.target.getAttribute('oninput').match(/'(.*?)'/)[1];
                updateSliderValue(e.target, displayId);
            }, 10);
        }
    }
});

// ============================================
// CONSOLE LOGGING (for debugging)
// ============================================
console.log('Mukono Survey App v' + CONFIG.version + ' loaded');
console.log('Storage key:', CONFIG.storageKey);
console.log('Current responses:', responses.length);