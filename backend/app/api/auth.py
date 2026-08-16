from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User, TraderLicense, AgentProfile
from ..models.otp import OtpVerification   # <-- Added
from ..schemas.auth import (
    FarmerRegister, TraderRegister, AgentCreate, AdminCreate,
    LoginRequest, TokenResponse, UserOut
)
from ..core.security import hash_password, verify_password, create_access_token
from ..core.deps import get_current_user, require_role

router = APIRouter(prefix="/api/auth", tags=["auth"])

def is_otp_verified(contact: str, db: Session) -> bool:
    """Check if a verified OTP record exists for the contact."""
    return db.query(OtpVerification).filter(
        OtpVerification.contact == contact,
        OtpVerification.is_verified == True
    ).first() is not None

# Helper to create user and return token
def create_user_common(db: Session, user_data: dict, role: str) -> User:
    # Check if email/phone already exists
    if db.query(User).filter(User.email == user_data["email"]).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.phone == user_data["phone"]).first():
        raise HTTPException(status_code=400, detail="Phone already registered")
    user = User(
        name=user_data["name"],
        email=user_data["email"],
        phone=user_data["phone"],
        password_hash=hash_password(user_data["password"]),
        role=role,
        language=user_data.get("language", "en"),
        location=user_data.get("location"),
        verified=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/register/farmer", response_model=TokenResponse)
def register_farmer(data: FarmerRegister, db: Session = Depends(get_db)):
    # Enforce OTP verification for both email and phone
    if not is_otp_verified(data.email, db) or not is_otp_verified(data.phone, db):
        raise HTTPException(status_code=400, detail="Email and phone must be verified via OTP")

    user = create_user_common(db, data.dict(), role="farmer")
    # Optionally delete the used OTP records to prevent reuse
    db.query(OtpVerification).filter(
        OtpVerification.contact.in_([data.email, data.phone]),
        OtpVerification.is_verified == True
    ).delete(synchronize_session=False)
    db.commit()

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "name": user.name
    }

@router.post("/register/trader", response_model=TokenResponse)
def register_trader(data: TraderRegister, db: Session = Depends(get_db)):
    # Enforce OTP verification for both email and phone
    if not is_otp_verified(data.email, db) or not is_otp_verified(data.phone, db):
        raise HTTPException(status_code=400, detail="Email and phone must be verified via OTP")

    user = create_user_common(db, {
        "name": data.name,
        "email": data.email,
        "phone": data.phone,
        "password": data.password,
        "language": data.language,
        "location": data.location
    }, role="trader")

    # Add trader license
    license = TraderLicense(
        user_id=user.id,
        licence_number=data.licence_number,
        expiry_date=data.licence_expiry,
        verified=False  # Admin will verify later
    )
    db.add(license)
    db.commit()

    # Remove used OTP records
    db.query(OtpVerification).filter(
        OtpVerification.contact.in_([data.email, data.phone]),
        OtpVerification.is_verified == True
    ).delete(synchronize_session=False)
    db.commit()

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "name": user.name
    }

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "name": user.name
    }

@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

# Admin-only endpoint to create agent
@router.post("/admin/agents", response_model=TokenResponse)
def create_agent(data: AgentCreate, db: Session = Depends(get_db), admin: User = Depends(require_role("admin"))):
    user = create_user_common(db, data.dict(), role="agent")
    agent_profile = AgentProfile(
        user_id=user.id,
        service_area=data.service_area,
        commission_rate=data.commission_rate,
        is_approved=True  # admin creates directly, so approved
    )
    db.add(agent_profile)
    db.commit()
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "name": user.name
    }

# Admin-only endpoint to create admin (optional, for seeding)
@router.post("/admin/admins", response_model=TokenResponse)
def create_admin(data: AdminCreate, db: Session = Depends(get_db), admin: User = Depends(require_role("admin"))):
    user = create_user_common(db, data.dict(), role="admin")
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "name": user.name
    }