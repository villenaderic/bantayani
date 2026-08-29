from pydantic import BaseModel, ConfigDict, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    role: str
    agency: str | None = None
    region: str | None = None
    province: str | None = None
    municipality: str | None = None


class TokenResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
    user: UserSchema
