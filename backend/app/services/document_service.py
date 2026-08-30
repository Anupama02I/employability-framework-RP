import json
import os
import re
from typing import Any, Dict

from dotenv import load_dotenv
from groq import Groq
from pypdf import PdfReader
from docx import Document

from app.schemas.document_schema import (
    CourseTrainingProfile,
    CVProfile,
    DocumentClassificationResult,
    EmployabilityDocumentProfile,
    JobDescriptionProfile,
    UploadedDocumentContext,
    UploadedDocumentType,
)


load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

GROQ_MODEL = os.getenv(
    "GROQ_MODEL",
    "qwen/qwen3.6-27b"
)

if not GROQ_API_KEY:
    raise RuntimeError(
        "GROQ_API_KEY is missing from .env"
    )

groq_client = Groq(
    api_key=GROQ_API_KEY
)


MAX_DOCUMENT_TEXT_CHARACTERS = 30000
MAX_CONTEXT_TEXT_CHARACTERS = 20000


# Compact CV-presence vocabulary.
# Only the names of detected elements are stored; actual contact
# values/URLs are not added to the structured CV profile.
CV_DETECTED_ELEMENT_KEYS = [
    "name",
    "professional_headline",
    "email",
    "phone",
    "location",
    "linkedin",
    "github",
    "portfolio_website",
    "other_professional_links",
    "professional_summary",
    "career_objective",
    "education",
    "work_experience",
    "internship_experience",
    "projects",
    "technical_skills",
    "soft_skills",
    "tools_and_technologies",
    "certifications",
    "courses_training",
    "languages",
    "achievements_awards",
    "volunteering",
    "extracurricular_activities",
    "leadership_experience",
    "publications_research",
    "professional_memberships",
    "interests_hobbies",
    "references",
    "dates_periods",
    "project_descriptions",
    "work_descriptions",
    "quantified_achievements",
]


def clean_document_text(
    text: str
) -> str:

    if not text:
        return ""

    text = text.replace(
        "\x00",
        " "
    )

    text = re.sub(
        r"[ \t]+",
        " ",
        text
    )

    text = re.sub(
        r"\n{3,}",
        "\n\n",
        text
    )

    return text.strip()


def extract_text_from_pdf(
    file_path: str
) -> str:

    reader = PdfReader(
        file_path
    )

    extracted_pages = []

    for page in reader.pages:

        try:
            text = (
                page.extract_text()
                or ""
            )

        except Exception:
            text = ""

        text = clean_document_text(
            text
        )

        if text:
            extracted_pages.append(
                text
            )

    full_text = "\n\n".join(
        extracted_pages
    )

    full_text = clean_document_text(
        full_text
    )

    if (
        len(full_text)
        >
        MAX_DOCUMENT_TEXT_CHARACTERS
    ):
        full_text = full_text[
            :MAX_DOCUMENT_TEXT_CHARACTERS
        ]

    return full_text

def extract_text_from_docx(
    file_path: str
) -> str:

    document = Document(
        file_path
    )

    extracted_parts = []


    # Normal paragraphs
    for paragraph in document.paragraphs:

        text = clean_document_text(
            paragraph.text
        )

        if text:
            extracted_parts.append(
                text
            )


    # Tables
    for table in document.tables:

        for row in table.rows:

            row_values = []

            for cell in row.cells:

                text = clean_document_text(
                    cell.text
                )

                if text:
                    row_values.append(
                        text
                    )


            if row_values:

                extracted_parts.append(
                    " | ".join(
                        row_values
                    )
                )


    full_text = "\n".join(
        extracted_parts
    )

    full_text = clean_document_text(
        full_text
    )


    if (
        len(full_text)
        >
        MAX_DOCUMENT_TEXT_CHARACTERS
    ):

        full_text = full_text[
            :MAX_DOCUMENT_TEXT_CHARACTERS
        ]


    return full_text

