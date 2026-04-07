from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from auth import authenticate_user, create_access_token, get_current_user, get_password_hash
from models import User, Shop, ShopMember
from schemas import LoginRequest, RegisterRequest

router = APIRouter(prefix="/api/auth", tags=["auth"])

_blacklist: set = set()
_ALLOWED_ROLES = {"Admin", "Store Manager", "Sales Associate", "Analyst"}


def _normalize_role(raw_role: str) -> str:
    role = " ".join((raw_role or "").split())
    mapping = {
        "admin": "Admin",
        "store manager": "Store Manager",
        "sales associate": "Sales Associate",
        "analyst": "Analyst",
    }
    return mapping.get(role.lower(), role)


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": user.email}, timedelta(minutes=30))
    # FIXED: return user name + role so frontend can show who is logged in
    # and conditionally show admin-only UI elements
    membership = (
        db.query(ShopMember)
        .join(Shop, Shop.id == ShopMember.shop_id)
        .filter(ShopMember.user_id == user.id)
        .order_by(ShopMember.created_at.asc())
        .first()
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "shop": membership.shop.name if membership else None,
        },
    }


@router.post("/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    role = _normalize_role(payload.role)
    if role not in _ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")

    shop_name = (payload.shop_name or "").strip()
    if not shop_name:
        raise HTTPException(status_code=400, detail="Shop name is required")

    shop = db.query(Shop).filter(func.lower(Shop.name) == shop_name.lower()).first()

    if role == "Admin":
        if shop:
            raise HTTPException(status_code=409, detail="Shop already exists. Use a non-admin role to join this shop")
        shop = Shop(name=shop_name)
        db.add(shop)
        db.flush()
    elif not shop:
        raise HTTPException(status_code=404, detail="Shop not found. Ask your admin for the exact shop name")

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        role=role,
        status="Active",
    )
    db.add(user)
    db.flush()

    db.add(ShopMember(user_id=user.id, shop_id=shop.id, role=role))

    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.email}, timedelta(minutes=30))
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "shop": shop.name,
        },
    }


@router.post("/logout")
def logout(token: str):
    _blacklist.add(token)
    return {"message": "Logged out"}


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    membership = user.memberships[0] if user.memberships else None
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "shop": membership.shop.name if membership else None,
    }
