from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from auth import authenticate_user, create_access_token, get_current_user
from models import User
from schemas import LoginRequest

router = APIRouter(prefix="/api/auth", tags=["auth"])

_blacklist: set = set()


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": user.email}, timedelta(minutes=30))
    # FIXED: return user name + role so frontend can show who is logged in
    # and conditionally show admin-only UI elements
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
        },
    }


@router.post("/logout")
def logout(token: str):
    _blacklist.add(token)
    return {"message": "Logged out"}


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
    }