def call_qwen_json(
    prompt: str,
    max_completion_tokens: int = 2500,
) -> str:

    response = (
        groq_client
        .chat
        .completions
        .create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            response_format={
                "type": "json_object"
            },
            reasoning_effort="none",
            reasoning_format="hidden",
            temperature=0.0,
            top_p=1.0,
            max_completion_tokens=
                max_completion_tokens,
        )
    )

    if (
        not response
        or
        not response.choices
        or
        not response
            .choices[0]
            .message
            .content
    ):
        raise RuntimeError(
            "Qwen returned an empty "
            "structured response."
        )

    return (
        response
        .choices[0]
        .message
        .content
        .strip()
    )


def extract_json_object(
    text: str
) -> Dict[str, Any]:

    if not text:
        raise ValueError(
            "Empty LLM response."
        )

    cleaned = text.strip()

    cleaned = re.sub(
        r"^```json\s*",
        "",
        cleaned,
        flags=re.IGNORECASE
    )

    cleaned = re.sub(
        r"^```\s*",
        "",
        cleaned
    )

    cleaned = re.sub(
        r"\s*```$",
        "",
        cleaned
    )

    try:
        result = json.loads(
            cleaned
        )

        if not isinstance(
            result,
            dict
        ):
            raise ValueError(
                "Structured response must "
                "be a JSON object."
            )

        return result

    except json.JSONDecodeError:
        pass

    start = cleaned.find(
        "{"
    )

    end = cleaned.rfind(
        "}"
    )

    if (
        start == -1
        or
        end == -1
        or
        end <= start
    ):
        raise ValueError(
            "Could not locate a JSON "
            "object in the model response."
        )

    result = json.loads(
        cleaned[
            start:end + 1
        ]
    )

    if not isinstance(
        result,
        dict
    ):
        raise ValueError(
            "Structured response must "
            "be a JSON object."
        )

    return result


def normalize_list_fields(
    data: Dict[str, Any],
    field_names,
) -> Dict[str, Any]:

    for field_name in field_names:

        if (
            data.get(
                field_name
            )
            is None
        ):
            data[
                field_name
            ] = []

    return data


def classify_document(
    document_text: str
) -> DocumentClassificationResult:

    if not document_text.strip():
        raise ValueError(
            "Document text is empty."
        )

    prompt = f"""
Classify this uploaded PDF for an employability and career-guidance chatbot.

Return ONLY one valid JSON object:

{{
  "document_type": "CV_RESUME",
  "reason": ""
}}

Allowed document_type values:

1. CV_RESUME
2. JOB_DESCRIPTION
3. COURSE_TRAINING
4. EMPLOYABILITY_DOCUMENT
5. UNSUPPORTED

============================================================
CLASSIFICATION DEFINITIONS
============================================================

CV_RESUME:
A document describing one person's own career background,
such as education, employment, projects, skills,
certificates, professional profile, achievements or
similar personal history.

JOB_DESCRIPTION:
A job vacancy, role profile or recruitment document
describing a job's duties, requirements, qualifications,
skills, experience, employer expectations or application
information.

COURSE_TRAINING:
A course, training programme, certification programme,
qualification pathway, intake, training brochure or
similar learning opportunity describing content, entry
requirements, duration, fees, provider or programme
details.

EMPLOYABILITY_DOCUMENT:
Other material that is still useful for employability or
career guidance, such as:
- occupational guides
- career guidance documents
- employability guidance
- job-search guidance
- CV/interview guidance
- training pathway information
- labour-market information
- career-service information
- occupational skill descriptions

UNSUPPORTED:
A document that is not meaningfully related to
employability, career planning, jobs, education/training
pathways or professional development.

============================================================
CRITICAL DISTINCTION
============================================================

Do NOT classify a job description, occupational guide,
course brochure or skills list as a CV merely because it
contains skills, education or experience requirements.

A CV_RESUME must describe those facts as belonging to a
specific person's own background.

Do not score or evaluate the document.

============================================================
DOCUMENT TEXT
============================================================

{document_text[:12000]}

Return only the JSON object.
"""

    response_text = call_qwen_json(
        prompt,
        max_completion_tokens=300,
    )

    data = extract_json_object(
        response_text
    )

    return DocumentClassificationResult(
        **data
    )


