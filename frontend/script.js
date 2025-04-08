document.addEventListener('DOMContentLoaded', () => {
    // ... (keep existing variable declarations) ...
    const imageInput = document.getElementById('leafImageInput');
    const fileNameDisplay = document.getElementById('fileName');
    const imagePreviewDiv = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const analyzeButton = document.getElementById('analyzeButton');
    const resultsSection = document.getElementById('resultsSection');
    const loadingIndicator = document.getElementById('loading');
    const errorDisplay = document.getElementById('errorDisplay');
    const resultsContent = document.getElementById('resultsContent');
    const diseaseNameSpan = document.getElementById('diseaseName');
    const confidenceSpan = document.getElementById('confidence');
    const recommendationsTextP = document.getElementById('recommendationsText');
    const chatPopupBtn = document.getElementById("chatPopupBtn");
    // const closeChat = document.getElementById("closeChat"); // Uncomment if you have this element
    const uploadBtnLabel = document.querySelector('label[for="leafImageInput"]');

    let selectedFile = null;

    imageInput.addEventListener('change', (event) => {
        selectedFile = event.target.files[0];

        if (selectedFile) {
            fileNameDisplay.textContent = selectedFile.name;
            fileNameDisplay.style.fontStyle = 'normal'; // Reset style if needed

            const reader = new FileReader();
            reader.onload = (e) => {
                previewImg.src = e.target.result;
                imagePreviewDiv.classList.remove('hidden');
            };
            reader.readAsDataURL(selectedFile);

            analyzeButton.disabled = false;
            resultsSection.classList.add('hidden');
            resultsContent.classList.add('hidden');
            errorDisplay.classList.add('hidden');
        } else {
            resetUI();
        }
    });

    analyzeButton.addEventListener('click', async () => {
        if (!selectedFile) {
            showError("Please choose an image file first.");
            return;
        }

        showLoading(true);
        analyzeButton.disabled = true;
        uploadBtnLabel.style.pointerEvents = 'none'; // Disable choosing new file during analysis
        uploadBtnLabel.style.opacity = '0.7';      // Visual feedback for disabled state

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            console.log("Sending request to backend..."); // Debug log

            const response = await fetch("http://localhost:8000/predict", {
                method: "POST",
                body: formData
            });

            console.log("Response received:", response); // Debug log

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = { detail: `Server error: ${response.status} ${response.statusText}` };
                }
                // FastAPI validation errors often come in 'detail'
                const errorMessage = errorData.detail || errorData.message || 'Unknown server error';
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log("Data parsed:", data); // Debug log

            // --- FIX IS HERE ---
            // Use data.class instead of data.predicted_class
            displayResults({
                diseaseName: data.class, // Use the key 'class' from the backend response
                confidence: data.confidence * 100,
                recommendations: generateRecommendation(data.class) // Pass data.class here too
            });
            // --- END FIX ---

        } catch (error) {
            console.error("Analysis Error:", error);
            showError(`Analysis failed: ${error.message}`);
        } finally {
            // --- REMOVED showLoading(false) ---

            // Always re-enable the buttons and file input regardless of success/error
            analyzeButton.disabled = false;
            uploadBtnLabel.style.pointerEvents = 'auto';
            uploadBtnLabel.style.opacity = '1';
        }
    });

    function showLoading(isLoading) {
        resultsSection.classList.remove('hidden'); // Show the section
        loadingIndicator.classList.toggle('hidden', !isLoading);
        resultsContent.classList.add('hidden'); // Hide results while loading/error
        errorDisplay.classList.add('hidden');   // Hide error while loading/results
    }

    function displayResults(data) {
        loadingIndicator.classList.add('hidden'); // Ensure loading is hidden
        errorDisplay.classList.add('hidden');     // Ensure error is hidden
        diseaseNameSpan.textContent = data.diseaseName;
        confidenceSpan.textContent = data.confidence.toFixed(2);
        recommendationsTextP.textContent = data.recommendations || "No specific recommendation available.";
        resultsContent.classList.remove('hidden'); // Show results content
        resultsSection.classList.remove('hidden'); // Ensure section stays visible
    }

    function showError(message) {
        loadingIndicator.classList.add('hidden'); // Ensure loading is hidden
        resultsContent.classList.add('hidden');   // Hide results content on error
        errorDisplay.textContent = message;
        errorDisplay.classList.remove('hidden');  // Show error message
        resultsSection.classList.remove('hidden'); // Ensure section stays visible
    }

    function resetUI() {
        fileNameDisplay.textContent = 'No file chosen';
        fileNameDisplay.style.fontStyle = 'italic';
        imagePreviewDiv.classList.add('hidden');
        previewImg.src = '#';
        analyzeButton.disabled = true;
        selectedFile = null;
        resultsSection.classList.add('hidden'); // Hide results section on reset
        errorDisplay.classList.add('hidden');   // Hide any previous error
        resultsContent.classList.add('hidden'); // Hide any previous results
    }

    function generateRecommendation(diseaseName) {
        // This function remains the same, just ensure the correct diseaseName is passed in
        switch (diseaseName) {
            case "Anthracnose":
                return "Apply appropriate fungicides (e.g., copper-based or mancozeb). Prune affected twigs and leaves during dry weather. Improve air circulation by proper spacing and pruning. Collect and destroy fallen leaves and fruit.";
            case "Bacterial Canker":
                return "Use copper-based bactericides preventatively, especially before rainy seasons. Prune infected branches well below the canker during dry weather, disinfecting tools between cuts (e.g., with 10% bleach solution). Avoid wounding trees.";
            case "Cutting Weevil":
                return "Monitor for adult weevils and larvae. Handpick adults if infestation is low. Apply appropriate insecticides targeting weevils during vulnerable stages. Remove and destroy infested plant debris.";
            case "Die Back":
                return "Prune dead or dying branches back to healthy wood, making cuts just above a node or lateral branch. Disinfect pruning tools. Improve plant vigor through proper fertilization and watering. Manage underlying causes like fungal infections or pests.";
            case "Gall Midge":
                return "Prune and destroy infested buds or leaves containing galls before midges emerge. Apply systemic insecticides if infestation is severe and timing is appropriate for the midge life cycle. Encourage natural predators.";
            case "Healthy":
                return "The leaf appears healthy. Maintain good agricultural practices: balanced fertilization, appropriate watering, good sanitation, and regular monitoring for pests and diseases.";
            case "Powdery Mildew":
                return "Apply fungicides like sulfur, potassium bicarbonate, or neem oil at the first sign of disease. Improve air circulation. Avoid overhead watering, especially late in the day. Prune out heavily infected areas.";
            case "Sooty Mould": // Corrected spelling if needed (Mould vs Mold)
                return "Control the sap-sucking insects (aphids, scale, mealybugs) that produce honeydew, which the mold grows on. Use insecticidal soap or horticultural oil. Gently wash the mould off leaves with a mild soap solution if necessary.";
            default:
                return `No specific recommendation available for '${diseaseName}'. Consult an agricultural extension agent or plant pathologist for advice.`;
        }
    }

    // Chat popup (optional – placeholder if you add popup modal)
    chatPopupBtn?.addEventListener("click", () => {
        // Example: Open a new tab/window. Replace with your chat implementation.
         window.open("http://localhost:3000", "_blank"); // Make sure this is your intended chat URL
    });

    // Optional: Add listener for closeChat if you have that button
    // closeChat?.addEventListener("click", () => { /* ... code to close chat ... */ });
});