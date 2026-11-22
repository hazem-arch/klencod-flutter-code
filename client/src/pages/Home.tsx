import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronLeft,
  CircleDollarSign,
  FileText,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  Settings2,
  SlidersHorizontal,
  Tags,
  Trash2,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";

type Section = "dashboard" | "transactions" | "parties" | "invoices" | "reports";
type TransactionType = "income" | "expense";

type Transaction = {
  id: string;
  type: TransactionType;
  description: string;
  category: string;
  party: string;
  amount: number;
  date: string;
};

type Party = { id: string; name: string; kind: "عميل" | "مورد"; phone: string; balance: number };
type Invoice = { id: string; number: string; party: string; amount: number; status: "مدفوعة" | "معلقة" | "متأخرة"; date: string };

const STORAGE = {
  transactions: "hisabati-transactions",
  parties: "hisabati-parties",
  invoices: "hisabati-invoices",
};

const initialTransactions: Transaction[] = [
  { id: "t-1", type: "income", description: "دفعة مشروع الهوية البصرية", category: "مبيعات", party: "شركة مدار", amount: 12500, date: "2026-11-16" },
  { id: "t-2", type: "expense", description: "اشتراك أدوات التصميم", category: "اشتراكات", party: "Adobe", amount: 780, date: "2026-11-15" },
  { id: "t-3", type: "income", description: "استشارة تسويقية", category: "خدمات", party: "متجر نواة", amount: 4200, date: "2026-11-13" },
  { id: "t-4", type: "expense", description: "فاتورة إنترنت المكتب", category: "تشغيل", party: "stc", amount: 460, date: "2026-11-12" },
  { id: "t-5", type: "expense", description: "مستلزمات مكتبية", category: "مستلزمات", party: "مكتبة جرير", amount: 315, date: "2026-11-09" },
  { id: "t-6", type: "income", description: "دفعة مقدمة للموقع", category: "مبيعات", party: "مؤسسة ركن", amount: 6800, date: "2026-11-05" },
];

const initialParties: Party[] = [
  { id: "p-1", name: "شركة مدار", kind: "عميل", phone: "050 123 8890", balance: 12500 },
  { id: "p-2", name: "متجر نواة", kind: "عميل", phone: "055 483 1112", balance: 4200 },
  { id: "p-3", name: "مؤسسة ركن", kind: "عميل", phone: "053 720 9921", balance: 6800 },
  { id: "p-4", name: "مكتبة جرير", kind: "مورد", phone: "9200 00089", balance: -315 },
  { id: "p-5", name: "stc", kind: "مورد", phone: "900", balance: -460 },
];

const initialInvoices: Invoice[] = [
  { id: "i-1", number: "INV-2026-021", party: "شركة مدار", amount: 12500, status: "مدفوعة", date: "16 نوفمبر 2026" },
  { id: "i-2", number: "INV-2026-020", party: "متجر نواة", amount: 4200, status: "معلقة", date: "13 نوفمبر 2026" },
  { id: "i-3", number: "INV-2026-019", party: "مؤسسة ركن", amount: 6800, status: "متأخرة", date: "05 نوفمبر 2026" },
];

const categories = ["مبيعات", "خدمات", "اشتراكات", "تشغيل", "مستلزمات", "رواتب", "أخرى"];
const number = new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 });
const compactNumber = new Intl.NumberFormat("ar-SA", { notation: "compact", maximumFractionDigits: 1 });

function readStorage<T>(key: string, fallback: T): T {
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-SA", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function formatLongDate(value = new Date()) {
  return new Intl.DateTimeFormat("ar-SA", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(value);
}

function initials(name: string) {
  return name.trim().split(" ").slice(0, 2).map((part) => part[0]).join("");
}

const navigation: Array<{ id: Section; label: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "نظرة عامة", icon: LayoutDashboard },
  { id: "transactions", label: "المعاملات", icon: ArrowLeftRight },
  { id: "parties", label: "العملاء والموردون", icon: Users },
  { id: "invoices", label: "الفواتير", icon: ReceiptText },
  { id: "reports", label: "التقارير", icon: BarChart3 },
];

export default function Home() {
  const [section, setSection] = useState<Section>("dashboard");
  const [transactions, setTransactions] = useState<Transaction[]>(() => readStorage(STORAGE.transactions, initialTransactions));
  const [parties] = useState<Party[]>(() => readStorage(STORAGE.parties, initialParties));
  const [invoices] = useState<Invoice[]>(() => readStorage(STORAGE.invoices, initialInvoices));
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [draft, setDraft] = useState({ type: "income" as TransactionType, description: "", category: "مبيعات", party: "", amount: "", date: "2026-11-16" });

  useEffect(() => {
    window.localStorage.setItem(STORAGE.transactions, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const totals = useMemo(() => {
    const income = transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
    const expense = transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
    return { income, expense, balance: income - expense, due: parties.filter((party) => party.kind === "عميل").reduce((sum, party) => sum + Math.max(party.balance, 0), 0) };
  }, [transactions, parties]);

  const filteredTransactions = useMemo(() => transactions.filter((item) => {
    const matchesQuery = [item.description, item.category, item.party].join(" ").toLowerCase().includes(query.toLowerCase());
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesQuery && matchesType && matchesCategory;
  }), [transactions, query, typeFilter, categoryFilter]);

  const categoryBreakdown = useMemo(() => categories.map((category) => {
    const income = transactions.filter((item) => item.type === "income" && item.category === category).reduce((sum, item) => sum + item.amount, 0);
    const expense = transactions.filter((item) => item.type === "expense" && item.category === category).reduce((sum, item) => sum + item.amount, 0);
    return { category, income, expense, total: income + expense };
  }).filter((row) => row.total > 0).sort((a, b) => b.total - a.total), [transactions]);

  const openAddModal = (type: TransactionType = "income") => {
    setEditingId(null);
    setDraft({ type, description: "", category: type === "income" ? "مبيعات" : "تشغيل", party: "", amount: "", date: "2026-11-16" });
    setIsModalOpen(true);
  };

  const openEditModal = (item: Transaction) => {
    setEditingId(item.id);
    setDraft({ type: item.type, description: item.description, category: item.category, party: item.party, amount: String(item.amount), date: item.date });
    setIsModalOpen(true);
  };

  const saveTransaction = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(draft.amount);
    if (!draft.description.trim() || !draft.party.trim() || !amount || amount <= 0) {
      setToast("أكمل وصف المعاملة والطرف والمبلغ أولًا");
      return;
    }
    const next: Transaction = { id: editingId ?? `t-${Date.now()}`, type: draft.type, description: draft.description.trim(), category: draft.category, party: draft.party.trim(), amount, date: draft.date };
    setTransactions((current) => editingId ? current.map((item) => item.id === editingId ? next : item) : [next, ...current]);
    setIsModalOpen(false);
    setToast(editingId ? "تم تحديث المعاملة" : "تمت إضافة المعاملة");
  };

  const removeTransaction = (id: string) => {
    if (!window.confirm("هل تريد حذف هذه المعاملة؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    setTransactions((current) => current.filter((item) => item.id !== id));
    setToast("تم حذف المعاملة");
  };

  const selectSection = (next: Section) => {
    setSection(next);
    setMobileNavOpen(false);
  };

  return (
    <div className="app-shell" dir="rtl">
      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Wallet size={20} strokeWidth={2.6} /></div>
          <div><strong>حساباتي</strong><span>دفترك المالي الذكي</span></div>
        </div>
        <div className="workspace-switcher"><div className="workspace-avatar">م</div><div><small>مساحة العمل</small><strong>مشروعي الخاص</strong></div><ChevronLeft size={16} /></div>
        <nav className="main-nav" aria-label="التنقل الرئيسي">
          <span className="nav-caption">الرئيسية</span>
          {navigation.map((item) => {
            const Icon = item.icon;
            return <button key={item.id} className={`nav-item ${section === item.id ? "active" : ""}`} onClick={() => selectSection(item.id)}><Icon size={18} /><span>{item.label}</span>{item.id === "invoices" && <b className="nav-count">3</b>}</button>;
          })}
          <span className="nav-caption settings-caption">الإعدادات</span>
          <button className="nav-item" onClick={() => setToast("ستتوفر الإعدادات المتقدمة قريبًا")}><Settings2 size={18} /><span>إعدادات الحساب</span></button>
        </nav>
        <div className="sidebar-footer"><div className="help-card"><div className="help-icon">?</div><div><strong>هل تحتاج مساعدة؟</strong><span>اطّلع على دليل الاستخدام</span></div></div><div className="user-card"><div className="user-avatar">م</div><div><strong>محمد العتيبي</strong><span>مالك الحساب</span></div><MoreHorizontal size={18} /></div></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><button className="mobile-menu" onClick={() => setMobileNavOpen((open) => !open)} aria-label="فتح القائمة"><Menu size={22} /></button><div className="breadcrumbs"><span>حساباتي</span><ChevronLeft size={15} /><strong>{navigation.find((item) => item.id === section)?.label}</strong></div><div className="top-actions"><button className="icon-button notification-button" aria-label="التنبيهات" onClick={() => setToast("لا توجد تنبيهات جديدة")}><Bell size={19} /><i /></button><div className="top-divider" /><button className="top-user" onClick={() => setToast("مرحبًا بك في حساباتك")}>م</button></div></header>

        <div className="page-container">
          {section === "dashboard" && <Dashboard totals={totals} transactions={transactions} categoryBreakdown={categoryBreakdown} onAdd={openAddModal} onNavigate={selectSection} />}
          {section === "transactions" && <TransactionsView items={filteredTransactions} query={query} setQuery={setQuery} typeFilter={typeFilter} setTypeFilter={setTypeFilter} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} onAdd={openAddModal} onEdit={openEditModal} onRemove={removeTransaction} />}
          {section === "parties" && <PartiesView parties={parties} onAdd={() => setToast("إضافة العملاء والموردين ستتوفر في الخطوة التالية")} />}
          {section === "invoices" && <InvoicesView invoices={invoices} onAdd={() => setToast("إنشاء الفاتورة سيُربط بالمعاملة عند تفعيل قاعدة البيانات")} />}
          {section === "reports" && <ReportsView totals={totals} breakdown={categoryBreakdown} transactions={transactions} />}
        </div>
      </main>

      <nav className="mobile-nav">{navigation.slice(0, 4).map((item) => { const Icon = item.icon; return <button key={item.id} className={section === item.id ? "active" : ""} onClick={() => selectSection(item.id)}><Icon size={19} /><span>{item.label === "العملاء والموردون" ? "الأطراف" : item.label.replace("نظرة عامة", "الرئيسية")}</span></button>; })}<button onClick={() => openAddModal()} className="mobile-add"><Plus size={21} /></button></nav>

      {isModalOpen && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setIsModalOpen(false)}><form className="transaction-modal" onSubmit={saveTransaction}><div className="modal-header"><div><span className="eyebrow">سجل مالي</span><h2>{editingId ? "تعديل المعاملة" : "إضافة معاملة جديدة"}</h2></div><button type="button" className="icon-button" onClick={() => setIsModalOpen(false)} aria-label="إغلاق"><X size={19} /></button></div><div className="type-toggle"><button type="button" className={draft.type === "income" ? "selected income" : ""} onClick={() => setDraft({ ...draft, type: "income", category: "مبيعات" })}><ArrowDownLeft size={16} /> دخل</button><button type="button" className={draft.type === "expense" ? "selected expense" : ""} onClick={() => setDraft({ ...draft, type: "expense", category: "تشغيل" })}><ArrowUpRight size={16} /> مصروف</button></div><div className="form-grid"><label>الوصف<input autoFocus value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="مثال: دفعة مشروع جديد" /></label><label>المبلغ (ر.س)<input type="number" min="1" value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: event.target.value })} placeholder="0" /></label><label>التصنيف<select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label>الطرف المرتبط<input value={draft.party} onChange={(event) => setDraft({ ...draft, party: event.target.value })} placeholder="اسم العميل أو المورد" /></label><label>التاريخ<input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} /></label></div><div className="modal-footer"><button type="button" className="button secondary" onClick={() => setIsModalOpen(false)}>إلغاء</button><button type="submit" className="button primary"><Check size={17} />{editingId ? "حفظ التعديلات" : "حفظ المعاملة"}</button></div></form></div>}
      {toast && <div className="toast"><Check size={17} /><span>{toast}</span></div>}
    </div>
  );
}

function Dashboard({ totals, transactions, categoryBreakdown, onAdd, onNavigate }: { totals: { income: number; expense: number; balance: number; due: number }; transactions: Transaction[]; categoryBreakdown: Array<{ category: string; income: number; expense: number; total: number }>; onAdd: (type?: TransactionType) => void; onNavigate: (section: Section) => void }) {
  const incomeShare = totals.expense ? Math.round((categoryBreakdown[0]?.expense ?? 0) / totals.expense * 100) : 0;
  const secondShare = totals.expense ? Math.round((categoryBreakdown[1]?.expense ?? 0) / totals.expense * 100) : 0;
  const thirdShare = totals.expense ? Math.round((categoryBreakdown[2]?.expense ?? 0) / totals.expense * 100) : 0;
  const firstEnd = incomeShare;
  const secondEnd = firstEnd + secondShare;
  const thirdEnd = secondEnd + thirdShare;
  const donutBackground = `conic-gradient(#0f9f78 0 ${firstEnd}%, #f3a34d ${firstEnd}% ${secondEnd}%, #5477ea ${secondEnd}% ${thirdEnd}%, #dce3eb ${thirdEnd}% 100%)`;
  return <>
    <div className="page-heading"><div><span className="eyebrow">{formatLongDate()}</span><h1>خلّ حساباتك تحت السيطرة<span className="heading-dot">.</span></h1><p>هذه صورة سريعة عن وضعك المالي اليوم.</p></div><button className="button primary add-button" onClick={() => onAdd()}><Plus size={18} /> إضافة معاملة</button></div>
    <section className="balance-banner"><div className="balance-copy"><span>الرصيد الحالي</span><strong>{number.format(totals.balance)}</strong><small><span className="trend-positive"><TrendingUp size={14} /> 12.8%</span> مقارنة بالشهر الماضي</small></div><div className="balance-visual"><div className="visual-line line-one" /><div className="visual-line line-two" /><div className="visual-dot dot-one" /><div className="visual-dot dot-two" /><div className="visual-dot dot-three" /></div><div className="balance-meta"><span>آخر تحديث</span><strong>منذ 5 دقائق</strong><button onClick={() => onNavigate("reports")}>عرض التقارير <ChevronLeft size={15} /></button></div></section>
    <section className="stats-grid"><StatCard label="إجمالي الدخل" value={totals.income} caption="هذا الشهر" tone="income" icon={TrendingUp} /><StatCard label="إجمالي المصروفات" value={totals.expense} caption="هذا الشهر" tone="expense" icon={TrendingDown} /><StatCard label="المبالغ المستحقة" value={totals.due} caption="من العملاء" tone="warning" icon={CircleDollarSign} /><StatCard label="عدد المعاملات" value={transactions.length} caption="هذا الشهر" tone="neutral" icon={ArrowLeftRight} isCount /> </section>
    <div className="content-grid"><section className="panel transactions-panel"><div className="panel-header"><div><h2>آخر المعاملات</h2><span>كل ما حدث في حساباتك مؤخرًا</span></div><button className="text-button" onClick={() => onNavigate("transactions")}>عرض الكل <ChevronLeft size={15} /></button></div><TransactionTable items={transactions.slice(0, 5)} compact /></section><section className="panel category-panel"><div className="panel-header"><div><h2>توزيع المصروفات</h2><span>حسب التصنيف هذا الشهر</span></div><button className="icon-button" onClick={() => onNavigate("reports")}><MoreHorizontal size={18} /></button></div><div className="donut-wrap"><div className="donut" style={{ background: donutBackground }}><div className="donut-center"><strong>{compactNumber.format(totals.expense)}</strong><span>ر.س</span></div></div><div className="legend">{categoryBreakdown.slice(0, 4).map((row, index) => <div key={row.category}><i className={`legend-dot dot-${index}`} /><span>{row.category}</span><strong>{totals.expense ? Math.round((row.expense / totals.expense) * 100) : 0}%</strong></div>)}</div></div><div className="category-progress"><span>أعلى تصنيف</span><strong>{categoryBreakdown[0]?.category ?? "لا توجد بيانات"}</strong><div className="progress-track"><i style={{ width: `${categoryBreakdown.length ? Math.min(100, Math.round((categoryBreakdown[0].total / Math.max(...categoryBreakdown.map((item) => item.total))) * 100)) : 0}%` }} /></div></div></section></div>
    <section className="quick-actions"><div><span className="eyebrow">اختصارات سريعة</span><h2>ماذا تريد أن تفعل؟</h2></div><button onClick={() => onAdd("income")}><span className="quick-icon income"><ArrowDownLeft size={18} /></span><span><strong>تسجيل دخل</strong><small>أضف دفعة أو مبيعة</small></span><ChevronLeft size={17} /></button><button onClick={() => onAdd("expense")}><span className="quick-icon expense"><ArrowUpRight size={18} /></span><span><strong>تسجيل مصروف</strong><small>تابع نفقاتك اليومية</small></span><ChevronLeft size={17} /></button><button onClick={() => onNavigate("invoices")}><span className="quick-icon invoice"><FileText size={18} /></span><span><strong>إنشاء فاتورة</strong><small>أرسل فاتورة لعميلك</small></span><ChevronLeft size={17} /></button></section>
  </>;
}

function StatCard({ label, value, caption, tone, icon: Icon, isCount }: { label: string; value: number; caption: string; tone: string; icon: typeof TrendingUp; isCount?: boolean }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={18} /></div><div className="stat-label"><span>{label}</span><small>{caption}</small></div><strong>{isCount ? value.toLocaleString("ar-SA") : number.format(value)}</strong><div className={`stat-accent ${tone}`} /></div>;
}

function TransactionsView({ items, query, setQuery, typeFilter, setTypeFilter, categoryFilter, setCategoryFilter, onAdd, onEdit, onRemove }: { items: Transaction[]; query: string; setQuery: (value: string) => void; typeFilter: "all" | TransactionType; setTypeFilter: (value: "all" | TransactionType) => void; categoryFilter: string; setCategoryFilter: (value: string) => void; onAdd: () => void; onEdit: (item: Transaction) => void; onRemove: (id: string) => void }) {
  return <><div className="page-heading section-heading"><div><span className="eyebrow">السجل المالي</span><h1>المعاملات</h1><p>تابع كل ما يدخل ويخرج من حسابك في مكان واحد.</p></div><button className="button primary" onClick={onAdd}><Plus size={18} /> إضافة معاملة</button></div><section className="panel full-panel"><div className="filters"><div className="search-box"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث في المعاملات..." /></div><div className="filter-select"><SlidersHorizontal size={17} /><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as "all" | TransactionType)}><option value="all">كل الأنواع</option><option value="income">الدخل فقط</option><option value="expense">المصروفات فقط</option></select></div><select className="filter-simple" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="all">كل التصنيفات</option>{categories.map((category) => <option key={category}>{category}</option>)}</select><button className="filter-date"><CalendarDays size={17} /> هذا الشهر</button></div><div className="table-wrap"><TransactionTable items={items} onEdit={onEdit} onRemove={onRemove} /></div>{items.length === 0 && <div className="empty-state"><Search size={25} /><strong>لم نجد معاملات مطابقة</strong><span>جرّب تغيير كلمة البحث أو الفلاتر.</span></div>}</section></>;
}

function TransactionTable({ items, compact, onEdit, onRemove }: { items: Transaction[]; compact?: boolean; onEdit?: (item: Transaction) => void; onRemove?: (id: string) => void }) {
  return <table className={`data-table ${compact ? "compact-table" : ""}`}><thead><tr><th>المعاملة</th><th>الطرف</th><th>التصنيف</th><th>التاريخ</th><th>المبلغ</th>{!compact && <th />}</tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><div className="transaction-name"><span className={`transaction-icon ${item.type}`}><>{item.type === "income" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}</></span><div><strong>{item.description}</strong><small>{item.type === "income" ? "دخل" : "مصروف"}</small></div></div></td><td className="muted-cell">{item.party}</td><td><span className="category-pill">{item.category}</span></td><td className="muted-cell">{formatDate(item.date)}</td><td><strong className={item.type === "income" ? "amount-income" : "amount-expense"}>{item.type === "income" ? "+" : "−"}{number.format(item.amount)}</strong></td>{!compact && <td><div className="row-actions"><button onClick={() => onEdit?.(item)} aria-label="تعديل"><Pencil size={15} /></button><button onClick={() => onRemove?.(item.id)} aria-label="حذف"><Trash2 size={15} /></button></div></td>}</tr>)}</tbody></table>;
}

function PartiesView({ parties, onAdd }: { parties: Party[]; onAdd: () => void }) {
  return <><div className="page-heading section-heading"><div><span className="eyebrow">دليل التعاملات</span><h1>العملاء والموردون</h1><p>اعرف من لك ومن عليك بسرعة.</p></div><button className="button primary" onClick={onAdd}><Plus size={18} /> إضافة طرف</button></div><div className="party-grid">{parties.map((party) => <article className="party-card" key={party.id}><div className="party-top"><div className="party-avatar">{initials(party.name)}</div><span className={`party-kind ${party.kind === "عميل" ? "client" : "vendor"}`}>{party.kind}</span></div><h3>{party.name}</h3><span className="party-phone">{party.phone}</span><div className="party-bottom"><div><small>{party.balance >= 0 ? "الرصيد المستحق" : "الرصيد الدائن"}</small><strong className={party.balance >= 0 ? "amount-income" : "amount-expense"}>{number.format(Math.abs(party.balance))}</strong></div><button className="icon-button"><ChevronLeft size={17} /></button></div></article>)}</div></>;
}

function InvoicesView({ invoices, onAdd }: { invoices: Invoice[]; onAdd: () => void }) {
  const pending = invoices.filter((invoice) => invoice.status !== "مدفوعة").reduce((sum, invoice) => sum + invoice.amount, 0);
  return <><div className="page-heading section-heading"><div><span className="eyebrow">مبيعاتك ومشترياتك</span><h1>الفواتير</h1><p>أنشئ فواتير واضحة وتابع حالتها حتى التحصيل.</p></div><button className="button primary" onClick={onAdd}><Plus size={18} /> إنشاء فاتورة</button></div><div className="invoice-summary"><div><span>الفواتير المفتوحة</span><strong>{invoices.filter((invoice) => invoice.status !== "مدفوعة").length}</strong></div><div><span>القيمة غير المحصلة</span><strong>{number.format(pending)}</strong></div><div><span>المحصّل هذا الشهر</span><strong className="amount-income">{number.format(invoices.filter((invoice) => invoice.status === "مدفوعة").reduce((sum, invoice) => sum + invoice.amount, 0))}</strong></div></div><section className="panel full-panel"><div className="panel-header"><div><h2>آخر الفواتير</h2><span>تحديثات الفوترة الأخيرة</span></div><button className="filter-date"><CalendarDays size={17} /> هذا الشهر</button></div><div className="table-wrap"><table className="data-table"><thead><tr><th>رقم الفاتورة</th><th>العميل</th><th>التاريخ</th><th>المبلغ</th><th>الحالة</th><th /></tr></thead><tbody>{invoices.map((invoice) => <tr key={invoice.id}><td><strong>{invoice.number}</strong></td><td className="muted-cell">{invoice.party}</td><td className="muted-cell">{invoice.date}</td><td><strong>{number.format(invoice.amount)}</strong></td><td><span className={`status-pill ${invoice.status === "مدفوعة" ? "paid" : invoice.status === "متأخرة" ? "late" : "pending"}`}><i />{invoice.status}</span></td><td><button className="row-more"><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table></div></section></>;
}

function ReportsView({ totals, breakdown, transactions }: { totals: { income: number; expense: number; balance: number; due: number }; breakdown: Array<{ category: string; income: number; expense: number; total: number }>; transactions: Transaction[] }) {
  const max = Math.max(...breakdown.map((row) => row.total), 1);
  return <><div className="page-heading section-heading"><div><span className="eyebrow">قراءة أعمق لأرقامك</span><h1>التقارير</h1><p>ملخص بصري يساعدك على اتخاذ قرار أفضل.</p></div><button className="filter-date"><CalendarDays size={17} /> نوفمبر 2026</button></div><div className="report-grid"><section className="panel report-chart"><div className="panel-header"><div><h2>الدخل والمصروفات</h2><span>مقارنة حسب التصنيف</span></div><div className="chart-legend"><span><i className="income-dot" /> الدخل</span><span><i className="expense-dot" /> المصروفات</span></div></div><div className="bars">{breakdown.map((row) => <div className="bar-group" key={row.category}><div className="bar-values"><i className="income-bar" style={{ height: `${Math.max(8, (row.income / max) * 170)}px` }} /><i className="expense-bar" style={{ height: `${Math.max(8, (row.expense / max) * 170)}px` }} /></div><span>{row.category}</span></div>)}</div></section><section className="panel report-health"><div className="panel-header"><div><h2>صحة الحساب</h2><span>مؤشرات هذا الشهر</span></div><CircleDollarSign size={20} className="panel-icon" /></div><div className="health-score"><div className="score-ring"><strong>84</strong><span>/ 100</span></div><div><strong>وضع جيد</strong><p>استمر في متابعة المصروفات المتكررة لتحافظ على هذا المستوى.</p></div></div><div className="health-list"><div><span>نسبة الادخار</span><strong>{totals.income ? Math.round((totals.balance / totals.income) * 100) : 0}%</strong></div><div><span>متوسط المعاملة</span><strong>{number.format(transactions.length ? (totals.income + totals.expense) / transactions.length : 0)}</strong></div></div></section></div><section className="panel breakdown-panel"><div className="panel-header"><div><h2>تفاصيل التصنيفات</h2><span>توزيع كل تصنيف داخل الحساب</span></div><Tags size={19} className="panel-icon" /></div><div className="breakdown-list">{breakdown.map((row) => <div className="breakdown-row" key={row.category}><div className="breakdown-name"><span className="breakdown-avatar">{row.category.slice(0, 1)}</span><strong>{row.category}</strong></div><div className="breakdown-track"><i style={{ width: `${(row.total / max) * 100}%` }} /></div><strong>{number.format(row.total)}</strong></div>)}</div></section></>;
}
