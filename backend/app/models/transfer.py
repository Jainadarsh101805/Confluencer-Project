import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from app.db.session import Base


def utc_now():
    return datetime.now(timezone.utc)


class Transfer(Base):
    __tablename__ = "transfers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_account_id = Column(String(36), ForeignKey("accounts.id", ondelete="RESTRICT"), nullable=False, index=True)
    destination_account_id = Column(String(36), ForeignKey("accounts.id", ondelete="RESTRICT"), nullable=False, index=True)
    amount = Column(Numeric(precision=18, scale=4), nullable=False)
    reference_id = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(String(500), nullable=False, default="")
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    __table_args__ = (
        CheckConstraint("amount > 0", name="chk_transfer_amount_positive"),
        CheckConstraint("source_account_id != destination_account_id", name="chk_transfer_distinct_accounts"),
    )

    source_account = relationship("Account", foreign_keys=[source_account_id], back_populates="outgoing_transfers")
    destination_account = relationship("Account", foreign_keys=[destination_account_id], back_populates="incoming_transfers")
    transactions = relationship("Transaction", back_populates="transfer")

    def __repr__(self):
        return f"<Transfer(id={self.id}, from={self.source_account_id}, to={self.destination_account_id}, amount={self.amount})>"
