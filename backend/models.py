from sqlalchemy import Column, Integer, String
from database import Base

class Reserve(Base):
    __tablename__ = "reserves"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    time = Column(String, nullable=False)
    table = Column(String, nullable=False)
    phone = Column(String)
    reqAmount = Column(Integer)
    amountFact = Column(Integer)
    fromWho = Column(String)
    details = Column(String)
    status = Column(String, nullable=False)