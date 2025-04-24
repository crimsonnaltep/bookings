import os
import datetime
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, Field
from typing import List

# Database URL from env (Postgres expected)

SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://admin:dudHjgDhe73!@37.9.4.42:5432/bookings"  # запасной вариант
)
if not SQLALCHEMY_DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is not set for Postgres connection")

# Engine setup for Postgres
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# SQLAlchemy model
typedef = Base
class Booking(typedef):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    table = Column(String, index=True)
    date = Column(Date, index=True)
    start = Column(Integer)
    end = Column(Integer)
    name = Column(String)
    phone = Column(String)
    reqAmount = Column(Integer)
    fromWho = Column(String)
    amountFact = Column(Integer)
    comment = Column(String)
    status = Column(String)

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

# Pydantic schemas
class BookingBase(BaseModel):
    table: str
    date: datetime.date
    start: int
    end: int
    name: str
    phone: str
    reqAmount: int
    fromWho: str
    amountFact: int
    comment: str = Field("", example="Комментарии")
    status: str = Field("booked", example="booked")

class BookingCreate(BookingBase):
    pass

class BookingOut(BookingBase):
    id: int
    class Config:
        orm_mode = True

# Dependency to provide DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# FastAPI app with CORS enabled for React frontend
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://37.9.4.42"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# CRUD routes
@app.get("/bookings/", response_model=List[BookingOut])
def read_bookings(date: datetime.date, db: Session = Depends(get_db)):
    return db.query(Booking).filter(Booking.date == date).all()

@app.post("/bookings/", response_model=BookingOut)
def create_booking(booking: BookingCreate, db: Session = Depends(get_db)):
    # Prevent overlapping bookings
    conflict = db.query(Booking).filter(
        Booking.table == booking.table,
        Booking.date == booking.date,
        Booking.start < booking.end,
        Booking.end > booking.start
    ).first()
    if conflict:
        raise HTTPException(status_code=400, detail="Time slot conflict")
    db_booking = Booking(**booking.dict())
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    return db_booking

@app.put("/bookings/{booking_id}", response_model=BookingOut)
def update_booking(booking_id: int, booking: BookingCreate, db: Session = Depends(get_db)):
    db_booking = db.query(Booking).get(booking_id)
    if not db_booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    conflict = db.query(Booking).filter(
        Booking.table == booking.table,
        Booking.date == booking.date,
        Booking.id != booking_id,
        Booking.start < booking.end,
        Booking.end > booking.start
    ).first()
    if conflict:
        raise HTTPException(status_code=400, detail="Time slot conflict")
    for key, value in booking.dict().items():
        setattr(db_booking, key, value)
    db.commit()
    db.refresh(db_booking)
    return db_booking

@app.delete("/bookings/{booking_id}")
def delete_booking(booking_id: int, db: Session = Depends(get_db)):
    db_booking = db.query(Booking).get(booking_id)
    if not db_booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    db.delete(db_booking)
    db.commit()
    return {"detail": "Deleted"}
