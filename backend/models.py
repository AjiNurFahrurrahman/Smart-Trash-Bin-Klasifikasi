from pydantic import BaseModel, Field
from typing import Optional


class CreateClassRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)


class CreateAccountRequest(BaseModel):
    account_name: str = Field(..., min_length=1, max_length=50)
    class_slug: str


class AddPointsRequest(BaseModel):
    account_id: str
    category: str  # 'kimia' | 'daur' | 'residu'


class ClassOut(BaseModel):
    slug: str
    name: str
    points: int
    total_buang: int
    jumlah_kimia: int
    jumlah_daur: int
    jumlah_residu: int


class AccountOut(BaseModel):
    account_id: str
    account_name: str
    class_slug: str
    class_name: str
