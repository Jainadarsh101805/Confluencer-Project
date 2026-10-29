from typing import Any, Dict, Optional
from fastapi import HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class LedgerException(Exception):
    """Base exception for all domain errors in LEDGER//ONE"""
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)


class AccountNotFoundError(LedgerException):
    def __init__(self, account_id: str):
        super().__init__(
            code="ACCOUNT_NOT_FOUND",
            message=f"Account '{account_id}' was not found in the ledger.",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"account_id": account_id},
        )


class InsufficientBalanceError(LedgerException):
    def __init__(self, account_id: str, available_balance: str, required_amount: str):
        super().__init__(
            code="INSUFFICIENT_BALANCE",
            message="Transaction declined. This account does not have enough available funds. No balance change was recorded.",
            status_code=status.HTTP_400_BAD_REQUEST,
            details={
                "account_id": account_id,
                "available_balance": available_balance,
                "required_amount": required_amount,
            },
        )


class DuplicateReferenceError(LedgerException):
    def __init__(self, account_id: str, reference_id: str):
        super().__init__(
            code="DUPLICATE_REFERENCE",
            message="This reference has already been used for this account. Use a new reference to create a distinct transaction.",
            status_code=status.HTTP_409_CONFLICT,
            details={"account_id": account_id, "reference_id": reference_id},
        )


class InvalidTransactionTypeError(LedgerException):
    def __init__(self, received_type: str):
        super().__init__(
            code="INVALID_TRANSACTION_TYPE",
            message=f"Invalid transaction type '{received_type}'. Transaction type must be strictly 'credit' or 'debit'.",
            status_code=status.HTTP_400_BAD_REQUEST,
            details={"received_type": received_type, "allowed": ["credit", "debit"]},
        )


class InvalidAmountError(LedgerException):
    def __init__(self, reason: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            code="INVALID_AMOUNT",
            message=f"Invalid monetary amount: {reason}",
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details or {},
        )


class InvalidPaginationError(LedgerException):
    def __init__(self, reason: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            code="INVALID_PAGINATION",
            message=f"Invalid pagination parameters: {reason}",
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details or {},
        )


class SameAccountTransferError(LedgerException):
    def __init__(self, account_id: str):
        super().__init__(
            code="SAME_ACCOUNT_TRANSFER",
            message="Source and destination accounts must be distinct.",
            status_code=status.HTTP_400_BAD_REQUEST,
            details={"account_id": account_id},
        )


class TransactionImmutabilityError(LedgerException):
    def __init__(self, action: str):
        super().__init__(
            code="IMMUTABLE_RECORD",
            message=f"Ledger integrity violation: Existing transactions cannot be {action}d.",
            status_code=status.HTTP_403_FORBIDDEN,
            details={"action": action},
        )


def format_error_response(code: str, message: str, details: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    return {
        "error": {
            "code": code,
            "message": message,
            "details": details or {},
        }
    }


async def ledger_exception_handler(request: Request, exc: LedgerException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=format_error_response(
            code=exc.code,
            message=exc.message,
            details=exc.details,
        ),
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    errors = []
    for err in exc.errors():
        loc = " -> ".join([str(x) for x in err.get("loc", []) if x != "body"])
        msg = err.get("msg", "Invalid value")
        errors.append({"field": loc, "message": msg})
    
    first_msg = errors[0]["message"] if errors else "Invalid request body."
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=format_error_response(
            code="VALIDATION_ERROR",
            message=f"Request validation failed: {first_msg}",
            details={"validation_errors": errors},
        ),
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=format_error_response(
            code="INTERNAL_SERVER_ERROR",
            message="An unexpected server error occurred while processing the financial transaction.",
            details={"type": type(exc).__name__},
        ),
    )
