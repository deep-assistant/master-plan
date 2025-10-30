// Language selection and filtering functionality
document.addEventListener('DOMContentLoaded', function() {
    const languageCheckboxes = document.querySelectorAll('.lang-checkbox');

    // Load saved language preferences
    const savedLanguages = localStorage.getItem('selectedLanguages');
    if (savedLanguages) {
        const languages = JSON.parse(savedLanguages);
        languageCheckboxes.forEach(checkbox => {
            checkbox.checked = languages.includes(checkbox.value);
        });
    }

    // Save language preferences when changed
    languageCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const selectedLanguages = Array.from(languageCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value);
            localStorage.setItem('selectedLanguages', JSON.stringify(selectedLanguages));

            // Update visibility of language-specific content
            updateLanguageVisibility(selectedLanguages);
        });
    });

    // Initialize language visibility
    const initialLanguages = Array.from(languageCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    updateLanguageVisibility(initialLanguages);
});

function updateLanguageVisibility(selectedLanguages) {
    // Find all elements with language-specific classes
    const allLanguageElements = document.querySelectorAll('[data-lang]');

    allLanguageElements.forEach(element => {
        const elementLang = element.getAttribute('data-lang');
        if (selectedLanguages.includes(elementLang)) {
            element.style.display = '';
            element.classList.remove('hidden');
        } else {
            element.style.display = 'none';
            element.classList.add('hidden');
        }
    });
}

// Get selected languages for use in fact pages
function getSelectedLanguages() {
    const checkboxes = document.querySelectorAll('.lang-checkbox');
    return Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
}

// Utility function to filter references by language
function filterReferencesByLanguage(references, selectedLanguages) {
    const filtered = references.filter(ref =>
        selectedLanguages.includes(ref.language)
    );

    // If no references in selected languages, return all with language markers
    if (filtered.length === 0) {
        return references.map(ref => ({
            ...ref,
            notInSelectedLanguage: true
        }));
    }

    return filtered;
}
