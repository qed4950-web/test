from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any

router = APIRouter(
    prefix="/v1/accounting",
    tags=["accounting"],
)

class TaxCreditRequest(BaseModel):
    employees_count: int
    youth_employees_count: int
    rnd_expenses: int
    facility_investment: int
    location: str = "metropolitan" # metropolitan or regional

class DeductionItem(BaseModel):
    name: str # e.g. "Youth Employment Credit"
    amount: int
    description: str
    probability: float # 0.0 to 1.0 confidence

class TaxAnalysisResponse(BaseModel):
    total_estimated_savings: int
    deductions: List[DeductionItem]
    risk_level: str # LOW, MEDIUM, HIGH
    summary: str

@router.post("/detect-credits", response_model=TaxAnalysisResponse)
async def detect_tax_credits(req: TaxCreditRequest):
    deductions = []
    total_savings = 0

    # 1. Youth Employment Tax Credit Simulation
    # Approx 11M KRW per person in metro, 12M in regional
    per_person_credit = 11_000_000 if req.location == "metropolitan" else 12_000_000
    if req.youth_employees_count > 0:
        youth_credit = req.youth_employees_count * per_person_credit
        deductions.append(DeductionItem(
            name="청년 고용 증대 세액 공제",
            amount=youth_credit,
            description=f"청년 정규직 {req.youth_employees_count}명 채용에 대한 공제 (인당 {per_person_credit/10000}만원)",
            probability=0.95
        ))
        total_savings += youth_credit

    # 2. R&D Tax Credit Simulation
    # Assuming valid R&D expenses, small business rate approx 25% of excess or 50% of total (simplified to 25% of total for demo)
    if req.rnd_expenses > 0:
        rnd_credit = int(req.rnd_expenses * 0.25)
        deductions.append(DeductionItem(
            name="연구인력개발비 세액 공제",
            amount=rnd_credit,
            description="기업부설연구소 인증 기반 R&D 비용 25% 공제 예상",
            probability=0.85
        ))
        total_savings += rnd_credit

    # 3. Investment Tax Credit (Temporary Investment Credit)
    # Approx 10% for facility investment
    if req.facility_investment > 0:
        invest_credit = int(req.facility_investment * 0.10)
        deductions.append(DeductionItem(
            name="통합 투자 세액 공제",
            amount=invest_credit,
            description="사업용 설비 투자 금액의 10% 공제",
            probability=0.90
        ))
        total_savings += invest_credit

    return TaxAnalysisResponse(
        total_estimated_savings=total_savings,
        deductions=deductions,
        risk_level="LOW",
        summary=f"총 {len(deductions)}건의 공제 항목이 감지되었습니다. 예상 절세액은 {total_savings:,}원 입니다."
    )
