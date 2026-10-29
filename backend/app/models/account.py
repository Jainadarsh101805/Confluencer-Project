import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import Column, String, Numeric, DateTime, CheckConstraint
from sqlalchemy.orm import relationship
from app.db.session import Base


def utc_now():
    return datetime.now(timezone.utc)


class Account(Base):
    __tablename__ = "accounts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, index=True)
    opening_balance = Column(Numeric(precision=18, scale=4), nullable=False, default=Decimal("0.0000"))
    balance = Column(Numeric(precision=18, scale=4), nullable=False, default=Decimal("0.0000"))
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    __table_args__ = (
        CheckConstraint("balance >= 0", name="chk_account_balance_non_negative"),
        CheckConstraint("opening_balance >= 0", name="chk_account_opening_balance_non_negative"),
    )

    transactions = relationship("Transaction", back_populates="account", order_by="desc(Transaction.created_at)")
    outgoing_transfers = relationship("Transfer", foreign_keys="Transfer.source_account_id", back_populates="source_account")
    incoming_transfers = relationship("Transfer", foreign_keys="Transfer.destination_account_id", back_populates="destination_account")

    def __repr__(self):
        return f"<Account(id={self.id}, name='{self.name}', balance={self.balance})>"