def add_deterministic_cv_presence(
    data: Dict[str, Any],
    document_text: str,
) -> Dict[str, Any]:

    detected = set(
        item
        for item in (
            data.get("detected_elements")
            or []
        )
        if item in CV_DETECTED_ELEMENT_KEYS
    )

    text = document_text or ""
    lower_text = text.lower()

    # Contact/professional-link presence only.
    # Actual values are intentionally not copied into detected_elements.
    if re.search(
        r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b",
        text,
        flags=re.IGNORECASE,
    ):
        detected.add("email")

    phone_patterns = [
        r"\b(?:phone|mobile|tel|telephone|contact)\s*[:\-]?\s*(?:\+?\d[\d\s().-]{7,}\d)",
        r"(?:\+94|0094|0)\s*7\d[\s.-]?\d{3}[\s.-]?\d{4}",
    ]

    if any(
        re.search(
            pattern,
            text,
            flags=re.IGNORECASE,
        )
        for pattern in phone_patterns
    ):
        detected.add("phone")

    header_text = lower_text[:2000]

    if (
        "linkedin.com" in lower_text
        or
        "linkedin" in header_text
    ):
        detected.add("linkedin")

    if (
        "github.com" in lower_text
        or
        "github" in header_text
    ):
        detected.add("github")

    if any(
        term in lower_text
        for term in [
            "portfolio",
            "personal website",
            "personal site",
        ]
    ):
        detected.add("portfolio_website")

    if any(
        domain in lower_text
        for domain in [
            "kaggle.com",
            "behance.net",
            "dribbble.com",
            "stackoverflow.com",
            "orcid.org",
            "scholar.google",
        ]
    ):
        detected.add("other_professional_links")

    # Existing structured extraction is also evidence that the
    # corresponding CV element is present.
    if data.get("name"):
        detected.add("name")

    if data.get("professional_summary"):
        detected.add("professional_summary")

    if data.get("education"):
        detected.add("education")

    if data.get("work_experience"):
        detected.add("work_experience")

    if data.get("projects"):
        detected.add("projects")

    if data.get("certifications"):
        detected.add("certifications")

    if data.get("technical_skills"):
        detected.add("technical_skills")

    if data.get("soft_skills"):
        detected.add("soft_skills")

    if data.get("tools_and_technologies"):
        detected.add("tools_and_technologies")

    if data.get("languages"):
        detected.add("languages")

    if data.get("achievements"):
        detected.add("achievements_awards")

    if data.get("extracurricular_activities"):
        detected.add("extracurricular_activities")

    work_items = data.get("work_experience") or []
    project_items = data.get("projects") or []
    education_items = data.get("education") or []

    if any(
        item.get("period")
        for item in (
            work_items
            + education_items
        )
        if isinstance(item, dict)
    ):
        detected.add("dates_periods")

    if any(
        item.get("description")
        for item in work_items
        if isinstance(item, dict)
    ):
        detected.add("work_descriptions")

    if any(
        item.get("description")
        for item in project_items
        if isinstance(item, dict)
    ):
        detected.add("project_descriptions")

    if any(
        re.search(
            r"\b(intern|internship|trainee)\b",
            " ".join(
                str(item.get(key) or "")
                for key in [
                    "role",
                    "organization",
                    "description",
                ]
            ),
            flags=re.IGNORECASE,
        )
        for item in work_items
        if isinstance(item, dict)
    ):
        detected.add("internship_experience")

    data["detected_elements"] = [
        key
        for key in CV_DETECTED_ELEMENT_KEYS
        if key in detected
    ]

    return data


