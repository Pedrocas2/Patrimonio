/* ===== 1. Dados de exemplo (substituir por API/base de dados) ===== */
const FX = 912;                       // 1 USD em Kz (assumido)
const TODAY = new Date('2026-10-30');
const D = {
  bancos:[
    {n:'BAI',saldo:2850000,inv:5000000,juros:410000,taxa:14,venc:'2027-03-04'},
    {n:'BFA',saldo:1900000,inv:3000000,juros:215000,taxa:13.5,venc:'2026-12-18'},
    {n:'BPC',saldo:980000,inv:2000000,juros:96000,taxa:12,venc:'2027-01-22'},
    {n:'Banco Atlântico',saldo:1450000,inv:2500000,juros:238000,taxa:15,venc:'2026-11-04'}],
  depositos:[
    {b:'BAI',v:5000000,t:14,m:12,ini:'2026-03-04'},
    {b:'BFA',v:3000000,t:13.5,m:9,ini:'2026-03-18'},
    {b:'BPC',v:2000000,t:12,m:6,ini:'2026-07-22'},
    {b:'Banco Atlântico',v:2500000,t:15,m:6,ini:'2026-05-04'}],
  comparar:[
    {b:'BAI',t:14,m:12},{b:'BFA',t:13.5,m:9},{b:'BPC',t:12,m:6},{b:'Banco Atlântico',t:15,m:12},{b:'BIC',t:14.5,m:12}],
  cripto:[
    {n:'Bitcoin',s:'BTC',q:0.085,p:68200,c:61500,v:-3.0,i:'bi-currency-bitcoin'},
    {n:'Ethereum',s:'ETH',q:1.9,p:2540,c:2210,v:1.8,i:'bi-gem'},
    {n:'Solana',s:'SOL',q:24,p:162,c:140,v:4.2,i:'bi-lightning-charge'}],
  bolsa:[
    {n:'Apple',s:'AAPL',q:12,c:182,p:214},
    {n:'Microsoft',s:'MSFT',q:6,c:355,p:421},
    {n:'Tesla',s:'TSLA',q:9,c:245,p:228}],
  hist:[
    {t:'Depósito',d:'2026-10-28',x:'Entrada em BAI',v:500000,i:'bi-arrow-down-circle'},
    {t:'Compra',d:'2026-10-22',x:'6 ações Microsoft',v:-2300000,i:'bi-bag'},
    {t:'Transferência',d:'2026-10-15',x:'BFA → Banco Atlântico',v:-300000,i:'bi-arrow-left-right'},
    {t:'Venda',d:'2026-10-09',x:'0,4 ETH vendidos',v:925000,i:'bi-cash-coin'},
    {t:'Levantamento',d:'2026-10-02',x:'Levantamento BPC',v:-150000,i:'bi-arrow-up-circle'}]
};

/* ===== 2. Utilitários ===== */
const kz = n => new Intl.NumberFormat('pt-PT',{maximumFractionDigits:0}).format(n)+' Kz';
const usd = n => new Intl.NumberFormat('pt-PT',{style:'currency',currency:'USD'}).format(n);
const dt = s => new Date(s).toLocaleDateString('pt-PT',{day:'2-digit',month:'short',year:'numeric'});
const addM = (s,m)=>{const d=new Date(s);d.setMonth(d.getMonth()+m);return d.toISOString().slice(0,10)};
const days = s => Math.ceil((new Date(s)-TODAY)/864e5);
const cls = n => n>=0?'pos':'neg';
const sign = n => (n>=0?'+':'')+n.toFixed(1).replace('.',',')+'%';

/* ===== 3. Cálculos ===== */
const tot = {
  bancos: D.bancos.reduce((a,b)=>a+b.saldo,0),
  dep: D.depositos.reduce((a,d)=>a+d.v,0),
  cripto: D.cripto.reduce((a,c)=>a+c.q*c.p*FX,0),
  bolsa: D.bolsa.reduce((a,s)=>a+s.q*s.p*FX,0)
};
tot.all = tot.bancos+tot.dep+tot.cripto+tot.bolsa;
const lucroDep = d => d.v*d.t/100*d.m/12;
const rent = c => 1000000*c.t/100*c.m/12;      // rentabilidade sobre 1 000 000 Kz
const melhor = D.comparar.reduce((a,b)=>rent(b)>rent(a)?b:a);

