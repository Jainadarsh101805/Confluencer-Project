from decimal import Decimal, InvalidOperation
from typing import Any, Generic, List, TypeVar, Optional
from pydantic import BaseModel, Field, field_validator

T = TypeVar("T")


class PaginationMeta(BaseModel):
    current_page: int = Field(..., description="Current page number (1-indexed)")
    page_size: int = Field(..., description="Number of records per page")
    total_records: int = Field(..., description="Total count of matching records")
    total_pages: int = Field(..., description="Total number of pages")


class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    pagination: PaginationMeta


def parse_and_validate_amount(v: Any) -> Decimal:
    """
    Strict monetary decimal validation:
    - Must be convertable to Decimal without float imprecision
    - Must be strictly positive (> 0)
    - Must have at most 2 decimal places (cents/pennies precision)
    - Prevents overflow and negative amounts
    """
    if v is None:
        raise ValueError("Amount is required.")
    
    try:
        if isinstance(v, (int, str)):
            d = Decimal(str(v).strip())
        elif isinstance(v, Decimal):
            d = v
        else:
            # Rejects float types to avoid precision loss
            d = Decimal(str(v))
    except (InvalidOperation, TypeError):
        raise ValueError("Amount must be a valid numeric decimal representation.")
    
    if d <= Decimal("0"):
        raise ValueError("Amount must be strictly greater than 0.")
    
    # Check exponent / decimal places
    # If exponent is negative, number of decimal places is abs(exponent)
    sign, digits, exponent = d.as_tuple()
    if exponent < -2:
        raise ValueError("Amount exceeds maximum supported precision of 2 decimal places.")
    
    if d > Decimal("99999999999999.99"):
        raise ValueError("Amount exceeds maximum supported limit.")
        
    return d.quantize(Decimal("0.01"))


def format_decimal(value: Optional[Decimal]) -> str:
    if value is None:
        return "0.00"
    return f"{Decimal(str(value)):.2f}"
