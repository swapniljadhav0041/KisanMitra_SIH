from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from ..models.user import User, TraderLicense, AgentProfile
from ..models.otp import OtpVerification
from ..schemas.auth import (
    FarmerRegister, TraderRegister, AgentCreate, AdminCreate,
    LoginRequest, TokenResponse, UserOut
)
from ..core.security import hash_password, verify_password, create_access_token
from ..core.deps import get_current_user, require_role

router = APIRouter(prefix="/api/auth", tags=["auth"])

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

def is_otp_verified(contact: str, db: Session) -> bool:
    """Check if a verified OTP record exists for the contact."""
    return db.query(OtpVerification).filter(
        OtpVerification.contact == contact,
        OtpVerification.is_verified == True
    ).first() is not None

# Helper to create user and return token
def create_user_common(db: Session, user_data: dict, role: str) -> User:
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
    if not is_otp_verified(data.email, db) or not is_otp_verified(data.phone, db):
        raise HTTPException(status_code=400, detail="Email and phone must be verified via OTP")

    user = create_user_common(db, data.dict(), role="farmer")
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

    license = TraderLicense(
        user_id=user.id,
        licence_number=data.licence_number,
        expiry_date=data.licence_expiry,
        verified=False
    )
    db.add(license)
    db.commit()

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

@router.put("/change-password")
def change_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    password = data.new_password
    if not (6 <= len(password) <= 12):
        raise HTTPException(status_code=400, detail="Password must be 6-12 characters")
    if not any(c.isupper() for c in password):
        raise HTTPException(status_code=400, detail="Password must contain an uppercase letter")
    if not any(c.islower() for c in password):
        raise HTTPException(status_code=400, detail="Password must contain a lowercase letter")
    if not any(c.isdigit() for c in password):
        raise HTTPException(status_code=400, detail="Password must contain a number")
    if not any(c in "@$!%*?&#" for c in password):
        raise HTTPException(status_code=400, detail="Password must contain a special character")

    current_user.password_hash = hash_password(new_password)
    db.commit()
    return {"message": "Password updated successfully"}

@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/admin/agents", response_model=TokenResponse)
def create_agent(data: AgentCreate, db: Session = Depends(get_db), admin: User = Depends(require_role("admin"))):
    # Check OTP verification for email and phone
    if not is_otp_verified(data.email, db) or not is_otp_verified(data.phone, db):
        raise HTTPException(
            status_code=400,
            detail="Email and phone must be verified via OTP before creating an agent."
        )

    user = create_user_common(db, data.dict(), role="agent")
    user.verified = True   # ✅ Admin-created agents are automatically verified
    db.commit()

    agent_profile = AgentProfile(
        user_id=user.id,
        service_area=data.service_area,
        commission_rate=data.commission_rate,
        qualifications=data.qualifications,
        bank_name=data.bank_name,
        account_holder=data.account_holder,
        account_number=data.account_number,
        ifsc_code=data.ifsc_code,
        is_approved=True
    )
    db.add(agent_profile)
    db.commit()

    # Delete used OTP verifications
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