from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..models.product import Product
from ..models.order import Order
from ..core.deps import require_role

router = APIRouter(prefix="/api/farmer/orders", tags=["farmer-orders"])

class OrderCreate(BaseModel):
    product_id: int
    quantity: float = 1.0

@router.post("")
def create_order(
    data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("farmer")),
):
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.status != "active":
        raise HTTPException(status_code=400, detail="Product is not available")
    if data.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be positive")
    if product.quantity < data.quantity:
        raise HTTPException(status_code=400, detail="Insufficient quantity available")

    total_price = product.price * data.quantity

    order = Order(
        product_id=product.id,
        trader_id=current_user.id,   # buyer (farmer)
        quantity=data.quantity,
        total_price=total_price,
        status="pending",
        payment_status="pending",
    )
    db.add(order)

    # Optional: decrease product quantity
    product.quantity -= data.quantity

    db.commit()
    db.refresh(order)

    return {
        "id": order.id,
        "product_id": order.product_id,
        "quantity": order.quantity,
        "total_price": order.total_price,
        "status": order.status,
    }