/* ===== 4. Componentes reutilizáveis ===== */
const Stat = (icon,label,val,sub='') => `<div class="glass lift stat p-3 h-100"><div class="d-flex align-items-center gap-3">
  <div class="icon-dot"><i class="bi ${icon}"></i></div><div><div class="text-muted small">${label}</div><div class="v">${val}</div>${sub}</div></div></div>`;
const Table = (heads,rows) => `<div class="table-responsive"><table class="table tbl"><thead><tr>${heads.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
const Card = (inner,extra='') => `<div class="glass lift p-4 h-100 ${extra}">${inner}</div>`;
const Bar = p => `<div class="progress"><div class="progress-bar" style="width:${p}%"></div></div>`;
const Alert = (icon,txt,badge,k='b-green') => `<div class="glass lift alert-card"><div class="icon-dot"><i class="bi ${icon}"></i></div><div class="flex-grow-1">${txt}</div><span class="badge-pill ${k}">${badge}</span></div>`;

/* Gráfico de rosca (conic-gradient) */
function Donut(parts){
  let acc=0; const stops=parts.map(p=>{const s=acc;acc+=p.v/tot.all*100;return `${p.c} ${s}% ${acc}%`}).join(',');
  return `<div class="donut" style="background:conic-gradient(${stops})"><div><span><b>${kz(tot.all)}</b></span></div></div>
  <div class="mt-4">${parts.map(p=>`<div class="d-flex justify-content-between small py-1"><span><i class="dot" style="background:${p.c}"></i>${p.l}</span><b>${(p.v/tot.all*100).toFixed(0)}%</b></div>`).join('')}</div>`;
}
/* Gráfico de linha (SVG) */
function Line(pts){
  const max=Math.max(...pts),min=Math.min(...pts),w=600,h=170;
  const xy=pts.map((v,i)=>[i*w/(pts.length-1),h-10-(v-min)/(max-min)*(h-30)]);
  const path=xy.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  return `<svg viewBox="0 0 ${w} ${h}" class="w-100" role="img" aria-label="Evolução do património"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34C759" stop-opacity=".28"/><stop offset="1" stop-color="#34C759" stop-opacity="0"/></linearGradient></defs>
  <path d="${path} L${w} ${h} L0 ${h}Z" fill="url(#g)"/><path d="${path}" fill="none" stroke="#34C759" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

