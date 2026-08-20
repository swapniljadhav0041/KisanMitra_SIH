from fastapi import APIRouter, Depends, HTTPException, status, Request
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
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["farmer", "admin"]:
        raise HTTPException(status_code=403, detail="Only farmers and admins can create products")

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
        price=data.price,
        rating=0.0,
        location=data.location,
        pincode=data.pincode,
        available_date=data.available_date,
        auction_type=data.auction_type,
        auction_start_time=data.auction_start_time,
        auction_end_time=data.auction_end_time,
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
    if current_user.role == "farmer":
        products = db.query(Product).filter(Product.farmer_id == current_user.id).all()
    else:
        products = db.query(Product).all()
    return products

@router.get("/", response_model=List[dict])
def get_available_products(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns all products available for purchase (active/verified/listed).
    """
    products = db.query(Product).options(
        joinedload(Product.media),
        joinedload(Product.category)
    ).filter(Product.status.in_(["verified", "listed", "active"])).all()

    result = []
    for p in products:
        image_url = None
        if p.media:
            image_url = p.media[0].url
            if image_url and image_url.startswith('/'):
                image_url = f"{request.base_url}{image_url.lstrip('/')}"

        result.append({
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "quantity": p.quantity,
            "unit": p.unit,
            "price": p.price,
            "status": p.status,
            "category_slug": p.category.slug if p.category else None,
            "image": image_url,
        })

    return result

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