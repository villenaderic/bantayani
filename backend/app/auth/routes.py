from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.schemas import LoginRequest, TokenResponse, UserSchema
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.models import User
from app.core.security import create_access_token, verify_password

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    if user.status != "active":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account is not active")

    token = create_access_token(subject=user.id, role=user.role)
    return TokenResponse(accessToken=token, user=UserSchema.model_validate(user))


@router.get("/me", response_model=UserSchema)
def read_current_user(user: User = Depends(get_current_user)):
    return UserSchema.model_validate(user)
