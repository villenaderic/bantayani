from fastapi import APIRouter

router = APIRouter()


@router.post("/login")
def login():
    """Authenticate a government user and issue a session token."""
    return {"message": "Login endpoint placeholder"}
