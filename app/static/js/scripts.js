document.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
       ELEMENTS
    ========================================================= */

    const form = document.getElementById("uploadForm");
    const fileInput = document.getElementById("fileInput");
    const uploadArea = document.getElementById("uploadArea");

    const selectedFile = document.getElementById("selectedFile");
    const fileName = document.getElementById("fileName");
    const fileSize = document.getElementById("fileSize");
    const removeFile = document.getElementById("removeFile");

    const uploadTitle = document.getElementById("uploadTitle");
    const uploadHint = document.getElementById("uploadHint");

    const loading = document.getElementById("loading");
    const loadingMessage = document.getElementById("loadingMessage");

    const results = document.getElementById("results");

    let selectedResume = null;
    let loadingInterval = null;


    /* =========================================================
       FILE SIZE
    ========================================================= */

    function formatFileSize(bytes) {

        if (bytes < 1024) {
            return `${bytes} B`;
        }

        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }

        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }


    /* =========================================================
       FILE SELECTION
    ========================================================= */

    function handleFile(file) {

        if (!file) {
            return;
        }

        if (
            file.type !== "application/pdf" &&
            !file.name.toLowerCase().endsWith(".pdf")
        ) {

            showError("Please upload a PDF resume.");

            fileInput.value = "";

            return;
        }

        if (file.size > 10 * 1024 * 1024) {

            showError("File size must be less than 10 MB.");

            fileInput.value = "";

            return;
        }

        selectedResume = file;

        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);

        selectedFile.classList.add("show");

        uploadTitle.textContent = "Resume selected";

        uploadHint.textContent =
            "Click to choose another PDF";

        uploadArea.classList.add("has-file");

        clearResults();
        clearError();
    }


    fileInput.addEventListener("change", () => {

        handleFile(fileInput.files[0]);

    });


    /* =========================================================
       REMOVE FILE
    ========================================================= */

    if (removeFile) {

        removeFile.addEventListener("click", (event) => {

            event.preventDefault();
            event.stopPropagation();

            selectedResume = null;

            fileInput.value = "";

            selectedFile.classList.remove("show");

            uploadTitle.textContent =
                "Drop your PDF here";

            uploadHint.textContent =
                "or click to browse from your computer";

            uploadArea.classList.remove("has-file");

            clearResults();
            clearError();

        });

    }


    /* =========================================================
       DRAG & DROP
    ========================================================= */

    [
        "dragenter",
        "dragover"
    ].forEach(eventName => {

        uploadArea.addEventListener(eventName, event => {

            event.preventDefault();
            event.stopPropagation();

            uploadArea.classList.add("dragging");

        });

    });


    [
        "dragleave",
        "drop"
    ].forEach(eventName => {

        uploadArea.addEventListener(eventName, event => {

            event.preventDefault();
            event.stopPropagation();

            uploadArea.classList.remove("dragging");

        });

    });


    uploadArea.addEventListener("drop", event => {

        const files = event.dataTransfer.files;

        if (files && files.length > 0) {
            handleFile(files[0]);
        }

    });


    /* =========================================================
       LOADING
    ========================================================= */

    const loadingMessages = [

        "Extracting resume content...",

        "Analyzing your skills...",

        "Checking ATS compatibility...",

        "Evaluating resume structure...",

        "Reviewing your experience...",

        "Generating AI recommendations..."

    ];


    function startLoading() {

        if (!loading) {
            return;
        }

        loading.classList.add("show");

        let index = 0;

        if (loadingMessage) {

            loadingMessage.textContent =
                loadingMessages[index];

        }

        loadingInterval = setInterval(() => {

            index =
                (index + 1) %
                loadingMessages.length;

            if (loadingMessage) {

                loadingMessage.textContent =
                    loadingMessages[index];

            }

        }, 1800);

    }


    function stopLoading() {

        if (loading) {
            loading.classList.remove("show");
        }

        if (loadingInterval) {

            clearInterval(loadingInterval);

            loadingInterval = null;

        }

    }


    /* =========================================================
       FORM SUBMISSION
    ========================================================= */

    form.addEventListener("submit", async event => {

        event.preventDefault();

        if (!selectedResume) {

            showError(
                "Please select your resume before analyzing."
            );

            return;
        }

        clearResults();
        clearError();

        startLoading();

        const formData = new FormData();

        formData.append(
            "resume",
            selectedResume
        );

        try {

            const response = await fetch(
                "/upload",
                {
                    method: "POST",
                    body: formData
                }
            );


            const contentType =
                response.headers.get("content-type") || "";


            let data;


            if (contentType.includes("application/json")) {

                data = await response.json();

            } else {

                const text =
                    await response.text();

                try {

                    data = JSON.parse(text);

                } catch {

                    throw new Error(
                        "Server returned an invalid response."
                    );

                }

            }


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    data.message ||
                    "Resume analysis failed."
                );

            }


            stopLoading();

            renderResults(data);


            setTimeout(() => {

                if (results) {

                    results.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }

            }, 200);


        } catch (error) {

            stopLoading();

            showError(
                error.message ||
                "Something went wrong while analyzing your resume."
            );

        }

    });


    /* =========================================================
       MAIN RESULTS RENDERER
    ========================================================= */

    function renderResults(data) {

        clearResults();

        /*
         * IMPORTANT:
         *
         * Your backend returns the ATS score inside:
         *
         * data.atsScore.score
         *
         * and the category scores inside:
         *
         * data.atsScore.scoreBreakdown
         */

        const score =
            getScore(data);


        const breakdown =
            getBreakdown(data);


        const summary =
            getSummary(data);


        const strengths =
            getStrengths(data);


        const improvements =
            getImprovements(data);


        const skills =
            getSkills(data);


        const sections =
            getSections(data);


        const scoreLabel =
            getScoreLabel(score);


        const scoreStatus =
            getScoreStatus(score);


        const circumference =
            2 * Math.PI * 55;


        const percentage =
            Math.max(
                0,
                Math.min(
                    100,
                    score
                )
            );


        const offset =
            circumference -
            (
                percentage / 100
            ) *
            circumference;


        const dashboard =
            document.createElement("div");


        dashboard.className =
            "results-dashboard";


        dashboard.innerHTML = `

            <!-- ==========================================
                 RESULTS HEADER
            =========================================== -->

            <div class="results-header">

                <div>

                    <span class="section-kicker">
                        02 / RESULTS
                    </span>

                    <h2>
                        Your resume analysis
                    </h2>

                    <p>
                        AI-powered insights to improve
                        your ATS compatibility.
                    </p>

                </div>


                <button
                    class="secondary-btn"
                    id="analyzeAgain"
                    type="button"
                >

                    <i class="fa-solid fa-rotate-right"></i>

                    Analyze another

                </button>

            </div>



            <!-- ==========================================
                 ATS SCORE
            =========================================== -->

            <div class="score-panel">

                <div class="score-main">

                    <div class="score-ring">

                        <svg viewBox="0 0 130 130">

                            <circle
                                class="ring-bg"
                                cx="65"
                                cy="65"
                                r="55"
                            ></circle>


                            <circle
                                class="ring-value"
                                cx="65"
                                cy="65"
                                r="55"
                                stroke-dasharray="${circumference}"
                                stroke-dashoffset="${offset}"
                            ></circle>

                        </svg>


                        <div class="ring-label">

                            <strong>
                                ${score}
                            </strong>

                            <span>
                                / 100
                            </span>

                        </div>

                    </div>


                    <div class="score-copy">

                        <span class="score-badge">

                            <i class="fa-solid fa-chart-line"></i>

                            ATS readiness

                        </span>


                        <h3>
                            ${escapeHtml(scoreLabel)}
                        </h3>


                        <p>
                            ${escapeHtml(summary)}
                        </p>

                    </div>

                </div>


                <div class="score-summary">

                    <span>
                        RESUME STATUS
                    </span>

                    <strong>
                        ${escapeHtml(scoreStatus)}
                    </strong>

                    <small>
                        Your ATS score is based on keywords,
                        formatting, experience, skills and education.
                    </small>

                </div>

            </div>



            <!-- ==========================================
                 SCORE BREAKDOWN
            =========================================== -->

            <div class="metrics-grid">

                ${metricCard(
                    "Keywords",
                    breakdown.keywords,
                    25,
                    "fa-key"
                )}

                ${metricCard(
                    "Structure",
                    breakdown.formatting,
                    20,
                    "fa-layer-group"
                )}

                ${metricCard(
                    "Experience",
                    breakdown.experience,
                    25,
                    "fa-briefcase"
                )}

                ${metricCard(
                    "Skills",
                    breakdown.skills,
                    20,
                    "fa-code"
                )}

                ${metricCard(
                    "Education",
                    breakdown.education,
                    10,
                    "fa-graduation-cap"
                )}

            </div>



            <!-- ==========================================
                 AI RECOMMENDATIONS
            =========================================== -->

            <div class="recommendation-card">

                <div class="recommendation-heading">

                    <div class="icon-box">

                        <i class="fa-solid fa-wand-magic-sparkles"></i>

                    </div>


                    <div>

                        <span class="section-kicker">
                            AI RECOMMENDATIONS
                        </span>

                        <h3>
                            High-impact improvements
                        </h3>

                    </div>

                </div>


                <ul>

                    ${
                        improvements.length
                        ? improvements
                            .slice(0, 8)
                            .map(item => `
                                <li>
                                    ${escapeHtml(item)}
                                </li>
                            `)
                            .join("")
                        : `
                            <li>
                                Your resume is in good shape.
                                Continue adding measurable achievements
                                and job-specific keywords.
                            </li>
                        `
                    }

                </ul>

            </div>



            <!-- ==========================================
                 STRENGTHS + OPPORTUNITIES
            =========================================== -->

            <div class="insight-grid">


                <div class="insight-card positive">

                    <div class="insight-head">

                        <div class="icon-box green">

                            <i class="fa-solid fa-circle-check"></i>

                        </div>


                        <div>

                            <span class="section-kicker">
                                STRENGTHS
                            </span>

                            <h3>
                                What's working
                            </h3>

                        </div>

                    </div>


                    <ul>

                        ${
                            strengths.length
                            ? strengths
                                .slice(0, 8)
                                .map(item => `
                                    <li>
                                        ${escapeHtml(item)}
                                    </li>
                                `)
                                .join("")
                            : `
                                <li>
                                    Your resume contains
                                    useful professional information.
                                </li>
                            `
                        }

                    </ul>

                </div>



                <div class="insight-card warning">

                    <div class="insight-head">

                        <div class="icon-box amber">

                            <i class="fa-solid fa-triangle-exclamation"></i>

                        </div>


                        <div>

                            <span class="section-kicker">
                                OPPORTUNITIES
                            </span>

                            <h3>
                                What to improve
                            </h3>

                        </div>

                    </div>


                    <ul>

                        ${
                            improvements.length
                            ? improvements
                                .slice(0, 8)
                                .map(item => `
                                    <li>
                                        ${escapeHtml(item)}
                                    </li>
                                `)
                                .join("")
                            : `
                                <li>
                                    Add more quantified achievements.
                                </li>

                                <li>
                                    Tailor keywords to the target job.
                                </li>
                            `
                        }

                    </ul>

                </div>

            </div>



            <!-- ==========================================
                 DETECTED SKILLS
            =========================================== -->

            ${
                skills.length
                ? `

                    <div class="section-result">

                        <div class="section-result-title">

                            <div class="section-icon">

                                <i class="fa-solid fa-code"></i>

                            </div>


                            <div>

                                <span class="section-kicker">
                                    DETECTED SKILLS
                                </span>

                                <h3>
                                    Skills found in your resume
                                </h3>

                            </div>

                        </div>


                        <div class="hero-pills">

                            ${
                                skills
                                    .slice(0, 30)
                                    .map(skill => `
                                        <span>
                                            <i class="fa-solid fa-check"></i>
                                            ${escapeHtml(skill)}
                                        </span>
                                    `)
                                    .join("")
                            }

                        </div>

                    </div>

                `
                : ""
            }



            <!-- ==========================================
                 DETAILED SECTION ANALYSIS
            =========================================== -->

            ${renderSections(sections)}

        `;


        results.appendChild(dashboard);


        /* ==========================================
           ANALYZE AGAIN
        =========================================== */

        const analyzeAgain =
            document.getElementById("analyzeAgain");


        if (analyzeAgain) {

            analyzeAgain.addEventListener(
                "click",
                () => {

                    window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });

                    fileInput.click();

                }
            );

        }

    }


    /* =========================================================
       SCORE
    ========================================================= */

    function getScore(data) {

        const value =
            data?.atsScore?.score ??
            data?.score ??
            data?.ats_score ??
            data?.ATS_score ??
            data?.total_score ??
            data?.resume_score;


        const score =
            Number(value);


        if (
            Number.isFinite(score)
        ) {

            return Math.round(
                Math.max(
                    0,
                    Math.min(
                        100,
                        score
                    )
                )
            );

        }


        return 0;
    }


    /* =========================================================
       SCORE BREAKDOWN
    ========================================================= */

    function getBreakdown(data) {

        const breakdown =
            data?.atsScore?.scoreBreakdown ||
            {};


        return {

            keywords:
                Number(
                    breakdown.keywords || 0
                ),

            formatting:
                Number(
                    breakdown.formatting || 0
                ),

            experience:
                Number(
                    breakdown.experience || 0
                ),

            skills:
                Number(
                    breakdown.skills || 0
                ),

            education:
                Number(
                    breakdown.education || 0
                )

        };

    }


    /* =========================================================
       METRIC CARD
    ========================================================= */

    function metricCard(
        title,
        value,
        maximum,
        icon
    ) {

        const points =
            Number(value) || 0;


        const percentage =
            maximum > 0
            ? Math.round(
                (
                    points /
                    maximum
                ) * 100
            )
            : 0;


        const safePercentage =
            Math.max(
                0,
                Math.min(
                    100,
                    percentage
                )
            );


        return `

            <div class="metric-card">

                <div class="metric-top">

                    <span>

                        <i class="fa-solid ${icon}"></i>

                        ${title}

                    </span>


                    <strong>
                        ${safePercentage}%
                    </strong>

                </div>


                <div class="metric-track">

                    <i
                        style="width:${safePercentage}%"
                    ></i>

                </div>


                <small>
                    ${points} / ${maximum} points
                </small>

            </div>

        `;

    }


    /* =========================================================
       SUMMARY
    ========================================================= */

    function getSummary(data) {

        const overall =
            data?.feedback?.overallAssessment;


        return (
            overall?.summary ||
            overall?.overallAssessment ||
            data?.summary ||
            data?.overall_summary ||
            data?.overview ||
            "Your resume has been analyzed. Review the recommendations below to improve ATS compatibility."
        );

    }


    /* =========================================================
       STRENGTHS
    ========================================================= */

    function getStrengths(data) {

        const strengths =
            data?.feedback
                ?.overallAssessment
                ?.strengths;


        if (Array.isArray(strengths)) {

            return strengths
                .map(item =>
                    typeof item === "string"
                    ? item
                    : (
                        item?.text ||
                        item?.description ||
                        item?.message ||
                        ""
                    )
                )
                .filter(Boolean);

        }


        return [];

    }


    /* =========================================================
       IMPROVEMENTS
    ========================================================= */

    function getImprovements(data) {

        const atsImprovements =
            data?.atsScore?.improvements;


        const overallImprovements =
            data?.feedback
                ?.overallAssessment
                ?.areasForImprovement;


        const improvements =
            Array.isArray(atsImprovements)
            ? atsImprovements
            : Array.isArray(overallImprovements)
                ? overallImprovements
                : [];


        return improvements
            .map(item =>
                typeof item === "string"
                ? item
                : (
                    item?.text ||
                    item?.description ||
                    item?.message ||
                    ""
                )
            )
            .filter(Boolean);

    }


    /* =========================================================
       SKILLS
    ========================================================= */

    function getSkills(data) {

        const skillSection =
            data?.feedback?.skillsSection;


        const possibleSkills = [

            skillSection?.skills,

            skillSection?.technicalSkills,

            skillSection?.detectedSkills,

            data?.skills,

            data?.detected_skills

        ];


        for (const value of possibleSkills) {

            if (Array.isArray(value)) {

                return value
                    .map(skill => {

                        if (
                            typeof skill === "string"
                        ) {
                            return skill;
                        }

                        return (
                            skill?.name ||
                            skill?.skill ||
                            skill?.text ||
                            ""
                        );

                    })
                    .filter(Boolean);

            }

        }


        return [];

    }


    /* =========================================================
       SECTION ANALYSIS
    ========================================================= */

    function getSections(data) {

        const feedback =
            data?.feedback;


        if (
            !feedback ||
            typeof feedback !== "object"
        ) {

            return {};

        }


        return feedback;

    }


    function renderSections(sections) {

        if (
            !sections ||
            typeof sections !== "object"
        ) {

            return "";

        }


        const excluded = [
            "overallAssessment"
        ];


        const entries =
            Object.entries(sections)
                .filter(
                    ([key]) =>
                        !excluded.includes(key)
                );


        if (!entries.length) {

            return "";

        }


        return `

            <div class="detailed-analysis">

                <div class="detailed-header">

                    <span class="section-kicker">
                        DETAILED ANALYSIS
                    </span>

                    <h3>
                        Section-by-section feedback
                    </h3>

                </div>


                <div class="section-analysis-grid">

                    ${
                        entries
                            .map(
                                ([name, value]) =>
                                    renderSection(
                                        name,
                                        value
                                    )
                            )
                            .join("")
                    }

                </div>

            </div>

        `;

    }


    function renderSection(
        name,
        value
    ) {

        const title =
            formatTitle(name);


        const items =
            flattenSection(value);


        return `

            <div class="section-result">

                <div class="section-result-title">

                    <div class="section-icon">

                        <i class="fa-solid fa-file-lines"></i>

                    </div>


                    <div>

                        <span class="section-kicker">
                            RESUME SECTION
                        </span>

                        <h3>
                            ${escapeHtml(title)}
                        </h3>

                    </div>

                </div>


                ${
                    items.length
                    ? `
                        <ul>

                            ${
                                items
                                    .slice(0, 8)
                                    .map(item => `
                                        <li>
                                            ${escapeHtml(item)}
                                        </li>
                                    `)
                                    .join("")
                            }

                        </ul>
                    `
                    : `
                        <p class="empty-note">
                            No additional feedback available.
                        </p>
                    `
                }

            </div>

        `;

    }


    /* =========================================================
       FLATTEN AI RESPONSE
    ========================================================= */

    function flattenSection(value) {

        const output = [];


        function walk(item) {

            if (!item) {
                return;
            }


            if (typeof item === "string") {

                output.push(item);

                return;

            }


            if (Array.isArray(item)) {

                item.forEach(walk);

                return;

            }


            if (typeof item === "object") {

                /*
                 * Ignore technical/internal keys.
                 */

                const ignoredKeys = [
                    "score",
                    "percentage",
                    "id"
                ];


                Object.entries(item)
                    .forEach(
                        ([key, child]) => {

                            if (
                                ignoredKeys
                                    .includes(key)
                            ) {
                                return;
                            }


                            if (
                                typeof child ===
                                "string"
                            ) {

                                output.push(
                                    `${formatTitle(key)}: ${child}`
                                );

                            } else {

                                walk(child);

                            }

                        }
                    );

            }

        }


        walk(value);


        return [
            ...new Set(
                output.filter(Boolean)
            )
        ];

    }


    /* =========================================================
       SCORE LABEL
    ========================================================= */

    function getScoreLabel(score) {

        if (score >= 85) {
            return "Excellent resume";
        }

        if (score >= 70) {
            return "Strong resume";
        }

        if (score >= 55) {
            return "Good foundation";
        }

        if (score >= 40) {
            return "Needs improvement";
        }

        return "Needs major improvement";

    }


    /* =========================================================
       SCORE STATUS
    ========================================================= */

    function getScoreStatus(score) {

        if (score >= 85) {
            return "Highly competitive";
        }

        if (score >= 70) {
            return "Recruiter ready";
        }

        if (score >= 55) {
            return "Moderately ready";
        }

        return "Needs optimization";

    }


    /* =========================================================
       FORMAT TITLES
    ========================================================= */

    function formatTitle(text) {

        return String(text)
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .replace(/[_-]/g, " ")
            .replace(/\b\w/g, char =>
                char.toUpperCase()
            );

    }


    /* =========================================================
       CLEAR RESULTS
    ========================================================= */

    function clearResults() {

        if (results) {
            results.innerHTML = "";
        }

    }


    /* =========================================================
       ERROR
    ========================================================= */

    function showError(message) {

        clearResults();


        const error =
            document.createElement("div");


        error.className =
            "error-card";


        error.innerHTML = `

            <i class="fa-solid fa-circle-exclamation"></i>


            <div>

                <h3>
                    Something went wrong
                </h3>

                <p>
                    ${escapeHtml(message)}
                </p>

            </div>

        `;


        results.appendChild(error);


        results.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }


    function clearError() {

        const existingError =
            results?.querySelector(
                ".error-card"
            );


        if (existingError) {
            existingError.remove();
        }

    }


    /* =========================================================
       HTML ESCAPE
    ========================================================= */

    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }

});