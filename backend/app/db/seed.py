import sys
from decimal import Decimal
from app.db.session import SessionLocal, Base, engine
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.transfer import Transfer
from app.schemas.account import AccountCreate
from app.schemas.transaction import TransactionCreate
from app.schemas.transfer import TransferCreate
from app.services.account_service import AccountService
from app.services.transaction_service import TransactionService
from app.services.transfer_service import TransferService


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(Account).count() > 0:
            print("Database already contains accounts. Skipping seed.")
            return

        print("Seeding LEDGER//ONE with reference accounts and transactions...")

        # 1. Create Accounts
        acc1 = AccountService.create_account(db, AccountCreate(name="Operating Treasury Alpha"))
        acc2 = AccountService.create_account(db, AccountCreate(name="Merchant Settlement Reserve"))
        acc3 = AccountService.create_account(db, AccountCreate(name="Payroll Escrow Pool"))

        # 2. Replicate Assessment Example on Account 1:
        # Initial: 0 -> Credit 100 -> Credit 50 -> Debit 30 -> Debit 20 -> Final: 100.00
        TransactionService.create_transaction(
            db,
            TransactionCreate(
                account_id=acc1.id,
                type="credit",
                amount="100.00",
                description="Capital injection series A",
                reference_id="SEED-CR-001",
            ),
        )
        TransactionService.create_transaction(
            db,
            TransactionCreate(
                account_id=acc1.id,
                type="credit",
                amount="50.00",
                description="Inbound client wire settlement",
                reference_id="SEED-CR-002",
            ),
        )
        TransactionService.create_transaction(
            db,
            TransactionCreate(
                account_id=acc1.id,
                type="debit",
                amount="30.00",
                description="Cloud infrastructure monthly bill",
                reference_id="SEED-DR-001",
            ),
        )
        TransactionService.create_transaction(
            db,
            TransactionCreate(
                account_id=acc1.id,
                type="debit",
                amount="20.00",
                description="Software subscription renewal",
                reference_id="SEED-DR-002",
            ),
        )

        # 3. Seed Account 2
        TransactionService.create_transaction(
            db,
            TransactionCreate(
                account_id=acc2.id,
                type="credit",
                amount="250.00",
                description="Merchant clearing opening balance",
                reference_id="SEED-CR-003",
            ),
        )

        # 4. Seed Account 3
        TransactionService.create_transaction(
            db,
            TransactionCreate(
                account_id=acc3.id,
                type="credit",
                amount="500.00",
                description="Monthly payroll escrow allocation",
                reference_id="SEED-CR-004",
            ),
        )

        # 5. Replicate Assessment Bonus Transfer:
        # Transfer 30 from Account 1 (balance 100 -> 70) to Account 2 (balance 250 -> 280)
        TransferService.create_transfer(
            db,
            TransferCreate(
                source_account_id=acc1.id,
                destination_account_id=acc2.id,
                amount="30.00",
                reference_id="SEED-TRF-001",
                description="Liquidity rebalancing tranche 1",
            ),
        )

        print("Database successfully seeded with realistic sample data!")
        print(f"Account 1: {acc1.name} (ID: {acc1.id})")
        print(f"Account 2: {acc2.name} (ID: {acc2.id})")
        print(f"Account 3: {acc3.name} (ID: {acc3.id})")

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
