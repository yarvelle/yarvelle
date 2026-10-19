# Yarvelle — Personal & Family AI Assistant Application
# Copyright 2026 Spectrayan (https://spectrayan.com)
#
# Licensed under the PolyForm Noncommercial License 1.0.0 and the
# Yarvelle Additional Terms (see LICENSE and ADDITIONAL-TERMS.md).
# Personal and household local use only. Commercial use, hosted service
# offering, rebranding, white-labeling, and redistribution of modified
# forks are prohibited without a written commercial license from Spectrayan.
#
# Required Notice: Copyright 2026 Spectrayan (https://spectrayan.com)

"""Offline Local Statement Ingestion Adapter for Local-First Testing."""

from __future__ import annotations

import csv
import hashlib
import json
from pathlib import Path
from typing import Any, Dict, List, Union

from connectors.finance.models import AccountSummary, StatementMetadata, TransactionRecord


class LocalStatementIngester:
    """Parses local CSV/OFX/JSON statement exports for offline testing without live API keys."""

    @staticmethod
    def parse_csv_transactions(csv_content: str, account_id: str = "acct-local-1") -> List[TransactionRecord]:
        reader = csv.DictReader(csv_content.strip().splitlines())
        records: List[TransactionRecord] = []
        for idx, row in enumerate(reader):
            tx_id = row.get("id") or row.get("Transaction ID") or f"tx-{idx+1}"
            date_val = row.get("date") or row.get("Date") or "2026-10-16"
            payee_val = row.get("payee") or row.get("Description") or row.get("Merchant") or "Unknown Payee"
            raw_amt = row.get("amount") or row.get("Amount") or "0.0"
            try:
                amount_val = float(str(raw_amt).replace("$", "").replace(",", "").strip())
            except ValueError:
                amount_val = 0.0
            category_val = row.get("category") or row.get("Category") or "General"

            records.append(
                TransactionRecord(
                    id=str(tx_id).strip(),
                    account_id=account_id,
                    date=str(date_val).strip(),
                    payee=str(payee_val).strip(),
                    amount=amount_val,
                    category=str(category_val).strip(),
                    pending=False,
                )
            )
        return records

    @staticmethod
    def parse_json_statement(json_data: Union[str, Dict[str, Any]]) -> Dict[str, Any]:
        data = json.loads(json_data) if isinstance(json_data, str) else json_data
        accounts = [AccountSummary.model_validate(a) for a in data.get("accounts", [])]
        transactions = [TransactionRecord.model_validate(t) for t in data.get("transactions", [])]
        statements = [StatementMetadata.model_validate(s) for s in data.get("statements", [])]
        return {
            "accounts": [a.model_dump() for a in accounts],
            "transactions": [t.model_dump() for t in transactions],
            "statements": [s.model_dump() for s in statements],
        }