/* ===== 5. Vistas ===== */
const Views = {
  dashboard(){
    const parts=[{l:'Bancos',v:tot.bancos,c:'#34C759'},{l:'Depósitos',v:tot.dep,c:'#C9BBA0'},{l:'Cripto',v:tot.cripto,c:'#E6DCC8'},{l:'Bolsa',v:tot.bolsa,c:'#D6D6DB'}];
    const evo=[0.82,0.85,0.84,0.89,0.93,0.92,0.97,1].map(x=>x*tot.all);
    return `<div class="row g-3">
      <div class="col-12">${Card(`<div class="hero"><div class="text-muted">Património total</div><div class="v">${kz(tot.all)}</div><span class="badge-pill b-green"><i class="bi bi-graph-up-arrow"></i> +12,0% este ano</span></div><div class="mt-3">${Line(evo)}</div>`)}</div>
      <div class="col-6 col-xl-3">${Stat('bi-bank','Bancos',kz(tot.bancos))}</div>
      <div class="col-6 col-xl-3">${Stat('bi-piggy-bank','Depósitos',kz(tot.dep))}</div>
      <div class="col-6 col-xl-3">${Stat('bi-currency-bitcoin','Criptomoedas',kz(tot.cripto))}</div>
      <div class="col-6 col-xl-3">${Stat('bi-bar-chart-line','Bolsa de valores',kz(tot.bolsa))}</div>
      <div class="col-lg-5">${Card('<h2 class="h6 mb-3">Distribuição</h2>'+Donut(parts))}</div>
      <div class="col-lg-7">${Card('<h2 class="h6 mb-3">Alertas recentes</h2><div class="d-grid gap-2">'+alertas().slice(0,3).join('')+'</div>')}</div></div>`;
  },
  bancos(){
    return `<div class="row g-3">${D.bancos.map(b=>{const p=Math.min(100,b.inv/(b.saldo+b.inv)*100);return `<div class="col-md-6">${Card(`
      <div class="d-flex align-items-center gap-3 mb-3"><div class="icon-dot"><i class="bi bi-bank2"></i></div><h2 class="h5 m-0 me-auto">${b.n}</h2><span class="badge-pill b-beige">${b.taxa}% a.a.</span></div>
      <div class="text-muted small">Saldo</div><div class="h3 fw-bold">${kz(b.saldo)}</div>
      <div class="row small mt-3 g-2"><div class="col-6"><span class="text-muted">Investido</span><br><b>${kz(b.inv)}</b></div><div class="col-6"><span class="text-muted">Juros acumulados</span><br><b class="pos">+${kz(b.juros)}</b></div></div>
      <div class="mt-3 mb-2">${Bar(p)}</div><div class="small text-muted">Próximo vencimento: <b class="text-body">${dt(b.venc)}</b> · ${days(b.venc)} dias</div>`)}</div>`}).join('')}</div>`;
  },
  depositos(){
    const rows=D.depositos.map(d=>{const f=addM(d.ini,d.m);return `<tr><td><b>${d.b}</b></td><td>${kz(d.v)}</td><td>${d.t}%</td><td>${d.m} meses</td><td>${dt(d.ini)}</td><td>${dt(f)}</td><td class="pos">+${kz(lucroDep(d))}</td></tr>`}).join('');
    return Card(Table(['Banco','Valor investido','Taxa','Prazo','Início','Vencimento','Lucro esperado'],rows));
  },
  comparador(){
    const rows=D.comparar.map(c=>{const b=c===melhor;return `<tr class="${b?'best':''}"><td><b>${c.b}</b> ${b?'<span class="badge-pill b-green ms-2"><i class="bi bi-trophy"></i> Melhor</span>':''}</td><td>${c.t}%</td><td>${c.m} meses</td><td class="${b?'pos':''}">${kz(rent(c))} <span class="text-muted small">por 1 000 000 Kz</span></td></tr>`}).join('');
    return Card(`<p class="text-muted">Rentabilidade calculada para um capital de 1 000 000 Kz durante o prazo de cada oferta.</p>`+Table(['Banco','Taxa','Prazo','Rentabilidade'],rows));
  },
  cripto(){
    return `<div class="row g-3">${D.cripto.map(c=>{const val=c.q*c.p,l=(c.p-c.c)*c.q;return `<div class="col-md-6 col-xl-4">${Card(`
      <div class="d-flex align-items-center gap-3 mb-3"><div class="icon-dot"><i class="bi ${c.i}"></i></div><div class="me-auto"><b>${c.n}</b><div class="small text-muted">${c.s}</div></div><span class="badge-pill ${c.v>=0?'b-green':'b-red'}">${sign(c.v)}</span></div>
      <div class="h3 fw-bold">${usd(val)}</div><div class="text-muted small mb-3">≈ ${kz(val*FX)}</div>
      <div class="d-flex justify-content-between small"><span class="text-muted">Quantidade</span><b>${c.q}</b></div>
      <div class="d-flex justify-content-between small"><span class="text-muted">Lucro / prejuízo</span><b class="${cls(l)}">${l>=0?'+':''}${usd(l)}</b></div>`)}</div>`}).join('')}</div>`;
  },
  bolsa(){
    return `<div class="row g-3">${D.bolsa.map(s=>{const l=(s.p-s.c)*s.q,pc=(s.p/s.c-1)*100;return `<div class="col-md-6 col-xl-4">${Card(`
      <div class="d-flex align-items-center gap-3 mb-3"><div class="icon-dot fw-bold small">${s.s[0]}</div><div class="me-auto"><b>${s.n}</b><div class="small text-muted">${s.s}</div></div><span class="badge-pill ${pc>=0?'b-green':'b-red'}">${sign(pc)}</span></div>
      <div class="h3 fw-bold ${cls(l)}">${l>=0?'+':''}${usd(l)}</div>
      <div class="row small mt-3 g-2"><div class="col-4"><span class="text-muted">Qtd.</span><br><b>${s.q}</b></div><div class="col-4"><span class="text-muted">Compra</span><br><b>${usd(s.c)}</b></div><div class="col-4"><span class="text-muted">Atual</span><br><b>${usd(s.p)}</b></div></div>`)}</div>`}).join('')}</div>`;
  },
  historico(){
    return Card(`<div class="timeline">${D.hist.map(h=>`<div class="tl-item"><div class="icon-dot"><i class="bi ${h.i}"></i></div>
      <div class="glass p-3 d-flex flex-wrap gap-2 align-items-center" style="border-radius:22px"><div class="me-auto"><b>${h.t}</b><div class="small text-muted">${h.x} · ${dt(h.d)}</div></div><b class="${cls(h.v)}">${h.v>=0?'+':''}${kz(h.v)}</b></div></div>`).join('')}</div>`);
  },
  alertas(){return `<div class="d-grid gap-3">${alertas().join('')}</div>`;}
};
/* Alertas gerados a partir dos dados */
function alertas(){
  const prox=D.bancos.map(b=>({n:b.n,d:days(b.venc)})).sort((a,b)=>a.d-b.d)[0];
  const btc=D.cripto[0];
  return [
    Alert('bi-calendar-event',`Depósito no ${prox.n} vence em ${prox.d} dias.`,'Vencimento','b-beige'),
    Alert('bi-stars',`Existe um banco com rendimento superior: ${melhor.b} (${melhor.t}% a ${melhor.m} meses).`,'Oportunidade'),
    Alert('bi-graph-up-arrow','A sua carteira valorizou 12%.','+12%'),
    Alert('bi-graph-down',`Bitcoin caiu ${Math.abs(btc.v)}%.`,sign(btc.v),'b-red')];
}