def extract_cv_profile(
    document_text: str
) -> CVProfile:

    prompt = f"""
Extract structured facts from this CV/resume.

This is information extraction only.

STRICT RULES:

1. Extract ONLY facts explicitly present.
2. Do not invent missing facts.
3. Do not score or judge the CV.
4. Do not estimate employability.
5. Do not recommend improvements.
6. Do not infer work experience from projects.
7. Do not infer certifications from ordinary courses.
8. Only include soft skills explicitly stated in the CV.
9. Use [] for missing list fields.
10. Use null for missing scalar fields.
11. "detected_elements" must contain ONLY the exact keys from
    the allowed list below that are explicitly present in the CV.
12. Do not include an element merely because it is common in CVs.
13. Return ONLY valid JSON.

Allowed detected_elements keys:
{", ".join(CV_DETECTED_ELEMENT_KEYS)}

Return this JSON structure:

{{
  "name": null,
  "detected_elements": [],
  "professional_summary": null,
  "education": [
    {{
      "qualification": null,
      "field": null,
      "institution": null,
      "period": null
    }}
  ],
  "work_experience": [
    {{
      "role": null,
      "organization": null,
      "period": null,
      "description": null
    }}
  ],
  "projects": [
    {{
      "title": null,
      "description": null,
      "technologies": []
    }}
  ],
  "certifications": [
    {{
      "name": null,
      "issuer": null,
      "year": null
    }}
  ],
  "technical_skills": [],
  "soft_skills": [],
  "tools_and_technologies": [],
  "languages": [],
  "achievements": [],
  "extracurricular_activities": []
}}

If a section is not present, return an empty list rather
than a blank placeholder object.

============================================================
CV TEXT
============================================================

{document_text}

Return only the JSON object.
"""

    response_text = call_qwen_json(
        prompt
    )

    data = extract_json_object(
        response_text
    )

    data = normalize_list_fields(
        data,
        [
            "detected_elements",
            "education",
            "work_experience",
            "projects",
            "certifications",
            "technical_skills",
            "soft_skills",
            "tools_and_technologies",
            "languages",
            "achievements",
            "extracurricular_activities",
        ],
    )

    data = add_deterministic_cv_presence(
        data,
        document_text,
    )

    return CVProfile(
        **data
    )


def extract_job_description(
    document_text: str
) -> JobDescriptionProfile:

    prompt = f"""
Extract structured facts from this job description or
vacancy.

IMPORTANT:

- These are requirements and responsibilities of the JOB.
- They are NOT facts about the user.
- Do not claim the user possesses any listed skill.
- Do not evaluate whether the user matches the job.
- Do not calculate a match score.
- Extract only explicit information.
- Return ONLY valid JSON.

Return this structure:

{{
  "job_title": null,
  "organization": null,
  "location": null,
  "employment_type": null,
  "responsibilities": [],
  "required_skills": [],
  "preferred_skills": [],
  "qualifications": [],
  "experience_requirements": [],
  "tools_and_technologies": [],
  "application_details": []
}}

============================================================
JOB DOCUMENT
============================================================

{document_text}

Return only the JSON object.
"""

    response_text = call_qwen_json(
        prompt
    )

    data = extract_json_object(
        response_text
    )

    data = normalize_list_fields(
        data,
        [
            "responsibilities",
            "required_skills",
            "preferred_skills",
            "qualifications",
            "experience_requirements",
            "tools_and_technologies",
            "application_details",
        ],
    )

    return JobDescriptionProfile(
        **data
    )


