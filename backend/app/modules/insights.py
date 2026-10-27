from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.core.config import AI_PROVIDER
from app.core.security import current_user
from app.core.storage import change, read
from app.domain.common import audit, get_scoped, new_id, now, scoped
from app.domain.financial import money, simulate

router = APIRouter(tags=["insights"])


def overview(db: dict, tenant_id: str, days: int | None = None, creditor_id: str | None = None, portfolio_id: str | None = None) -> dict:
    portfolios = scoped(db, "portfolios", tenant_id)
    if creditor_id:
        get_scoped(db, "creditors", creditor_id, tenant_id)
        portfolios = [item for item in portfolios if item["creditor_id"] == creditor_id]
    if portfolio_id:
        get_scoped(db, "portfolios", portfolio_id, tenant_id)
        portfolios = [item for item in portfolios if item["id"] == portfolio_id]
    allowed_portfolios = {item["id"] for item in portfolios}
    titles = [item for item in scoped(db, "receivables", tenant_id) if not (creditor_id or portfolio_id) or item.get("portfolio_id") in allowed_portfolios]
    title_ids = {item["id"] for item in titles}
    agreements = [item for item in scoped(db, "agreements", tenant_id) if any(title_id in title_ids for title_id in item["receivable_ids"])]
    agreement_ids = {item["id"] for item in agreements}
    payments = [item for item in scoped(db, "payments", tenant_id) if item["agreement_id"] in agreement_ids]
    negotiations = [item for item in scoped(db, "negotiations", tenant_id) if any(title_id in title_ids for title_id in item["receivable_ids"])]
    if days:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        payments = [item for item in payments if item.get("confirmed_at", item["created_at"]) >= cutoff]
        negotiations = [item for item in negotiations if item["created_at"] >= cutoff]
    def payment_value(payment: dict) -> Decimal:
        if creditor_id or portfolio_id:
            return sum((money(item["amount"]) for item in payment.get("allocations", []) if item["receivable_id"] in title_ids), Decimal("0"))
        return money(payment["amount"])
    recovered = sum((payment_value(p) for p in payments if p["status"] == "confirmed"), Decimal("0"))
    active_title_ids = {title_id for agreement in agreements if agreement["status"] == "active" for title_id in agreement["receivable_ids"]}
    outstanding = sum((money(title["balance"]) for title in titles if title["id"] in active_title_ids), Decimal("0"))
    unnegotiated = sum((money(title["balance"]) for title in titles if title.get("status") != "paid" and title["id"] not in active_title_ids), Decimal("0"))
    overdue = [t for t in titles if t.get("status") != "paid" and t.get("due_date", "9999") < date.today().isoformat()]
    by_portfolio = defaultdict(Decimal)
    for title in titles:
        by_portfolio[title.get("portfolio_id", "Sem carteira")] += money(title["balance"])
    trend = defaultdict(Decimal)
    for payment in payments:
        if payment["status"] == "confirmed":
            trend[payment["confirmed_at"][:7]] += payment_value(payment)
    denominator = recovered + outstanding + unnegotiated
    return {"total_collection": str(outstanding + unnegotiated), "recovered": str(recovered), "delinquent_customers": len({t["customer_id"] for t in overdue}), "active_agreements": sum(a["status"] == "active" for a in agreements), "broken_agreements": sum(a["status"] == "broken" for a in agreements), "overdue_titles": len(overdue), "recovery_rate": round(float(recovered / denominator * 100), 1) if denominator else 0, "active_negotiations": sum(n["status"] in ("draft", "pending_approval", "approved") for n in negotiations), "by_portfolio": [{"id": key, "value": str(value)} for key, value in by_portfolio.items()], "trend": [{"month": key, "value": str(value)} for key, value in sorted(trend.items())]}


@router.get("/dashboard/overview")
def dashboard(days: int | None = Query(default=None, ge=1, le=3650), creditor_id: str | None = None, portfolio_id: str | None = None, user: dict = Depends(current_user)):
    return overview(read(), user["tenant_id"], days, creditor_id, portfolio_id)


class AIInput(BaseModel):
    customer_id: str | None = None
    question: str = ""
    message_type: str = "primeiro_contato"
    channel: str = "email"
    tone: str = "cordial"
    receivable_ids: list[str] = []


@router.get("/ai/status")
def ai_status(user: dict = Depends(current_user)):
    return {"provider": AI_PROVIDER, "mode": "Modo demonstrativo" if AI_PROVIDER == "demo" else "Indisponível", "available": AI_PROVIDER == "demo"}


