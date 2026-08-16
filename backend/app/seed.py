from sqlalchemy.orm import Session
from .database import SessionLocal, engine, Base
from .models.user import User
from .models.product import Category, CategoryTranslation
from .core.security import hash_password

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Create admin if not exists
        admin = db.query(User).filter(User.role == "admin").first()
        if not admin:
            admin = User(
                name="Admin",
                email="admin@agrimart.com",
                phone="9999999999",
                password_hash=hash_password("admin123"),
                role="admin",
                language="en",
                verified=True
            )
            db.add(admin)
            db.commit()

        # Create categories
        categories = ["vegetables", "fruits", "grains", "pulses", "herbs"]
        for cat in categories:
            if not db.query(Category).filter(Category.slug == cat).first():
                category = Category(slug=cat)
                db.add(category)
                db.commit()
                # Add translations for each language
                translations = {
                    "en": cat.capitalize(),
                    "hi": {"vegetables": "सब्ज़ियाँ", "fruits": "फल", "grains": "अनाज", "pulses": "दालें", "herbs": "जड़ी-बूटियाँ"},
                    "mr": {"vegetables": "भाज्या", "fruits": "फळे", "grains": "धान्य", "pulses": "डाळी", "herbs": "औषधी वनस्पती"},
                    "ta": {"vegetables": "காய்கறிகள்", "fruits": "பழங்கள்", "grains": "தானியங்கள்", "pulses": "பருப்பு வகைகள்", "herbs": "மூலிகைகள்"},
                    "gu": {"vegetables": "શાકભાજી", "fruits": "ફળો", "grains": "અનાજ", "pulses": "કઠોળ", "herbs": "જડીબુટ્ટીઓ"},
                    "te": {"vegetables": "కూరగాయలు", "fruits": "పండ్లు", "grains": "ధాన్యాలు", "pulses": "పప్పులు", "herbs": "మూలికలు"},
                    "kn": {"vegetables": "ತರಕಾರಿಗಳು", "fruits": "ಹಣ್ಣುಗಳು", "grains": "ಧಾನ್ಯಗಳು", "pulses": "ದ್ವಿದಳ ಧಾನ್ಯಗಳು", "herbs": "ಗಿಡಮೂಲಿಕೆಗಳು"},
                    "bn": {"vegetables": "সবজি", "fruits": "ফল", "grains": "শস্য", "pulses": "ডাল", "herbs": "ভেষজ"}
                }
                for lang, name in translations.items():
                    db.add(CategoryTranslation(
                        category_id=category.id,
                        language=lang,
                        name=name
                    ))
                db.commit()
        print("Seed completed")
    finally:
        db.close()

if __name__ == "__main__":
    seed()