def extract_course_training(
    document_text: str
) -> CourseTrainingProfile:

    prompt = f"""
Extract structured information from this course or
training programme document.

IMPORTANT:

- This describes a learning/training opportunity.
- It is NOT a qualification already held by the user.
- Do not recommend or score the course.
- Do not claim the user meets entry requirements.
- Extract only information explicitly stated.
- Return ONLY valid JSON.

Return this structure:

{{
  "course_name": null,
  "provider": null,
  "qualification_or_award": null,
  "duration": null,
  "delivery_mode": null,
  "location": null,
  "entry_requirements": [],
  "content_topics": [],
  "skills_covered": [],
  "fees": null,
  "dates_or_intake": null,
  "contact_or_application_info": []
}}

============================================================
COURSE / TRAINING DOCUMENT
============================================================

{document_text}

Return only the JSON object.
"""

    response_text = call_qwen_json(
        prompt
    )

    data = extract_json_object(
        response_text
    )

    data = normalize_list_fields(
        data,
        [
            "entry_requirements",
            "content_topics",
            "skills_covered",
            "contact_or_application_info",
        ],
    )

    return CourseTrainingProfile(
        **data
    )


def extract_employability_document(
    document_text: str
) -> EmployabilityDocumentProfile:

    prompt = f"""
Extract structured employability/career information from
this uploaded reference document.

This may be an occupational guide, employability guide,
career-guidance document, pathway document, labour-market
document or other employability-related material.

IMPORTANT:

- The document describes external information.
- Do NOT treat its skills, experience or qualifications as
  facts about the user.
- Do not score or evaluate the user.
- Do not invent information.
- Preserve dates/validity periods when stated.
- Return ONLY valid JSON.

Return this structure:

{{
  "title": null,
  "organization": null,
  "document_purpose": null,
  "date_or_validity": null,
  "key_topics": [],
  "key_facts": [],
  "occupations_mentioned": [],
  "skills_mentioned": [],
  "pathways_or_services": []
}}

============================================================
EMPLOYABILITY DOCUMENT
============================================================

{document_text}

Return only the JSON object.
"""

    response_text = call_qwen_json(
        prompt
    )

    data = extract_json_object(
        response_text
    )

    data = normalize_list_fields(
        data,
        [
            "key_topics",
            "key_facts",
            "occupations_mentioned",
            "skills_mentioned",
            "pathways_or_services",
        ],
    )

    return EmployabilityDocumentProfile(
        **data
    )


def process_uploaded_document(
    filename: str,
    document_text: str,
) -> UploadedDocumentContext:

    classification = classify_document(
        document_text
    )

    document_type = (
        classification.document_type
    )

    if (
        document_type
        ==
        UploadedDocumentType.UNSUPPORTED
    ):
        return UploadedDocumentContext(
            filename=filename,
            document_type=document_type,
            # Do not return duplicate raw personal CV text.
            document_text="",

            cv_profile=
                cv_profile,
        )

    temporary_context_text = (
        document_text[
            :MAX_CONTEXT_TEXT_CHARACTERS
        ]
    )

    if (
        document_type
        ==
        UploadedDocumentType.CV_RESUME
    ):
        cv_profile = extract_cv_profile(
            document_text
        )

        return UploadedDocumentContext(
            filename=filename,
            document_type=document_type,
            document_text=
                temporary_context_text,
            cv_profile=cv_profile,
        )

    if (
        document_type
        ==
        UploadedDocumentType.JOB_DESCRIPTION
    ):
        job_profile = (
            extract_job_description(
                document_text
            )
        )

        return UploadedDocumentContext(
            filename=filename,
            document_type=document_type,
            document_text=
                temporary_context_text,
            job_description=job_profile,
        )

    if (
        document_type
        ==
        UploadedDocumentType.COURSE_TRAINING
    ):
        course_profile = (
            extract_course_training(
                document_text
            )
        )

        return UploadedDocumentContext(
            filename=filename,
            document_type=document_type,
            document_text=
                temporary_context_text,
            course_training=course_profile,
        )

    if (
        document_type
        ==
        UploadedDocumentType.EMPLOYABILITY_DOCUMENT
    ):
        employability_profile = (
            extract_employability_document(
                document_text
            )
        )

        return UploadedDocumentContext(
            filename=filename,
            document_type=document_type,
            document_text=
                temporary_context_text,
            employability_document=
                employability_profile,
        )

    raise RuntimeError(
        f"Unhandled document type: "
        f"{document_type}"
    )