@router.post("/ai/{agent}")
def run_agent(agent: str, payload: AIInput, user: dict = Depends(current_user)):
    if agent not in ("analyze-customer", "suggest-negotiation", "generate-message", "management-query"):
        raise HTTPException(404, "Agente não encontrado")
    if AI_PROVIDER != "demo":
        raise HTTPException(503, "Provedor externo ainda não configurado")
    db = read()
    tenant_id = user["tenant_id"]
    customer = get_scoped(db, "customers", payload.customer_id, tenant_id) if payload.customer_id else None
    if agent != "management-query" and not customer:
        raise HTTPException(422, "Selecione um cliente")
    if agent == "analyze-customer":
        titles = [t for t in scoped(db, "receivables", tenant_id) if t["customer_id"] == customer["id"]]
        occurrences = [o for o in scoped(db, "occurrences", tenant_id) if o["customer_id"] == customer["id"]]
        overdue = sum(t.get("due_date", "9999") < date.today().isoformat() for t in titles)
        result = {"summary": f"{customer['name']} possui {len(titles)} título(s), {overdue} vencido(s) e {len(occurrences)} ocorrência(s).", "recommendations": ["Confirmar dados de contato antes da abordagem", "Revisar títulos e histórico antes de propor condições", "Usar o simulador oficial para qualquer proposta"], "missing": [label for label, key in (("e-mail", "email"), ("telefone", "phone")) if not customer.get(key)]}
    elif agent == "suggest-negotiation":
        ids = payload.receivable_ids or [t["id"] for t in scoped(db, "receivables", tenant_id) if t["customer_id"] == customer["id"] and money(t["balance"]) > 0][:2]
        if not ids:
            raise HTTPException(422, "Cliente sem título elegível")
        proposal = None
        for count in (3, 2, 1):
            try:
                proposal = simulate(db, tenant_id, customer["id"], ids, Decimal("10"), Decimal("0"), count, date.today() + timedelta(days=7))
                break
            except HTTPException as error:
                if error.status_code != 422 or "Parcela mínima" not in str(error.detail):
                    raise
        if proposal is None:
            raise HTTPException(422, "Nenhuma proposta elegível para os títulos selecionados")
        result = {"summary": "Proposta demonstrativa calculada pelo serviço financeiro oficial.", "proposal": proposal}
    elif agent == "generate-message":
        if payload.message_type not in ("primeiro_contato", "lembrete", "proposta", "confirmacao", "vencimento", "retorno"):
            raise HTTPException(422, "Tipo de mensagem inválido")
        result = {"message": f"Olá, {customer['name']}. Entramos em contato para conversar sobre uma pendência registrada em nossa carteira. Se desejar, podemos apresentar as informações e alternativas disponíveis. Responda por este canal no melhor horário para você. Atenciosamente, equipe de atendimento.", "channel": payload.channel, "notice": "Rascunho demonstrativo. Nenhuma mensagem foi enviada."}
    else:
        metrics = overview(db, tenant_id)
        question = payload.question.strip()
        if not question:
            raise HTTPException(422, "Informe uma pergunta")
        normalized = question.casefold()
        if "carteira" in normalized:
            if "recuper" in normalized:
                recovered_by_portfolio = defaultdict(Decimal)
                titles_by_id = {title["id"]: title for title in scoped(db, "receivables", tenant_id)}
                for payment in scoped(db, "payments", tenant_id):
                    if payment["status"] == "confirmed":
                        for allocation in payment.get("allocations", []):
                            title = titles_by_id.get(allocation["receivable_id"])
                            if title:
                                recovered_by_portfolio[title.get("portfolio_id", "Sem carteira")] += money(allocation["amount"])
                ranking = sorted(recovered_by_portfolio.items(), key=lambda item: item[1], reverse=True)
                portfolio = get_scoped(db, "portfolios", ranking[0][0], tenant_id) if ranking and ranking[0][0] != "Sem carteira" else None
                answer = f"A carteira com maior valor recuperado é {portfolio['name']}, com R$ {ranking[0][1]}." if portfolio else "Não há recuperação por carteira registrada nesta empresa."
            else:
                ranking = sorted(metrics["by_portfolio"], key=lambda item: Decimal(item["value"]), reverse=True)
                portfolio = get_scoped(db, "portfolios", ranking[0]["id"], tenant_id) if ranking and ranking[0]["id"] != "Sem carteira" else None
                answer = f"A carteira com maior saldo em cobrança é {portfolio['name']}, com R$ {ranking[0]['value']}." if portfolio else "Não há carteiras com saldo nesta empresa."
        elif "acordo" in normalized:
            answer = f"Há {metrics['active_agreements']} acordos ativos nesta empresa."
        elif "título" in normalized or "vencid" in normalized:
            answer = f"Há {metrics['overdue_titles']} títulos vencidos nesta empresa."
        elif "recuper" in normalized or "pagamento" in normalized:
            answer = f"O total recuperado em pagamentos confirmados é R$ {metrics['recovered']}."
        else:
            answer = f"Resumo disponível: R$ {metrics['recovered']} recuperados, {metrics['active_agreements']} acordos ativos e {metrics['overdue_titles']} títulos vencidos."
        result = {"answer": answer, "metrics": metrics, "question": question}
    def record(store):
        execution = {"id": new_id(), "tenant_id": tenant_id, "agent": agent, "user_id": user["id"], "customer_id": payload.customer_id, "mode": "demo", "result": result, "created_at": now()}
        store["records"].setdefault("ai_executions", []).append(execution)
        audit(store, user, "execute", "ai", execution["id"], agent)
        return execution
    return change(record)
