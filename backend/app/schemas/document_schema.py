from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class UploadedDocumentType(str, Enum):
    CV_RESUME = "CV_RESUME"
    JOB_DESCRIPTION = "JOB_DESCRIPTION"
    COURSE_TRAINING = "COURSE_TRAINING"
    EMPLOYABILITY_DOCUMENT = "EMPLOYABILITY_DOCUMENT"
    UNSUPPORTED = "UNSUPPORTED"


class CVEducationItem(BaseModel):
    qualification: Optional[str] = None
    field: Optional[str] = None
    institution: Optional[str] = None
    period: Optional[str] = None


class CVExperienceItem(BaseModel):
    role: Optional[str] = None
    organization: Optional[str] = None
    period: Optional[str] = None
    description: Optional[str] = None


class CVProjectItem(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    technologies: List[str] = Field(default_factory=list)


class CVCertificationItem(BaseModel):
    name: Optional[str] = None
    issuer: Optional[str] = None
    year: Optional[str] = None


class CVProfile(BaseModel):
    name: Optional[str] = None
    detected_elements: List[str] = Field(default_factory=list)
    professional_summary: Optional[str] = None
    education: List[CVEducationItem] = Field(default_factory=list)
    work_experience: List[CVExperienceItem] = Field(default_factory=list)
    projects: List[CVProjectItem] = Field(default_factory=list)
    certifications: List[CVCertificationItem] = Field(default_factory=list)
    technical_skills: List[str] = Field(default_factory=list)
    soft_skills: List[str] = Field(default_factory=list)
    tools_and_technologies: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)
    extracurricular_activities: List[str] = Field(default_factory=list)


class JobDescriptionProfile(BaseModel):
    job_title: Optional[str] = None
    organization: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    responsibilities: List[str] = Field(default_factory=list)
    required_skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)
    qualifications: List[str] = Field(default_factory=list)
    experience_requirements: List[str] = Field(default_factory=list)
    tools_and_technologies: List[str] = Field(default_factory=list)
    application_details: List[str] = Field(default_factory=list)


class CourseTrainingProfile(BaseModel):
    course_name: Optional[str] = None
    provider: Optional[str] = None
    qualification_or_award: Optional[str] = None
    duration: Optional[str] = None
    delivery_mode: Optional[str] = None
    location: Optional[str] = None
    entry_requirements: List[str] = Field(default_factory=list)
    content_topics: List[str] = Field(default_factory=list)
    skills_covered: List[str] = Field(default_factory=list)
    fees: Optional[str] = None
    dates_or_intake: Optional[str] = None
    contact_or_application_info: List[str] = Field(default_factory=list)


class EmployabilityDocumentProfile(BaseModel):
    title: Optional[str] = None
    organization: Optional[str] = None
    document_purpose: Optional[str] = None
    date_or_validity: Optional[str] = None
    key_topics: List[str] = Field(default_factory=list)
    key_facts: List[str] = Field(default_factory=list)
    occupations_mentioned: List[str] = Field(default_factory=list)
    skills_mentioned: List[str] = Field(default_factory=list)
    pathways_or_services: List[str] = Field(default_factory=list)


class DocumentClassificationResult(BaseModel):
    document_type: UploadedDocumentType
    reason: Optional[str] = None


class UploadedDocumentContext(BaseModel):
    filename: str
    document_type: UploadedDocumentType
    document_text: str = ""
    cv_profile: Optional[CVProfile] = None
    job_description: Optional[JobDescriptionProfile] = None
    course_training: Optional[CourseTrainingProfile] = None
    employability_document: Optional[EmployabilityDocumentProfile] = None


class DocumentUploadResponse(BaseModel):
    success: bool
    filename: str
    document_type: UploadedDocumentType
    extracted_text_length: int = Field(..., ge=0)
    document: UploadedDocumentContext