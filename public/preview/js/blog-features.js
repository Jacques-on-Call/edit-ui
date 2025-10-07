// --- DEFINE BLOG-SPECIFIC FUNCTIONS HERE ---

function updateProgressBar() {
    // Find the progress bar element specific to the blog layout
    const progressBar = document.querySelector('body > .progress-bar'); // Or adjust selector if needed

    if (progressBar) {
        const scrollPosition = window.scrollY;
        // Ensure we don't divide by zero if document height is less than window height
        const docHeight = Math.max(
            document.body.scrollHeight, document.documentElement.scrollHeight,
            document.body.offsetHeight, document.documentElement.offsetHeight,
            document.body.clientHeight, document.documentElement.clientHeight
        ) - window.innerHeight;

        if (docHeight > 0) {
             const scrollPercent = (scrollPosition / docHeight) * 100;
             progressBar.style.width = Math.min(scrollPercent, 100) + '%'; // Cap at 100%
        } else {
             progressBar.style.width = '0%'; // No scroll possible or content shorter than viewport
        }
         // Optional: Add a console log for debugging scroll events
         // console.log('Scroll %:', scrollPercent);
    } else {
        // Only log error if you expect the progress bar on ALL pages using this script
        // console.error('.progress-bar element not found by blog-features.js');
    }
}

function calculateReadingTime() {
    const readingTimeElement = document.querySelector('.reading-time');
    // Use a selector that reliably targets the main article content
    const articleBody = document.querySelector('article[property="articleBody"], .main-content article, main article'); // Try a few common selectors

    if (readingTimeElement && articleBody) {
        const text = articleBody.textContent || articleBody.innerText || "";
        const wordCount = text.trim().split(/\s+/).filter(Boolean).length; // More robust word count
        const wordsPerMinute = 200; // Average reading speed
        const readingTime = Math.ceil(wordCount / wordsPerMinute);

        // Check if reading time is meaningful before updating
        if (readingTime > 0) {
             readingTimeElement.textContent = `📚 Reading time: ${readingTime} minutes`;
             console.log(`Calculated reading time: ${readingTime} minutes`);
        } else {
            // Optional: Hide or set default text if no content found
             readingTimeElement.textContent = `📚 Reading time: < 1 minute`;
             console.log('Word count too low for reading time calculation.');
        }
    } else {
        if (!readingTimeElement) console.warn('.reading-time element not found.');
        if (!articleBody) console.warn('Article content element not found for reading time calculation.');
    }
}

function addEstimatedCompletion() {
     console.log('Adding estimated completion... (Function needs development)');
    // Add logic here if you implement this feature
}


// --- INITIALIZE ALL BLOG FEATURES ---

