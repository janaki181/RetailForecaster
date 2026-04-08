import secrets
from datetime import datetime, timedelta, date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import User, ActivityNote
from schemas import UserInvite, ActivityNoteCreate
from auth import require_admin, get_password_hash, get_current_user
from ml.llm_insights import generate_user_activity_notes

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/summary")
def users_summary(db: Session = Depends(get_db), _=Depends(require_admin)):
    total = db.query(func.count(User.id)).scalar() or 0
    today = date.today()
    week_ago = datetime.utcnow() - timedelta(days=7)
    active_today = db.query(func.count(User.id)).filter(func.date(User.last_seen) == today).scalar() or 0
    new_this_week = db.query(func.count(User.id)).filter(User.created_at >= week_ago).scalar() or 0
    admins = db.query(func.count(User.id)).filter(func.lower(User.role) == "admin").scalar() or 0
    return {"total_users": total, "active_today": active_today, "new_this_week": new_this_week, "admins": admins}


@router.get("")
def list_users(db: Session = Depends(get_db), _=Depends(require_admin)):
    users = db.query(User).order_by(User.last_seen.desc()).all()
    return [{"name": u.name, "email": u.email, "role": u.role, "last_seen": u.last_seen} for u in users]


@router.post("/invite")
def invite_user(payload: UserInvite, db: Session = Depends(get_db), _=Depends(require_admin)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    temp_password = secrets.token_urlsafe(8)
    u = User(
        name=payload.name,
        email=payload.email,
        role=payload.role,
        status="Active",
        password_hash=get_password_hash(temp_password),
        last_seen=datetime.utcnow(),
    )
    db.add(u)
    db.commit()
    return {"id": u.id, "temp_password": temp_password}


@router.get("/activity-notes")
def activity_notes(db: Session = Depends(get_db), _=Depends(get_current_user)):
    rows = db.query(User.role, func.count(User.id)).group_by(User.role).all()
    summary = ", ".join([f"{role}: {count}" for role, count in rows])
    ai_notes = generate_user_activity_notes(summary)

    manual = (
        db.query(ActivityNote, User)
        .outerjoin(User, User.id == ActivityNote.created_by)
        .order_by(ActivityNote.created_at.desc())
        .limit(20)
        .all()
    )

    manual_notes = [
        {
            "id": note.id,
            "content": note.content,
            "created_at": note.created_at,
            "created_by": user.name if user else "Unknown",
        }
        for note, user in manual
    ]

    return {"ai_notes": ai_notes, "manual_notes": manual_notes}


@router.post("/activity-notes")
def create_activity_note(payload: ActivityNoteCreate, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    note = ActivityNote(content=payload.content.strip(), created_by=user.id)
    db.add(note)
    db.commit()
    db.refresh(note)
    return {
        "id": note.id,
        "content": note.content,
        "created_at": note.created_at,
        "created_by": user.name,
    }


@router.delete("/activity-notes/{note_id}")
def delete_activity_note(note_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    note = db.query(ActivityNote).filter(ActivityNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    db.delete(note)
    db.commit()
    return {"ok": True}