/* ===== 6. Navegação (hash) e pesquisa ===== */
const Menu=[['dashboard','bi-grid-1x2','Dashboard'],['bancos','bi-bank','Bancos'],['depositos','bi-piggy-bank','Depósitos'],['comparador','bi-bar-chart-steps','Comparador'],
  ['cripto','bi-currency-bitcoin','Cripto'],['bolsa','bi-graph-up','Bolsa'],['historico','bi-clock-history','Histórico'],['alertas','bi-bell','Alertas']];
document.getElementById('nav').innerHTML='<div class="brand"><i class="bi bi-pie-chart-fill"></i> Património</div>'+
  Menu.map(m=>`<a class="nav-link-x" href="#${m[0]}" data-id="${m[0]}" aria-label="${m[2]}"><i class="bi ${m[1]}"></i><span>${m[2]}</span></a>`).join('');

function go(){
  const id=(location.hash||'#dashboard').slice(1); const m=Menu.find(x=>x[0]===id)||Menu[0];
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  const el=document.getElementById(m[0]); el.innerHTML=Views[m[0]](); el.classList.add('active');
  document.querySelectorAll('.nav-link-x').forEach(a=>a.classList.toggle('active',a.dataset.id===m[0]));
  document.getElementById('title').textContent=m[2]; document.getElementById('q').value='';
}
window.addEventListener('hashchange',go); go();

/* Pesquisa: filtra cartões e linhas da vista ativa */
document.getElementById('q').addEventListener('input',e=>{
  const t=e.target.value.toLowerCase();
  document.querySelectorAll('.view.active [class*="col-"] > .glass, .view.active tbody tr').forEach(n=>{
    const box=n.closest('[class*="col-"]')&&n.parentElement.className.includes('col-')?n.parentElement:n;
    box.style.display=n.textContent.toLowerCase().includes(t)?'':'none';});
});
document.getElementById('addBtn').onclick=()=>alert('Em breve: formulário para registar uma nova operação.');
