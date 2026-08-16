import asyncio
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import engine, Base, SessionLocal
from .config import settings
from .api import auth, products, auctions, orders, payments, agent, uploads, ws_auctions
from .models.auction import Auction, Bid
from .models.order import Order
from .api import otp
from .api import farmer

# Create database tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files (for uploads)
app.mount("/static", StaticFiles(directory="storage"), name="static")

# Include API routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(auctions.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(agent.router)
app.include_router(farmer.router)
app.include_router(otp.router)
app.include_router(uploads.router)
app.include_router(ws_auctions.router)

async def auction_scheduler():
    """
    Background task that periodically:
    - Starts scheduled auctions whose start_time has passed.
    - Ends live auctions whose end_time has passed.
    - Marks winning bid and creates order automatically.
    """
    while True:
        await asyncio.sleep(10)  # Check every 10 seconds
        db = SessionLocal()
        try:
            now = datetime.utcnow()

            # 1. Start scheduled auctions
            scheduled_auctions = db.query(Auction).filter(
                Auction.status == "scheduled",
                Auction.start_time <= now
            ).all()
            for auction in scheduled_auctions:
                auction.status = "live"

            # 2. End live auctions that are past end_time
            live_auctions = db.query(Auction).filter(
                Auction.status == "live",
                Auction.end_time <= now
            ).all()
            for auction in live_auctions:
                auction.status = "ended"

                # Mark winning bid
                winning_bid = db.query(Bid).filter(
                    Bid.auction_id == auction.id,
                    Bid.bid_amount == auction.current_highest_bid
                ).order_by(Bid.bid_time.desc()).first()
                if winning_bid:
                    winning_bid.is_winning = True

                # Create order automatically if there's a winner and no order exists
                if auction.current_highest_bidder_id:
                    existing_order = db.query(Order).filter(
                        Order.auction_id == auction.id
                    ).first()
                    if not existing_order:
                        order = Order(
                            product_id=auction.product_id,
                            auction_id=auction.id,
                            trader_id=auction.current_highest_bidder_id,
                            agent_id=auction.agent_id,
                            quantity=auction.product.quantity,
                            total_price=auction.current_highest_bid,
                            status="pending",
                            payment_status="pending"
                        )
                        db.add(order)

            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Scheduler error: {e}")
        finally:
            db.close()

@app.on_event("startup")
async def startup_event():
    # Start the background scheduler as an asyncio task
    asyncio.create_task(auction_scheduler())

@app.get("/")
def root():
    return {"message": "AgriMart API is running"}