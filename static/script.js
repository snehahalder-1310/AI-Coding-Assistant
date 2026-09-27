
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


/* TASK TYPE CHANGE */

taskType.addEventListener("change", function () {

    if (taskType.value === "Debug Code") {

        promptSection.style.display = "none";

        questionTitle.textContent =
            "Paste Your Code to Debug";

        question.placeholder =
            "Paste your code here...";

    }

    else if (taskType.value === "Explain Code") {

        promptSection.style.display = "block";

        questionTitle.textContent =
            "Paste Your Code to Explain";

        question.placeholder =
            "Paste the code you want the AI to explain...";

    }

    else {

        promptSection.style.display = "block";

        questionTitle.textContent =
            "Enter Your Coding Request";

        question.placeholder =
            "Example: Write a Python program to check whether a number is prime.";

    }

});


/*CHARACTER COUNT */

question.addEventListener("input", function () {

    charCount.textContent =
        question.value.length + " characters";

});


/* GENERATE RESPONSE */

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


        /*SHOW SELECTION */

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


        /* SHOW PROMPT */

        document.getElementById(
            "prompt-result"
        ).textContent =
            result.selected_prompt;


        /* SHOW AI RESPONSE */

        renderAIResponse(result.response);

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


/* COPY PROMPT*/

function copyPrompt() {

    const text =
        document.getElementById(
            "prompt-result"
        ).textContent;

    navigator.clipboard.writeText(text);

}


/* COPY RESPONSE*/

function copyResponse() {

    const responseElement =
        document.getElementById("response-result");

    const text = responseElement.innerText.trim();

    navigator.clipboard.writeText(text).then(() => {

        const button =
            document.getElementById("response-copy-btn");

        const originalText = button.textContent;

        button.textContent = "Copied ✓";

        setTimeout(() => {
            button.textContent = originalText;
        }, 1500);

    });

}


/* FORMAT AI RESPONSE*/

function renderAIResponse(text) {

    const container =
        document.getElementById("response-result");

    if (!text || !text.trim()) {

        container.innerHTML = `
            <p class="response-placeholder-title">
                No response generated
            </p>
            <p class="response-placeholder-text">
                Please try your request again.
            </p>
        `;

        return;
    }

    let source = text
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .trim();

    const codeBlocks = [];

    source = source.replace(
        /```([a-zA-Z0-9_+#.-]*)\n?([\s\S]*?)```/g,
        function(match, language, code) {

            const id = `__CODE_BLOCK_${codeBlocks.length}__`;

            codeBlocks.push({
                language: language || "code",
                code: code.trim()
            });

            return id;
        }
    );

    const lines = source.split("\n");
    const output = [];
    let inList = false;

    function closeList() {
        if (inList) {
            output.push("</ul>");
            inList = false;
        }
    }

    lines.forEach(function(rawLine) {

        const line = rawLine.trim();

        if (!line) {
            closeList();
            return;
        }

        const codeMatch =
            line.match(/^__CODE_BLOCK_(\d+)__$/);

        if (codeMatch) {

            closeList();

            const block =
                codeBlocks[Number(codeMatch[1])];

            output.push(`
                <div class="response-code-card">
                    <div class="response-code-header">
                        <span>${escapeHtml(block.language)}</span>
                        <button
                            class="code-copy-btn"
                            onclick="copyCodeBlock(this)">
                            Copy
                        </button>
                    </div>
                    <pre><code>${escapeHtml(block.code)}</code></pre>
                </div>
            `);

            return;
        }

        const headingMatch =
            line.match(/^#{1,3}\s+(.+)$/);

        if (headingMatch) {
            closeList();
            output.push(
                `<h3 class="ai-answer-heading">${formatInline(headingMatch[1])}</h3>`
            );
            return;
        }

        const boldTitle =
            line.match(/^\*\*(.+?)\*\*:?\s*$/);

        if (boldTitle) {
            closeList();
            output.push(
                `<h3 class="ai-answer-heading">${formatInline(boldTitle[1])}</h3>`
            );
            return;
        }

        const bulletMatch =
            line.match(/^(?:[-*]|•)\s+(.+)$/);

        if (bulletMatch) {

            if (!inList) {
                output.push('<ul class="ai-answer-list">');
                inList = true;
            }

            output.push(
                `<li>${formatInline(bulletMatch[1])}</li>`
            );

            return;
        }

        const numberMatch =
            line.match(/^\d+[.)]\s+(.+)$/);

        if (numberMatch) {

            if (!inList) {
                output.push('<ul class="ai-answer-list numbered-list">');
                inList = true;
            }

            output.push(
                `<li>${formatInline(numberMatch[1])}</li>`
            );

            return;
        }

        closeList();

        output.push(
            `<p class="ai-answer-paragraph">${formatInline(line)}</p>`
        );
    });

    closeList();

    container.innerHTML = output.join("");
}


function formatInline(text) {

    let safe = escapeHtml(text);

    safe = safe.replace(
        /`([^`]+)`/g,
        '<code class="inline-code">$1</code>'
    );

    safe = safe.replace(
        /\*\*(.+?)\*\*/g,
        "<strong>$1</strong>"
    );

    safe = safe.replace(
        /\*([^*]+)\*/g,
        "<em>$1</em>"
    );

    return safe;
}


function copyCodeBlock(button) {

    const code =
        button.closest(".response-code-card")
            .querySelector("code")
            .innerText;

    navigator.clipboard.writeText(code).then(() => {

        const original = button.textContent;

        button.textContent = "Copied ✓";

        setTimeout(() => {
            button.textContent = original;
        }, 1500);

    });
}


/* HTML ESCAPE */

function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}
