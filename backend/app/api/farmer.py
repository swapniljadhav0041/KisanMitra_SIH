from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict
from ..database import get_db
from ..models.user import User
from ..models.product import Product, InspectionReport
from ..models.order import Order
from ..models.payment import Payout
from ..core.deps import get_current_user, require_role

router = APIRouter(prefix="/api/farmer", tags=["farmer"])

@router.get("/stats")
def get_farmer_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("farmer"))
):
    # Total products sold (delivered orders)
    total_products_sold = db.query(func.count(Order.id)).join(Product).filter(
        Product.farmer_id == current_user.id,
        Order.status == "delivered"
    ).scalar() or 0

    # Total earnings (sum of payouts)
    total_earnings = db.query(func.coalesce(func.sum(Payout.amount), 0)).filter(
        Payout.user_id == current_user.id,
        Payout.status == "processed"
    ).scalar() or 0

    # Quality grades from inspection reports for farmer's products
    quality_grades = db.query(
        InspectionReport.quality_grade,
        func.count(InspectionReport.id)
    ).join(Product, Product.id == InspectionReport.product_id).filter(
        Product.farmer_id == current_user.id
    ).group_by(InspectionReport.quality_grade).all()

    grade_counts = {grade: count for grade, count in quality_grades}
    total_graded = sum(grade_counts.values()) or 1

    grades_summary = {
        "A": grade_counts.get("A", 0),
        "B": grade_counts.get("B", 0),
        "C": grade_counts.get("C", 0),
        "D": grade_counts.get("D", 0),
        "total_graded": total_graded
    }

    return {
        "total_products_sold": total_products_sold,
        "total_earnings": float(total_earnings),
        "quality_grades": grades_summary
    }