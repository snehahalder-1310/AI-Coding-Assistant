import os

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from huggingface_hub import InferenceClient


# ============================================================
# HUGGING FACE SETUP
# ============================================================

hf_token = os.environ.get("HF_TOKEN")

if not hf_token:
    raise RuntimeError("HF_TOKEN environment variable is not set.")

client = InferenceClient(
    api_key=hf_token
)

MODEL_NAME = "Qwen/Qwen2.5-Coder-7B-Instruct"


# ============================================================
# FLASK APP
# ============================================================

app = Flask(__name__)
CORS(app)


# ============================================================
# PROMPT GENERATION
# ============================================================

def generate_prompts(question, language, task_type):

    if task_type == "Generate Code":

        prompt1 = f"""
You are a {language} programming tutor.

The user wants help with the following task:

{question}

Create a beginner-friendly solution.
Explain the concept step-by-step.
Provide simple and readable {language} code.
Include an example and explain time and space complexity.
"""

        prompt2 = f"""
Act as an expert {language} programming assistant.

Solve the following programming task:

{question}

Provide an efficient and technically sound solution.
Use appropriate algorithms and data structures.
Provide complete {language} code.
Explain the algorithm, correctness, time complexity,
space complexity, and sample input/output.
"""

        prompt3 = f"""
Act as a competitive programming and technical interview expert.

Solve this {language} programming problem:

{question}

Provide an optimized solution.
Consider edge cases and important constraints.
Explain the algorithm clearly.
Provide clean executable {language} code.
Include sample input/output and analyze time and space complexity.
"""

        return prompt1, prompt2, prompt3


    elif task_type == "Explain Code":

        prompt1 = f"""
You are a {language} programming tutor.

Explain the following {language} code:

{question}

Explain the code in simple and beginner-friendly language.
Explain the logic step-by-step.
Describe the important statements.
Also explain the time and space complexity.
"""

        prompt2 = f"""
Act as an expert {language} programming assistant.

Explain the following {language} code:

{question}

Provide a clear technical explanation.
Explain the logic, important statements, algorithm,
time complexity, and space complexity.
Use examples where helpful.
"""

        prompt3 = f"""
Act as a competitive programming and technical interview expert.

Analyze and explain the following {language} code:

{question}

Explain the algorithm and implementation.
Discuss important logic, edge cases, time complexity,
space complexity, and possible improvements.
"""

        return prompt1, prompt2, prompt3


    elif task_type == "Debug Code":

        debug_prompt = f"""
Act as an expert {language} debugging assistant.

Debug the following {language} code:

{question}

Carefully identify all syntax errors, logical errors,
runtime errors, and indentation issues.

For each error:
1. Identify the exact problem.
2. Explain why it is an error.
3. Show how to fix it.

Then provide the complete corrected {language} code.

Finally, briefly explain the important changes and
mention any important edge cases if necessary.
"""

        return debug_prompt, None, None


# ============================================================
# AI RESPONSE GENERATION
# ============================================================

def generate_response(selected_prompt):

    completion = client.chat_completion(
        model=MODEL_NAME,
        messages=[
            {
                "role": "system",
                "content": """
You are an AI Coding Assistant.

Follow the user's selected prompt exactly.

IMPORTANT RULES:

1. Follow every requirement mentioned in the user's prompt.
2. If the prompt asks for an algorithm, provide an Algorithm section.
3. If the prompt asks for correctness, provide a Correctness section.
4. If the prompt asks for time complexity, provide it.
5. If the prompt asks for space complexity, provide it.
6. If the prompt asks for sample input/output, provide it.
7. If the prompt asks for explanation, provide a clear explanation.
8. Always provide complete executable code.
9. Put code inside a Markdown code block.
10. Use the correct language identifier:
    C -> ```c
    C++ -> ```cpp
    Python -> ```python
    Java -> ```java
11. Use clear headings.
12. Keep explanations simple and understandable.
13. Do not repeat the user's prompt.
14. Do not add unnecessary sections.
15. For debugging, identify the errors, explain them,
    and provide the complete corrected code.
16. Do not cut off the code.
17. The user's selected prompt decides what information
    should appear in the final answer.

Give a clean, well-structured programming answer.
"""
            },
            {
                "role": "user",
                "content": selected_prompt
            }
        ],
        max_tokens=1500,
        temperature=0.3
    )

    response = completion.choices[0].message.content

    return response


# ============================================================
# HOME PAGE
# ============================================================

@app.route("/")
def home():
    return render_template("index.html")


# ============================================================
# GENERATE RESPONSE API
# ============================================================

@app.route("/generate", methods=["POST"])
def generate():

    try:

        data = request.get_json()

        language = data.get("language")
        task_type = data.get("task_type")
        question = data.get("question")
        prompt_choice = data.get("prompt_choice")


        # Check question
        if not question or not question.strip():

            return jsonify({
                "success": False,
                "error": "Please enter a programming request or paste your code."
            })


        # Generate the three prompt versions
        prompt1, prompt2, prompt3 = generate_prompts(
            question,
            language,
            task_type
        )


        # Select prompt
        if task_type == "Debug Code":

            selected_prompt = prompt1
            prompt_name = "Debugging Prompt"

        else:

            if prompt_choice == "Beginner-focused":

                selected_prompt = prompt1
                prompt_name = "Beginner-focused"

            elif prompt_choice == "Technical":

                selected_prompt = prompt2
                prompt_name = "Technical"

            else:

                selected_prompt = prompt3
                prompt_name = "Interview-focused"


        # Generate AI response
        response = generate_response(selected_prompt)


        # Send result to frontend
        return jsonify({
            "success": True,
            "language": language,
            "task_type": task_type,
            "prompt_name": prompt_name,
            "question": question,
            "selected_prompt": selected_prompt,
            "response": response
        })


    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        })


# ============================================================
# RUN FLASK
# ============================================================

if __name__ == "__main__":

    port = int(os.environ.get("PORT", 5000))

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )
