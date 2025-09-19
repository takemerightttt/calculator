import React, {useMemo, useState} from "react";
import "./calculator.css";

type Row = {
    month: number;
    startDebt: number;
    interest: number;
    paymentPlanned: number;
    paymentApplied: number;
    endDebt: number;
};

const fmtMoney = (n: number) =>
    new Intl.NumberFormat("ru-RU", {style: "currency", currency: "RUB", maximumFractionDigits: 2}).format(
        Math.round(n * 100) / 100
    );

function computeSchedule(total: number, annualRate: number, payments: number[]): {
    schedule: Row[];
    totalInterest: number;
    payoffMonth: number | null;
    remainingDebt: number;
} {
    const monthlyRate = annualRate / 12;
    let debt = total;
    const schedule: Row[] = [];
    let totalInterest = 0;
    let payoffMonth: number | null = null;

    for (let i = 0; i < payments.length; i++) {
        if (debt <= 0) break;
        const month = i + 1;
        const startDebt = debt;
        const interest = startDebt * monthlyRate;
        totalInterest += interest;

        const paymentPlanned = payments[i] > 0 ? payments[i] : 0;
        const paymentApplied = Math.min(paymentPlanned, startDebt);
        const endDebt = Math.max(startDebt - paymentApplied, 0);

        schedule.push({month, startDebt, interest, paymentPlanned, paymentApplied, endDebt});
        debt = endDebt;
        if (debt === 0 && payoffMonth === null) payoffMonth = month;
    }

    return {schedule, totalInterest, payoffMonth, remainingDebt: debt};
}

const Calculator = () => {
    const [total, setTotal] = useState<string>("");
    const [annualRatePct, setAnnualRatePct] = useState<string>("");
    const [months, setMonths] = useState<string>("");
    const [payments, setPayments] = useState<number[]>([]);

    const valid = total && annualRatePct && months;

    const {schedule, totalInterest, payoffMonth, remainingDebt} = useMemo(() => {
        if (!valid) return {schedule: [], totalInterest: 0, payoffMonth: null, remainingDebt: 0};
        return computeSchedule(Number(total), Number(annualRatePct) / 100, payments);
    }, [total, annualRatePct, months, payments, valid]);

    function setPaymentAt(index: number, value: number) {
        setPayments((prev) => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    }

    function setMonthsCount(n: number | null) {
        if (n === null || Number.isNaN(n)) {
            setMonths("");
            setPayments([]);
            return;
        }

        const m = Math.max(1, Math.floor(n));
        setMonths(String(m));
        setPayments((prev) => {
            const next = [...prev];
            if (m > next.length) {
                next.push(...Array.from({length: m - next.length}, () => 0));
            } else if (m < next.length) {
                next.length = m;
            }
            return next;
        });
    }

    function handleTotalChange(e: React.ChangeEvent<HTMLInputElement>) {
        const raw = e.target.value.replace(/\s/g, "");
        const digits = raw.replace(/\D/g, "");
        setTotal(digits);
    }

    function formatNumber(n: string) {
        if (!n) return "";
        return n.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }

    function formatMoneyInput(n: number): string {
        if (!n) return "";
        return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }

    function parseMoneyInput(s: string): number {
        return Number(s.replace(/\s/g, "").replace(/\D/g, "")) || 0;
    }

    return (
        <div className="app">
            <header className="header">
                <h1>Калькулятор долга</h1>
                <p>Введите параметры кредита и задайте платежи по месяцам.</p>
            </header>
            <section className="card grid">
                <div className="field">
                    <label>Сумма займа</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={formatNumber(total)}
                        onChange={handleTotalChange}
                    />
                </div>
                <div className="field">
                    <label>Ставка, % годовых</label>
                    <input
                        type="number"
                        min={0.01}
                        step={0.01}
                        value={annualRatePct}
                        onChange={(e) => setAnnualRatePct(e.target.value)}
                    />
                </div>
                <div className="field">
                    <label>Количество месяцев</label>
                    <input
                        type="number"
                        min={1}
                        step={1}
                        value={months}
                        onChange={(e) => {
                            const val = e.target.value;
                            setMonthsCount(val === "" ? null : Number(val));
                        }}
                    />
                </div>
            </section>
            {valid && (
                <section className="card">
                    <div className="tableWrap">
                        <table className="table">
                            <thead>
                            <tr>
                                <th>Месяц</th>
                                <th>Долг на начало</th>
                                <th>Проценты</th>
                                <th>Платёж по телу</th>
                                <th>Платеж</th>
                                <th>Остаток без процентов</th>
                            </tr>
                            </thead>
                            <tbody>
                            {payments.map((val, i) => {
                                const row = schedule[i];
                                return (
                                    <tr key={i}>
                                        <td>{i + 1}</td>
                                        <td>{row ? fmtMoney(row.startDebt) : "—"}</td>
                                        <td>{row ? fmtMoney(row.interest) : "—"}</td>
                                        <td>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                className="payment-input"
                                                value={formatMoneyInput(val)}
                                                onChange={(e) => setPaymentAt(i, parseMoneyInput(e.target.value))}
                                            />
                                        </td>
                                        <td>{row ? fmtMoney(row.paymentApplied) : "—"}</td>
                                        <td>{row ? fmtMoney(row.endDebt) : "—"}</td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
            {valid && (
                <section className="card summary">
                    <div className="summaryItem">
                        <div className="label">Итог процентов</div>
                        <div className="value">{fmtMoney(totalInterest)}</div>
                    </div>
                    <div className="summaryItem">
                        <div className="label">Общая сумма к возврату</div>
                        <div className="value">{fmtMoney(Number(total) + totalInterest)}</div>
                    </div>
                    <div className="summaryItem">
                        <div className="label">Месяц полного погашения</div>
                        <div className="value">{payoffMonth ? `${payoffMonth}` : "ещё не закрыт"}</div>
                    </div>
                    {remainingDebt > 0 && <p className="note">Остаток долга: {fmtMoney(remainingDebt)}</p>}
                </section>
            )}
        </div>
    );
};

export {Calculator};