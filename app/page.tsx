'use client';

import { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const resources = [
  { theme: 'GPU / AI 基础', title: 'NVIDIA Deep Learning Institute — Free Courses', type: 'Course', level: 'Beginner', url: 'https://resources.nvidia.com/en-us-nvidia-training/free-courses', why: '快速理解 GPU、CUDA、深度学习和加速计算基础。' },
  { theme: 'ASIC / TPU', title: 'Google Cloud — Introduction to Cloud TPU', type: 'Docs', level: 'Beginner', url: 'https://cloud.google.com/tpu/docs/intro-to-tpu', why: '理解 ASIC/TPU 为什么适合机器学习，以及大厂为何自研加速器。' },
  { theme: 'HBM / 内存瓶颈', title: 'Micron — High Bandwidth Memory', type: 'Docs', level: 'Beginner', url: 'https://www.micron.com/products/memory/hbm', why: '理解 HBM 与 AI training / inference 的关系，以及带宽和功耗优势。' },
  { theme: 'AI 网络', title: 'NVIDIA Spectrum-X Networking Platform', type: 'Docs', level: 'Intermediate', url: 'https://www.nvidia.com/en-us/networking/spectrumx/', why: '理解 AI 集群不仅需要 GPU，也需要高性能网络互联。' },
  { theme: '数据中心入门', title: 'Microsoft Learn — Introduction to Datacenter', type: 'Course', level: 'Beginner', url: 'https://learn.microsoft.com/en-us/training/paths/introduction-to-datacenter/', why: '系统了解数据中心硬件、运营、可持续性和基础设施。' },
  { theme: '电力 / AI', title: 'IEA — Energy and AI', type: 'Report', level: 'Beginner', url: 'https://www.iea.org/reports/energy-and-ai', why: '权威理解 AI 与数据中心对电力需求的影响。' },
  { theme: '液冷 / 散热', title: 'Schneider Electric — Liquid Cooling Architectures for AI Workloads', type: 'Whitepaper', level: 'Intermediate', url: 'https://www.se.com/ww/en/download/document/SPD_WP133_EN/', why: '理解 rack density 上升后，液冷为什么成为关键增量。' },
  { theme: 'AI 应用商业化', title: 'Bessemer — The AI Pricing and Monetization Playbook', type: 'Article', level: 'Beginner', url: 'https://www.bvp.com/atlas/the-ai-pricing-and-monetization-playbook', why: '理解 AI 应用的定价、COGS、毛利和商业化方式。' },
  { theme: 'AI 应用榜单', title: 'a16z — Top 100 Gen AI Consumer Apps', type: 'Report', level: 'Beginner', url: 'https://a16z.com/100-gen-ai-apps-6/', why: '观察真实 C 端 AI 应用流量和品类变化。' },
  { theme: 'AI Crypto / Bittensor', title: 'Bittensor Docs', type: 'Docs', level: 'Beginner', url: 'https://docs.learnbittensor.org/', why: '理解 subnet、miner、validator、TAO 激励机制。' },
  { theme: 'AI Crypto / Render', title: 'Render Network Knowledge Base', type: 'Docs', level: 'Beginner', url: 'https://know.rendernetwork.com/', why: '理解分布式 GPU rendering marketplace。' },
  { theme: 'AI Crypto / Akash', title: 'Akash Network', type: 'Docs', level: 'Beginner', url: 'https://akash.network/', why: '理解去中心化 compute marketplace。' }
];

function fmt(n?: number | null, digits = 2) {
  if (n === undefined || n === null || Number.isNaN(n)) return '—';
  if (Math.abs(n) >= 1_000_000_000_000) return `$${(n / 1_000_000_000_000).toFixed(2)}T`;
  if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return n.toFixed(digits);
}

function pct(n?: number | null) {
  if (n === undefined || n === null || Number.isNaN(n)) return '—';
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

export default function Page() {
  const [tab, setTab] = useState('metrics');
  const [metrics, setMetrics] = useState<any[]>([]);
  const [market, setMarket] = useState<any[]>([]);
  const [marketError, setMarketError] = useState<string>('');
  const [q, setQ] = useState('');
  const [stockFilter, setStockFilter] = useState('All');
  const [lastUpdated, setLastUpdated] = useState('');

  const refreshSeconds = Number(process.env.NEXT_PUBLIC_REFRESH_SECONDS || 60);

  async function loadMetrics() {
    const res = await fetch('/api/metrics', { cache: 'no-store' });
    const json = await res.json();
    setMetrics(json.metrics || []);
  }

  async function loadMarket() {
    const res = await fetch('/api/market', { cache: 'no-store' });
    const json = await res.json();
    if (!json.ok) setMarketError(json.error || 'Market API unavailable');
    else setMarketError('');
    setMarket(json.rows || []);
    setLastUpdated(json.asOf || new Date().toISOString());
  }

  useEffect(() => {
    loadMetrics();
    loadMarket();
    const id = setInterval(loadMarket, refreshSeconds * 1000);
    return () => clearInterval(id);
  }, []);

  const chartData = metrics
    .filter(m => m.category === 'Inference cost')
    .map(m => ({ name: m.name.replace(' price', '').replace('OpenAI ', '').replace('Claude ', ''), value: m.currentValue }));

  const filteredStocks = useMemo(() => {
    return market.filter(s => stockFilter === 'All' || s.theme?.includes(stockFilter) || s.priority === stockFilter);
  }, [market, stockFilter]);

  const filteredResources = useMemo(() => {
    const lower = q.toLowerCase();
    return resources.filter(r => !lower || [r.theme, r.title, r.type, r.level, r.why].join(' ').toLowerCase().includes(lower));
  }, [q]);

  const stockGroups = ['All', 'GPU', 'ASIC', 'HBM', 'AI cloud', 'Power', 'App layer', 'High beta', 'Core'];

  return (
    <main className="container">
      <section className="header">
        <div>
          <span className="badge">AI Token Economy Monitor · data-driven version</span>
          <h1>AI Token 投资监控系统</h1>
          <p className="subtitle">这一版不是静态指标罗列：每个指标都有当前值、单位、来源、日期、状态和阈值；核心标的通过后端 API 拉取实时/准实时价格、涨跌幅、市值和 P/E。</p>
        </div>
        <div className="warning">
          <b>部署提醒：</b>股价/估值需要在 <code>.env.local</code> 配置 FMP 或 Finnhub API key。没有 key 时，页面会保留结构但显示 API 未配置。
        </div>
      </section>

      <section className="grid4">
        <div className="card metric"><div className="label">结构化指标</div><div className="value">{metrics.length || '—'}</div><div className="note">含当前值、来源、阈值、更新时间</div></div>
        <div className="card metric"><div className="label">监控标的</div><div className="value">{market.length || '—'}</div><div className="note">API-driven watchlist</div></div>
        <div className="card metric"><div className="label">自动刷新</div><div className="value">{refreshSeconds}s</div><div className="note">仅刷新市场数据</div></div>
        <div className="card metric"><div className="label">最新行情更新时间</div><div className="value" style={{fontSize: 15}}>{lastUpdated ? new Date(lastUpdated).toLocaleString() : '—'}</div><div className="note">来自 /api/market</div></div>
      </section>

      <nav className="tabs">
        {[['metrics', 'A/B 指标现状'], ['stocks', 'C 标的实时监控'], ['learning', '学习资料'], ['deploy', '部署说明']].map(([id, name]) => (
          <button key={id} className={`tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>{name}</button>
        ))}
      </nav>

      {tab === 'metrics' && (
        <section className="card pad">
          <div className="toolbar">
            <div>
              <h2>A/B 指标体系：当前值 + 来源 + 阈值</h2>
              <p className="muted">这些不是实时 tick 数据，而是“版本化来源记录”：API pricing 按月检查，财报/capex 按季度更新，IEA/能源类按年度或半年度更新。</p>
            </div>
          </div>
          <div style={{height: 260, marginBottom: 20}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{fontSize: 11}} />
                <YAxis tick={{fontSize: 11}} />
                <Tooltip />
                <Bar dataKey="value" radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="scroll">
            <table>
              <thead>
                <tr><th>Section</th><th>Category</th><th>Metric</th><th>Current value</th><th>Status</th><th>As of</th><th>Frequency</th><th>Source</th><th>Investment interpretation</th></tr>
              </thead>
              <tbody>
                {metrics.map(m => (
                  <tr key={m.id}>
                    <td>{m.section}</td><td>{m.category}</td><td><b>{m.name}</b></td>
                    <td><b>{m.currentValue}</b> {m.unit}</td><td><span className="status">{m.status}</span></td><td>{m.asOf}</td><td>{m.frequency}</td>
                    <td><a href={m.sourceUrl} target="_blank">{m.sourceName}</a></td><td>{m.interpretation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'stocks' && (
        <section className="card pad">
          <div className="toolbar">
            <div>
              <h2>C. 核心主线标的：实时/准实时 API 监控</h2>
              <p className="muted">字段来自后端 /api/market，避免把 API key 暴露到浏览器。Provider: {market[0]?.provider || '—'}</p>
              {marketError && <p className="red">{marketError}</p>}
            </div>
            <div className="buttons">{stockGroups.map(g => <button key={g} className={`small ${stockFilter === g ? 'active' : ''}`} onClick={() => setStockFilter(g)}>{g}</button>)}</div>
          </div>
          <div className="scroll">
            <table>
              <thead><tr><th>Ticker</th><th>Company</th><th>Theme</th><th>Price</th><th>Change %</th><th>Market Cap</th><th>P/E</th><th>Forward P/E</th><th>EPS</th><th>52W Range</th><th>Priority</th><th>Source</th></tr></thead>
              <tbody>
                {filteredStocks.map(s => (
                  <tr key={s.symbol}>
                    <td><b>{s.symbol}</b></td><td>{s.name}</td><td>{s.theme}</td><td>{fmt(s.price)}</td>
                    <td className={s.changePercent >= 0 ? 'green' : 'red'}>{pct(s.changePercent)}</td><td>{fmt(s.marketCap, 1)}</td>
                    <td>{s.pe ? `${s.pe.toFixed(1)}x` : '—'}</td><td>{s.forwardPE ? `${s.forwardPE.toFixed(1)}x` : '—'}</td><td>{fmt(s.eps)}</td>
                    <td>{fmt(s.fiftyTwoWeekLow)} / {fmt(s.fiftyTwoWeekHigh)}</td><td><span className={`status ${s.priority === 'Core' ? 'core' : s.priority === 'High beta' ? 'beta' : 'app'}`}>{s.priority}</span></td>
                    <td>{s.sourceUrl ? <a href={s.sourceUrl} target="_blank">{s.provider}</a> : s.provider}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'learning' && (
        <section className="card pad">
          <div className="toolbar"><div><h2>学习资料清单</h2><p className="muted">按主题、标题、类型和学习目的检索。</p></div><input value={q} onChange={e => setQ(e.target.value)} placeholder="搜索 GPU / HBM / AI Crypto..." /></div>
          <div className="cards">
            {filteredResources.map(r => <article className="card resource" key={r.title}><div className="tags"><span className="tag">{r.theme}</span><span className="tag">{r.type}</span><span className="tag">{r.level}</span></div><h3><a href={r.url} target="_blank">{r.title}</a></h3><p className="muted">{r.why}</p></article>)}
          </div>
        </section>
      )}

      {tab === 'deploy' && (
        <section className="card pad">
          <h2>本地部署 / 线上网页化</h2>
          <p>1. 申请 FMP 或 Finnhub API key。2. 复制 <code>.env.example</code> 为 <code>.env.local</code>。3. 填入 key。4. 本地运行。</p>
          <pre style={{background:'#0f172a',color:'#e2e8f0',padding:16,borderRadius:14,overflowX:'auto'}}>{`cd ai-token-monitor-next
cp .env.example .env.local
npm install
npm run dev
# open http://localhost:3001`}</pre>
          <p>线上部署可以用 Vercel / Render / Railway / 私有 VPS。生产环境同样需要配置 <code>FMP_API_KEY</code> 或 <code>FINNHUB_API_KEY</code>。</p>
          <p className="footer-note">建议后续扩展：接 PostgreSQL 存历史行情和指标快照；加 Cron 每天收盘后落库；加 30D/90D 趋势；加估值分位数；加提醒规则。</p>
        </section>
      )}
    </main>
  );
}
