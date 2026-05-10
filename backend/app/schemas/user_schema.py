from pydantic import BaseModel
from typing import List

# -----------------------------
# INPUT SCHEMA
# -----------------------------
class UserInput(BaseModel):
    age: int
    gender: str   
    field_of_study: str
    Edu_Level: str 

    Skill_Analytical: int
    Skill_Resilience: int
    Skill_Leadership: int
    Skill_Creative: int
    Skill_Motivation: int
    Skill_Tech_Literacy: int
    Skill_Empathy: int
    Skill_Curiosity: int


# -----------------------------
# OUTPUT SCHEMA
# -----------------------------
class AnalyzeResponse(BaseModel):
    status: str
    probability: str   # because return "92.34%"

    positive_factors: List[str]
    negative_factors: List[str]
    recommendations: List[str]