import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import (
    Column,
    String,
    Numeric,
    DateTime,
    ForeignKey,
    CheckConstraint,
    UniqueConstraint,
    Index,
    event,
)
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.core.errors import TransactionImmutabilityError


def utc_now():
    return datetime.now(timezone.utc)


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    account_id = Column(String(36), ForeignKey("accounts.id", ondelete="RESTRICT"), nullable=False, index=True)
    type = Column(String(10), nullable=False)  # 'credit' | 'debit'
    amount = Column(Numeric(precision=18, scale=4), nullable=False)
    description = Column(String(500), nullable=False, default="")
    reference_id = Column(String(100), nullable=False)
    transfer_id = Column(String(36), ForeignKey("transfers.id", ondelete="RESTRICT"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)

    __table_args__ = (
        CheckConstraint("amount > 0", name="chk_transaction_amount_positive"),
        CheckConstraint("type IN ('credit', 'debit')", name="chk_transaction_type"),
        UniqueConstraint("account_id", "reference_id", name="uq_account_reference"),
        Index("idx_transactions_account_created", "account_id", "created_at"),
    )

    account = relationship("Account", back_populates="transactions")
    transfer = relationship("Transfer", back_populates="transactions")

    def __repr__(self):
        return f"<Transaction(id={self.id}, account={self.account_id}, type={self.type}, amount={self.amount}, ref={self.reference_id})>"


# Ledger Immutability Guards: Prevent UPDATE or DELETE on transactions at the ORM level
@event.listens_for(Transaction, "before_update")
def guard_transaction_immutability_update(mapper, connection, target):
    raise TransactionImmutabilityError("update")


@event.listens_for(Transaction, "before_delete")
def guard_transaction_immutability_delete(mapper, connection, target):
    raise TransactionImmutabilityError("delete")
