// js/compassApp.js

document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('app-container');
    const screens = appContainer.querySelectorAll('.app-screen');

    // Navigation Buttons
    const startCompassBtn = document.getElementById('start-compass-btn');
    const nextButtons = appContainer.querySelectorAll('.next-btn');
    const backButtons = appContainer.querySelectorAll('.back-btn');
    const generateCompassBtn = document.getElementById('generate-compass-btn');
    const startOverBtn = document.getElementById('start-over-btn');

    // Store user selections
    const userSelections = {
        industry: null,
        journey: null,
        goals: [],
        time: null,
        budget: null,
        format: null
    };

    let currentScreenIndex = 0; // 0: opt-in, 1: q1, 2: q2, etc.

    // Function to show a specific screen
    function showScreen(index) {
        screens.forEach((screen, i) => {
            screen.classList.toggle('active', i === index);
            screen.classList.toggle('hidden', i !== index);
        });
        currentScreenIndex = index;
    }

    // Initialize by showing the opt-in screen
    showScreen(0);

    // Event Listeners for navigation
    startCompassBtn.addEventListener('click', () => {
        showScreen(1); // Go to Q1
    });

    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            const currentScreenId = screens[currentScreenIndex].id;

            // Save user selection and validate before moving next
            let isValid = true;
            if (currentScreenId === 'q1-industry') {
                userSelections.industry = document.querySelector('input[name="industry"]:checked')?.value;
                if (!userSelections.industry) { alert('Please select your industry to continue.'); isValid = false; }
            } else if (currentScreenId === 'q2-journey') {
                userSelections.journey = document.querySelector('input[name="journey"]:checked')?.value;
                if (!userSelections.journey) { alert('Please select your business stage to continue.'); isValid = false; }
            } else if (currentScreenId === 'q3-goals') {
                userSelections.goals = Array.from(document.querySelectorAll('input[name="goals"]:checked')).map(cb => cb.value);
                if (userSelections.goals.length === 0) { alert('Please select at least one primary goal to continue.'); isValid = false; }
                if (userSelections.goals.length > 2) { alert('You can select up to 2 goals. Please deselect one.'); isValid = false; }
            } else if (currentScreenId === 'q4-time') {
                userSelections.time = document.querySelector('input[name="time"]:checked')?.value;
                if (!userSelections.time) { alert('Please select your monthly time dedication to continue.'); isValid = false; }
            } else if (currentScreenId === 'q5-budget') {
                userSelections.budget = document.querySelector('input[name="budget"]:checked')?.value;
                if (!userSelections.budget) { alert('Please select your approximate monthly budget to continue.'); isValid = false; }
            }

            if (isValid) {
                showScreen(currentScreenIndex + 1);
            }
        });
    });

    backButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (button.id === 'start-over-btn') {
                resetQuiz();
                showScreen(0); // Go back to opt-in screen
            } else if (currentScreenIndex > 0) {
                showScreen(currentScreenIndex - 1);
            }
        });
    });

    // Event listener for the new Generate Compass button on Q6
    generateCompassBtn.addEventListener('click', () => {
        const currentScreenId = screens[currentScreenIndex].id;

        let isValid = true;
        // Save user selection for Q6
        if (currentScreenId === 'q6-format') {
            userSelections.format = document.querySelector('input[name="format"]:checked')?.value;
            if (!userSelections.format) { alert('Please select a preferred content format to generate your compass.'); isValid = false; }
        }

        if (isValid) {
            // All data collected, now generate the compass blueprint
            generateCompassBlueprint(userSelections);
            showScreen(screens.length - 1); // Show results screen (last screen)
        }
    });

    // Function to generate the compass blueprint with recommendations
    function generateCompassBlueprint(selections) {
        const blueprintContentDiv = document.getElementById('blueprint-content');
        blueprintContentDiv.innerHTML = '<h3>Compiling your personalized blueprint...</h3>'; // Loading message

        let recommendationsHtml = `
            <p>Based on your unique profile, here’s a look at key digital strategies that could work for you:</p>
            <h4>Your Selections:</h4>
            <ul>
                <li><strong>Industry:</strong> ${selections.industry.charAt(0).toUpperCase() + selections.industry.slice(1)}</li>
                <li><strong>Business Stage:</strong> ${selections.journey.charAt(0).toUpperCase() + selections.journey.slice(1)}</li>
                <li><strong>Primary Goals:</strong> ${selections.goals.join(', ')}</li>
                <li><strong>Time Dedication:</strong> ${selections.time === 'low' ? 'Less than 10 hours' : selections.time === 'medium' ? '10-20 hours' : selections.time === 'high' ? '20-40 hours' : 'More than 40 hours'}</li>
                <li><strong>Monthly Budget:</strong> ${selections.budget === 'none' ? '~$0 / DIY' : selections.budget === 'low' ? 'Less than $100' : selections.budget === 'medium' ? '$100 - $500' : 'More than $500'}</li>
                <li><strong>Preferred Content Format:</strong> ${MEDIA_TYPES_DATA.find(m => m.id === selections.format)?.name || selections.format}</li>
            </ul>
            <hr>
            <h4>Recommended Digital Strategies:</h4>
        `;

        // --- Begin Recommendation Logic Placeholder ---
        // This is where we'll build the intelligent recommendation system.
        // For now, it's illustrative, but it sets up the structure.

        const recommendedStrategies = []; // Will store objects like { type: 'SEO', name: 'Local SEO', description: '...' }

        // Example: Filter SEO types based on industry and journey relevance
        const relevantSeoTypes = SEO_TYPES_DATA.filter(seo => {
            const industryPriority = seo.industry_priority[selections.industry];
            const journeyRelevance = seo[PHASE_MAPPING[selections.journey]];

            // Basic filtering: High priority for industry and at least medium relevance for journey
            return (industryPriority === "High" || industryPriority === "Medium") &&
                   (journeyRelevance === "High" || journeyRelevance === "Medium");
        });

        // Example: Filter Media Types based on preferred format
        const relevantMediaTypes = MEDIA_TYPES_DATA.filter(media => {
            return media.id === selections.format || media.primary_benefits.some(pb => selections.goals.includes(pb));
        });

        // Example: Filter Channels based on industry priority and supported media
        const relevantChannels = CHANNELS_DATA.filter(channel => {
            const industryPriority = channel.industry_priority[selections.industry];
            const supportsPreferredFormat = channel.best_for_media_types.includes(selections.format);

            return industryPriority === "High" || supportsPreferredFormat;
        });


        // Add filtered SEO types to recommendations
        if (relevantSeoTypes.length > 0) {
            recommendationsHtml += `<h5>Top SEO Strategies for You:</h5><ul>`;
            relevantSeoTypes.slice(0, 3).forEach(seo => { // Just show top 3 for now
                recommendationsHtml += `<li><strong>${seo.name}:</strong> ${seo.description} <br><em>Key for: ${seo.primary_benefits.join(', ')}</em></li>`;
            });
            recommendationsHtml += `</ul>`;
        } else {
             recommendationsHtml += `<p>No specific SEO strategies found based on your current selections. Consider broadening your criteria.</p>`;
        }


        // Add filtered Media types to recommendations
        if (relevantMediaTypes.length > 0) {
            recommendationsHtml += `<h5>Content Formats to Focus On:</h5><ul>`;
            relevantMediaTypes.slice(0, 2).forEach(media => { // Just show top 2 for now
                recommendationsHtml += `<li><strong>${media.name}:</strong> ${media.description}</li>`;
            });
            recommendationsHtml += `</ul>`;
        }


        // Add filtered Channels to recommendations
        if (relevantChannels.length > 0) {
            recommendationsHtml += `<h5>Where to Share Your Message:</h5><ul>`;
            relevantChannels.slice(0, 2).forEach(channel => { // Just show top 2 for now
                recommendationsHtml += `<li><strong>${channel.name}:</strong> ${channel.description}</li>`;
            });
            recommendationsHtml += `</ul>`;
        }

        recommendationsHtml += `<p><em>This is a simplified overview. A full compass blueprint would delve deeper into specific actions, tools, and timelines tailored to your inputs.</em></p>`;

        // --- End Recommendation Logic Placeholder ---

        blueprintContentDiv.innerHTML = recommendationsHtml;
    }

    // Function to reset the quiz state
    function resetQuiz() {
        // Clear all radio and checkbox selections
        document.querySelectorAll('input[type="radio"]').forEach(input => input.checked = false);
        document.querySelectorAll('input[type="checkbox"]').forEach(input => input.checked = false);

        // Reset userSelections object
        userSelections.industry = null;
        userSelections.journey = null;
        userSelections.goals = [];
        userSelections.time = null;
        userSelections.budget = null;
        userSelections.format = null;

        // Clear results content
        document.getElementById('blueprint-content').innerHTML = '';
    }
});
