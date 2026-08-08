import os
import json
import time
from io import BytesIO

from dotenv import load_dotenv
from pdfminer.high_level import extract_text
from google import genai
from google.genai import types
from huggingface_hub import InferenceClient

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
HF_API_KEY = os.getenv("HF_API_KEY")

if not GEMINI_API_KEY and not HF_API_KEY:
    raise ValueError(
        "Set at least one of GEMINI_API_KEY or HF_API_KEY environment variables."
    )

gemini_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
hf_client = InferenceClient(api_key=HF_API_KEY) if HF_API_KEY else None

# Any instruct model on HF Inference Providers works here; change if needed.
HF_MODEL = "meta-llama/Llama-3.1-8B-Instruct"


def parse_resume(file):
    file_content = file.read()
    pdf_file = BytesIO(file_content)
    return extract_text(pdf_file)


def _build_prompt(resume_text):
    return f"""
Analyze this resume and provide detailed feedback in JSON format.

Resume:
{resume_text}

Return ONLY valid JSON in this format:

{{
  "atsScore": {{
    "score": 85,
    "scoreBreakdown": {{
      "keywords": 20,
      "formatting": 15,
      "experience": 25,
      "skills": 15,
      "education": 10
    }},
    "improvements": []
  }},
  "feedback": {{
    "overallAssessment": {{
      "strengths": [],
      "areasForImprovement": []
    }},
    "educationSection": {{
      "strengths": [],
      "areasForImprovement": []
    }},
    "extraCurricularActivities": {{
      "strengths": [],
      "areasForImprovement": []
    }},
    "awardsAndAchievements": {{
      "strengths": [],
      "areasForImprovement": []
    }},
    "professionalExperience": {{
      "strengths": [],
      "areasForImprovement": []
    }},
    "aboutMeSection": {{
      "strengths": [],
      "areasForImprovement": []
    }},
    "skillsSection": {{
      "strengths": [],
      "areasForImprovement": []
    }}
  }}
}}
"""


def _clean_content(content):
    content = content.strip()
    if content.startswith("```"):
        content = content.replace("```json", "").replace("```", "").strip()
    return content


def _call_gemini(prompt, max_retries=3, retry_delay=2):
    last_error = None
    for attempt in range(max_retries):
        try:
            print(f"[Gemini] Attempt {attempt+1}/{max_retries}")
            response = gemini_client.models.generate_content(
                model="gemini-3.1-flash-lite",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=2000,
                ),
            )
            return _clean_content(response.text)
        except Exception as e:
            last_error = str(e)
            print(f"[Gemini] Error: {last_error}")
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
    raise RuntimeError(last_error or "Gemini call failed")


def _call_huggingface(prompt, max_retries=3, retry_delay=2):
    last_error = None
    for attempt in range(max_retries):
        try:
            print(f"[HuggingFace] Attempt {attempt+1}/{max_retries}")
            completion = hf_client.chat.completions.create(
                model=HF_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=2000,
            )
            return _clean_content(completion.choices[0].message.content)
        except Exception as e:
            last_error = str(e)
            print(f"[HuggingFace] Error: {last_error}")
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
    raise RuntimeError(last_error or "Hugging Face call failed")


def analyze_resume(resume_text):
    prompt = _build_prompt(resume_text)

    content = None
    errors = {}

    # 1) Try Gemini first (if configured)
    if gemini_client:
        try:
            content = _call_gemini(prompt)
        except Exception as e:
            errors["gemini"] = str(e)

    # 2) Fallback to Hugging Face (if Gemini unavailable/failed and HF is configured)
    if not content and hf_client:
        try:
            content = _call_huggingface(prompt)
        except Exception as e:
            errors["huggingface"] = str(e)

    if not content:
        return {
            "error": "No response received from any provider.",
            "details": errors,
        }

    try:
        return json.loads(content)
    except Exception:
        try:
            start = content.find("{")
            end = content.rfind("}") + 1
            return json.loads(content[start:end])
        except Exception:
            return {
                "error": "Failed to parse AI response",
                "raw_content": content,
            }
