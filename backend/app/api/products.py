from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from ..database import get_db
from ..models.product import Product, ProductMedia, Category
from ..models.user import User
from ..schemas.product import ProductCreate, ProductOut, MediaUpload
from ..core.deps import get_current_user, require_role

router = APIRouter(prefix="/api/products", tags=["products"])

@router.post("/", response_model=ProductOut)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("farmer"))
):
    # Check category exists
    category = db.query(Category).filter(Category.id == data.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    product = Product(
        farmer_id=current_user.id,
        category_id=data.category_id,
        name=data.name,
        description=data.description,
        quantity=data.quantity,
        unit=data.unit,
        location=data.location,
        status="pending_inspection"
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

@router.get("/my", response_model=List[ProductOut])
def get_my_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Farmers see their own products; traders see all products
    if current_user.role == "farmer":
        products = db.query(Product).filter(Product.farmer_id == current_user.id).all()
    else:
        products = db.query(Product).all()
    return products

@router.get("/{product_id}", response_model=ProductOut)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).options(
        joinedload(Product.media),
        joinedload(Product.inspection_report)
    ).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/{product_id}/media", response_model=ProductOut)
def upload_media(
    product_id: int,
    media: MediaUpload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    # Only farmer who owns product or agent/admin can upload media
    if current_user.role not in ["farmer", "agent", "admin"]:
        raise HTTPException(status_code=403, detail="Not allowed")
    if current_user.role == "farmer" and product.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your product")
    
    media_entry = ProductMedia(
        product_id=product_id,
        media_type=media.media_type,
        url=media.url,
        uploaded_by=current_user.id
    )
    db.add(media_entry)
    db.commit()
    db.refresh(product)
    return product