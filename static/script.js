
const language = document.getElementById("language");

const taskType = document.getElementById("task_type");

const question = document.getElementById("question");

const promptSection =
    document.getElementById("prompt-section");

const generateBtn =
    document.getElementById("generate-btn");

const buttonText =
    document.getElementById("button-text");

const loadingText =
    document.getElementById("loading-text");

const errorBox =
    document.getElementById("error-box");

const results =
    document.getElementById("results");

const questionTitle =
    document.getElementById("question-title");

const charCount =
    document.getElementById("char-count");


/* ==============================
   TASK TYPE CHANGE
============================== */

taskType.addEventListener("change", function () {

    if (taskType.value === "Debug Code") {

        promptSection.style.display = "none";

        questionTitle.textContent =
            "🐛 Paste Your Code to Debug";

        question.placeholder =
            "Paste your code here...";

    }

    else if (taskType.value === "Explain Code") {

        promptSection.style.display = "block";

        questionTitle.textContent =
            "📖 Paste Your Code to Explain";

        question.placeholder =
            "Paste the code you want the AI to explain...";

    }

    else {

        promptSection.style.display = "block";

        questionTitle.textContent =
            "💻 Enter Your Coding Request";

        question.placeholder =
            "Example: Write a Python program to check whether a number is prime.";

    }

});


/* ==============================
   CHARACTER COUNT
============================== */

question.addEventListener("input", function () {

    charCount.textContent =
        question.value.length + " characters";

});


/* ==============================
   GENERATE RESPONSE
============================== */

generateBtn.addEventListener("click", async function () {

    errorBox.style.display = "none";

    results.style.display = "none";


    if (!question.value.trim()) {

        errorBox.textContent =
            "Please enter a programming request or paste your code.";

        errorBox.style.display = "block";

        return;
    }


    let promptChoice = "Beginner-focused";


    const selectedPrompt =
        document.querySelector(
            'input[name="prompt_choice"]:checked'
        );


    if (selectedPrompt) {

        promptChoice =
            selectedPrompt.value;

    }


    const data = {

        language: language.value,

        task_type: taskType.value,

        question: question.value,

        prompt_choice: promptChoice

    };


    generateBtn.disabled = true;

    buttonText.style.display = "none";

    loadingText.style.display = "inline";


    try {

        const response =
            await fetch("/generate", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(data)

            });


        const result =
            await response.json();


        if (!result.success) {

            throw new Error(
                result.error || "Something went wrong."
            );

        }


        /* ==============================
           SHOW SELECTION
        ============================== */

        document.getElementById(
            "selection-result"
        ).innerHTML = `

            <p>
                <strong>Programming Language:</strong>
                ${escapeHtml(result.language)}
            </p>

            <p>
                <strong>Task Type:</strong>
                ${escapeHtml(result.task_type)}
            </p>

            <p>
                <strong>Prompt Style:</strong>
                ${escapeHtml(result.prompt_name)}
            </p>

        `;


        /* ==============================
           SHOW PROMPT
        ============================== */

        document.getElementById(
            "prompt-result"
        ).textContent =
            result.selected_prompt;


        /* ==============================
           SHOW AI RESPONSE
        ============================== */

        document.getElementById(
            "response-result"
        ).textContent =
            result.response;


        results.style.display = "block";


        window.scrollTo({

            top: results.offsetTop - 20,

            behavior: "smooth"

        });


    }

    catch (error) {

        errorBox.textContent =
            "Error: " + error.message;

        errorBox.style.display = "block";

    }

    finally {

        generateBtn.disabled = false;

        buttonText.style.display = "inline";

        loadingText.style.display = "none";

    }

});


/* ==============================
   COPY PROMPT
============================== */

function copyPrompt() {

    const text =
        document.getElementById(
            "prompt-result"
        ).textContent;

    navigator.clipboard.writeText(text);

}


/* ==============================
   COPY RESPONSE
============================== */

function copyResponse() {

    const text =
        document.getElementById(
            "response-result"
        ).textContent;

    navigator.clipboard.writeText(text);

}


/* ==============================
   HTML ESCAPE
============================== */

function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}
