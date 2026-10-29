from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import List
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.transfer import Transfer
from app.schemas.analytics import CommandCenterSummary, VolumeTimelinePoint
from app.schemas.common import format_decimal
from app.schemas.transaction import TransactionResponse
from app.services.integrity_service import IntegrityService


class AnalyticsService:
    @staticmethod
    def get_command_center_summary(db: Session) -> CommandCenterSummary:
        total_accounts = db.query(Account).count()
        total_balance = db.query(func.coalesce(func.sum(Account.balance), 0)).scalar()

        total_credits = (
            db.query(func.coalesce(func.sum(Transaction.amount), 0))
            .filter(Transaction.type == "credit")
            .scalar()
        )
        total_debits = (
            db.query(func.coalesce(func.sum(Transaction.amount), 0))
            .filter(Transaction.type == "debit")
            .scalar()
        )

        total_tx_count = db.query(Transaction).count()
        total_transfers_count = db.query(Transfer).count()

        recent_txs = (
            db.query(Transaction)
            .order_by(Transaction.created_at.desc(), Transaction.id.desc())
            .limit(8)
            .all()
        )

        # 7-day timeline of credits vs debits
        now = datetime.now(timezone.utc)
        timeline: List[VolumeTimelinePoint] = []
        for i in range(6, -1, -1):
            day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            date_str = day_start.strftime("%b %d")

            day_credits = (
                db.query(func.coalesce(func.sum(Transaction.amount), 0))
                .filter(
                    Transaction.type == "credit",
                    Transaction.created_at >= day_start,
                    Transaction.created_at < day_end,
                )
                .scalar()
            )
            day_debits = (
                db.query(func.coalesce(func.sum(Transaction.amount), 0))
                .filter(
                    Transaction.type == "debit",
                    Transaction.created_at >= day_start,
                    Transaction.created_at < day_end,
                )
                .scalar()
            )

            timeline.append(
                VolumeTimelinePoint(
                    date=date_str,
                    credits=format_decimal(Decimal(str(day_credits))),
                    debits=format_decimal(Decimal(str(day_debits))),
                )
            )

        # Check integrity
        integrity_report = IntegrityService.reconcile_ledger(db)

        return CommandCenterSummary(
            total_accounts=total_accounts,
            combined_liquid_balance=format_decimal(Decimal(str(total_balance))),
            total_successful_credits_volume=format_decimal(Decimal(str(total_credits))),
            total_successful_debits_volume=format_decimal(Decimal(str(total_debits))),
            total_transactions_count=total_tx_count,
            total_transfers_count=total_transfers_count,
            integrity_status=integrity_report.status,
            last_integrity_check=integrity_report.audited_at.isoformat(),
            recent_transactions=[TransactionResponse.from_orm_model(t) for t in recent_txs],
            volume_timeline=timeline,
        )