function initializeBlogFeatures() {
    console.log('Initializing blog features...');

    // Call the functions now defined within this script's scope
    updateProgressBar(); // Call once on load for initial state
    calculateReadingTime();
    addEstimatedCompletion();

    // Mobile-aware Table of Contents (Keep your existing function)
    function initializeTableOfContents() {
        const toc = document.querySelector('.table-of-contents');
        const tocTitle = document.querySelector('.table-of-contents h2');
        // ... rest of your ToC logic ...
         if (!toc || !tocTitle) {
            console.warn('Table of Contents elements not found.');
            return;
        }
        // ... rest of your ToC logic ...
         // Add mobile toggle logic
         if (window.innerWidth < 768) {
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'toc-toggle';
            toggleBtn.setAttribute('aria-label', 'Toggle table of contents');
            toggleBtn.innerHTML = '📖 Quick Navigation <span class="toggle-icon">▼</span>';

            // Avoid adding multiple buttons on resize/re-init
            if (!toc.querySelector('.toc-toggle')) {
                toc.insertBefore(toggleBtn, tocTitle.nextSibling);
            } else {
                // If button exists, ensure handler is attached (or reattach if needed)
                toggleBtn = toc.querySelector('.toc-toggle');
            }

            const tocList = toc.querySelector('ul');
            if (tocList) {
                 // Check current state before setting display none
                 if (tocList.style.display !== 'block') {
                    tocList.style.display = 'none';
                }
            } else {
                console.warn('Table of contents list (ul) not found.');
                return; // Stop if list isn't found
            }


            // Ensure event listener is only added once or managed properly
            // A simple approach (might add multiple listeners on rapid resize, better check needed for complex scenarios)
             let toggleHandler = () => {
                 const isExpanded = tocList.style.display !== 'none';
                 tocList.style.display = isExpanded ? 'none' : 'block';
                 toggleBtn.querySelector('.toggle-icon').textContent = isExpanded ? '▼' : '▲';
                 toggleBtn.setAttribute('aria-expanded', String(!isExpanded)); // Use String()
            };
            // Remove previous listener if re-attaching (more robust)
            // toggleBtn.removeEventListener('click', toggleHandler); // Needs reference management
            toggleBtn.addEventListener('click', toggleHandler);

        } else {
            // Ensure list is visible and button is removed on larger screens
            const tocList = toc.querySelector('ul');
             if (tocList) tocList.style.display = 'block'; // Make sure it's visible
            const existingToggle = toc.querySelector('.toc-toggle');
            if (existingToggle) existingToggle.remove();
        }
    }


    // Enhance section highlighting (Keep your existing function)
    function initializeSectionHighlighting() {
        const sections = document.querySelectorAll('main section[id]'); // Be more specific
        const tocLinks = document.querySelectorAll('.table-of-contents a');

        if (sections.length === 0 || tocLinks.length === 0) {
            console.warn('Sections with IDs or ToC links not found for highlighting.');
            return;
        }

        const options = {
            root: null, // viewport
            rootMargin: '-20% 0px -60% 0px', // Adjust margins to control activation zone
            threshold: 0 // Trigger as soon as any part enters/leaves margin
        };

        const observer = new IntersectionObserver((entries) => {
            let lastIntersectingEntry = null;
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                   lastIntersectingEntry = entry.target;
                }
            });

            // Update based on the last intersecting entry found in this batch
            if (lastIntersectingEntry) {
                tocLinks.forEach(link => link.classList.remove('active'));
                const activeLink = document.querySelector(
                    `.table-of-contents a[href="#${lastIntersectingEntry.id}"]`
                );
                if (activeLink) {
                    activeLink.classList.add('active');
                }
                // Update mobile progress indicator if needed
                updateMobileProgress(lastIntersectingEntry);
            }

        }, options);

        sections.forEach(section => observer.observe(section));
    }

    // Add mobile-friendly progress indicator (Keep your existing function)
    function addMobileProgress() {
         const mobileProgressContainer = document.querySelector('.mobile-progress');
        // Only add if it doesn't exist
        if (!mobileProgressContainer) {
             const progress = document.createElement('div');
             progress.className = 'mobile-progress';
             progress.innerHTML = `
                 <div class="current-section">Current: Introduction</div>
                 <div class="progress-bar-container">
                    <div class="progress-bar-mobile"></div>
                 </div>
            `;
             // Insert after the article header info div
             const articleInfo = document.querySelector('article .info');
             if (articleInfo) {
                 articleInfo.insertAdjacentElement('afterend', progress); // Safer insertion
            } else {
                 console.warn('Article .info section not found to insert mobile progress.');
             }
        }
    }


    // Update mobile progress indicator (Keep your existing function)
    function updateMobileProgress(currentSection) {
        const currentSectionIndicator = document.querySelector('.current-section');
        const mobileProgressBar = document.querySelector('.progress-bar-mobile');
        if (currentSectionIndicator && mobileProgressBar && currentSection) {
            // Get the nearest heading within the section
            const sectionHeading = currentSection.querySelector('h2, h3');
            currentSectionIndicator.textContent = `Current: ${sectionHeading ? sectionHeading.textContent.trim() : currentSection.id}`; // Fallback to ID

            // Calculate progress based on section index (example)
            const sections = Array.from(document.querySelectorAll('main section[id]'));
            const currentIndex = sections.findIndex(sec => sec.id === currentSection.id);
            const progressPercent = sections.length > 0 ? ((currentIndex + 1) / sections.length) * 100 : 0;
             mobileProgressBar.style.width = `${progressPercent}%`;

        }
    }


    // Initialize the specific features needed
    initializeTableOfContents();
    initializeSectionHighlighting();
    addMobileProgress();

    // Handle resize events (Keep your existing logic, ensure functions are defined)
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            console.log('Re-initializing on resize...');
            // Reinitialize features that depend on screen width
            initializeTableOfContents();
             // Maybe re-check progress bar state or other width-dependent features
             updateProgressBar(); // Recalculate width based on potential layout shifts
        }, 250);
    });

    console.log('Blog features initialized.');
}
