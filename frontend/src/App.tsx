import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Bell, 
  RefreshCw, 
  Trash2, 
  LineChart as ChartIcon, 
  Check, 
  AlertTriangle, 
  ExternalLink, 
  X, 
  Sliders, 
  Play, 
  Database,
  Activity
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Line, 
  CartesianGrid 
} from 'recharts';
import './App.css';

const API_BASE = 'http://localhost:3001/api';

interface Product {
  id: number;
  name: string;
  url: string;
  custom_selector: string | null;
  alert_pct: number | null;
  alert_abs: number | null;
  current_price_eur: number | null;
  previous_price_eur: number | null;
  active_alert_status: string | null;
  last_scraped_at: string | null;
  created_at: string;
}

interface AlertItem {
  id: number;
  product_id: number;
  price_triggered_eur: number;
  status: 'active' | 'inactive';
  triggered_at: string;
  product_name: string;
  product_url: string;
}

interface PriceHistory {
  price_eur: number;
  original_price: number;
  original_currency: string;
  scraped_at: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'alerts'>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  
  // Form State
  const [urlInput, setUrlInput] = useState('');
  const [selectorInput, setSelectorInput] = useState('');
  const [alertPctInput, setAlertPctInput] = useState('10');
  const [alertAbsInput, setAlertAbsInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isScrapingAll, setIsScrapingAll] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [modalPct, setModalPct] = useState('');
  const [modalAbs, setModalAbs] = useState('');
  const [isSavingAlert, setIsSavingAlert] = useState(false);
  const [isForceScraping, setIsForceScraping] = useState(false);

  // Fetch Data
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      console.error('Failed to fetch products', e);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${API_BASE}/alerts`);
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (e) {
      console.error('Failed to fetch alerts', e);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchAlerts();
  }, []);

  // Handlers
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return;

    setIsAdding(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlInput,
          custom_selector: selectorInput || undefined,
          alert_pct: alertPctInput ? parseFloat(alertPctInput) / 100 : undefined,
          alert_abs: alertAbsInput ? parseFloat(alertAbsInput) : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add product');
      }

      setSuccessMsg(`Successfully registered and extracted price for: ${data.name}`);
      setUrlInput('');
      setSelectorInput('');
      setAlertPctInput('10');
      setAlertAbsInput('');
      fetchProducts();
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to stop tracking this product?')) return;

    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setProducts(products.filter(p => p.id !== id));
        fetchAlerts(); // Refresh alerts in case resolved/cascade
      }
    } catch (e) {
      console.error('Failed to delete product', e);
    }
  };

  const handleScrapeAll = async () => {
    setIsScrapingAll(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_BASE}/products/scrape`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Scraper complete! Succeeded: ${data.succeeded}, Failed: ${data.failed}`);
        fetchProducts();
        fetchAlerts();
      } else {
        throw new Error(data.error || 'Failed to scrape');
      }
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setIsScrapingAll(false);
    }
  };

  const handleOpenDetails = async (product: Product) => {
    setSelectedProduct(product);
    setModalPct(product.alert_pct ? (product.alert_pct * 100).toFixed(0) : '');
    setModalAbs(product.alert_abs ? product.alert_abs.toString() : '');
    setPriceHistory([]);

    try {
      const res = await fetch(`${API_BASE}/products/${product.id}/history`);
      if (res.ok) {
        const data = await res.json();
        setPriceHistory(data);
      }
    } catch (e) {
      console.error('Failed to fetch price history', e);
    }
  };

  const handleSaveAlertSettings = async () => {
    if (!selectedProduct) return;

    setIsSavingAlert(true);
    try {
      const res = await fetch(`${API_BASE}/products/${selectedProduct.id}/alert`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert_pct: modalPct ? parseFloat(modalPct) / 100 : null,
          alert_abs: modalAbs ? parseFloat(modalAbs) : null
        })
      });

      if (res.ok) {
        // Update product in list
        const updated = {
          ...selectedProduct,
          alert_pct: modalPct ? parseFloat(modalPct) / 100 : null,
          alert_abs: modalAbs ? parseFloat(modalAbs) : null
        };
        setSelectedProduct(updated);
        setProducts(products.map(p => p.id === selectedProduct.id ? updated : p));
        alert('Alert thresholds updated successfully!');
      }
    } catch (e) {
      console.error('Failed to update alert settings', e);
    } finally {
      setIsSavingAlert(false);
    }
  };

  const handleForceScrape = async () => {
    if (!selectedProduct) return;

    setIsForceScraping(true);
    try {
      const res = await fetch(`${API_BASE}/products/${selectedProduct.id}/scrape`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        // Reload details and history
        const updatedRes = await fetch(`${API_BASE}/products`);
        if (updatedRes.ok) {
          const productsList = await updatedRes.json();
          setProducts(productsList);
          const currentProd = productsList.find((p: Product) => p.id === selectedProduct.id);
          if (currentProd) setSelectedProduct(currentProd);
        }
        
        const histRes = await fetch(`${API_BASE}/products/${selectedProduct.id}/history`);
        if (histRes.ok) {
          setPriceHistory(await histRes.json());
        }
        
        fetchAlerts();
        alert('Manual scrape triggered. Price updated successfully!');
      } else {
        alert(`Scrape failed: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Scrape failed: ${e.message}`);
    } finally {
      setIsForceScraping(false);
    }
  };

  const handleToggleAlertStatus = async (alertId: number) => {
    try {
      const res = await fetch(`${API_BASE}/alerts/${alertId}/toggle`, {
        method: 'POST'
      });
      if (res.ok) {
        fetchAlerts();
        fetchProducts(); // Refresh status indicators
      }
    } catch (e) {
      console.error('Failed to toggle alert status', e);
    }
  };

  // Helper calculations
  const calculateChange = (current: number | null, previous: number | null) => {
    if (current === null || previous === null) return null;
    const diff = current - previous;
    const pct = (diff / previous) * 100;
    return {
      amount: diff,
      percent: pct,
      direction: diff < 0 ? 'down' : diff > 0 ? 'up' : 'flat'
    };
  };

  return (
    <div className="app-container">
      {/* Header section */}
      <header className="header-section">
        <div>
          <h1 style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Activity style={{ color: 'var(--accent-blue)', width: '36px', height: '36px' }} />
            <span className="gradient-text">ANTIGRAVITY</span>
            <span style={{ fontWeight: 300 }}>PRICE WATCHER</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '6px', fontSize: '0.95rem' }}>
            Smart product price crawler with automatic WhatsApp discount alerting
          </p>
        </div>

        <nav className="sidebar-nav glass-panel" style={{ padding: '6px', borderRadius: '14px' }}>
          <div 
            className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <Database size={16} />
            Dashboard
          </div>
          <div 
            className={`nav-link ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('alerts');
              fetchAlerts();
            }}
          >
            <Bell size={16} />
            Alerts History
            {alerts.filter(a => a.status === 'active').length > 0 && (
              <span style={{ 
                background: 'var(--accent-alert)', 
                color: 'white', 
                fontSize: '0.75rem', 
                padding: '2px 6px', 
                borderRadius: '50px',
                fontWeight: 800
              }}>
                {alerts.filter(a => a.status === 'active').length}
              </span>
            )}
          </div>
        </nav>
      </header>

      {/* Global Message Alerts */}
      {successMsg && (
        <div className="glass-panel" style={{ 
          padding: '16px 20px', 
          borderColor: 'var(--accent-success)', 
          background: 'rgba(0, 255, 135, 0.05)', 
          color: 'var(--text-primary)',
          borderRadius: '12px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Check style={{ color: 'var(--accent-success)' }} size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="glass-panel" style={{ 
          padding: '16px 20px', 
          borderColor: 'var(--accent-alert)', 
          background: 'rgba(255, 78, 80, 0.05)', 
          color: 'var(--text-primary)',
          borderRadius: '12px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AlertTriangle style={{ color: 'var(--accent-alert)' }} size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB CONTENT: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div>
          {/* Main Controls Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
            {/* Add Product Form */}
            <form onSubmit={handleAddProduct} className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={20} style={{ color: 'var(--accent-blue)' }} />
                Track a New Product URL
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Product Page URL *</label>
                  <input 
                    type="url" 
                    required 
                    placeholder="https://example.com/item..." 
                    className="form-input" 
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                  />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Custom CSS Selector (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="#price, .price-value..." 
                    className="form-input" 
                    value={selectorInput}
                    onChange={(e) => setSelectorInput(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', alignItems: 'end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Discount Alert Threshold (%)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="100" 
                    placeholder="10" 
                    className="form-input" 
                    value={alertPctInput}
                    onChange={(e) => setAlertPctInput(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Discount Alert Threshold (€)</label>
                  <input 
                    type="number" 
                    min="0" 
                    placeholder="E.g., 25" 
                    className="form-input" 
                    value={alertAbsInput}
                    onChange={(e) => setAlertAbsInput(e.target.value)}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  disabled={isAdding}
                >
                  {isAdding ? <RefreshCw className="animate-spin" size={18} /> : <Plus size={18} />}
                  {isAdding ? 'Analyzing Site...' : 'Add to Watchlist'}
                </button>
              </div>
            </form>

            {/* Quick Actions Panel */}
            <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '8px' }}>Global Crawler</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  The scraper automatically crawls and extracts prices 4 times a day. You can trigger a manual global scrape right now.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  onClick={handleScrapeAll} 
                  className="btn-secondary" 
                  style={{ 
                    width: '100%', 
                    height: '48px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '8px' 
                  }}
                  disabled={isScrapingAll}
                >
                  <RefreshCw className={isScrapingAll ? 'animate-spin' : ''} size={18} />
                  {isScrapingAll ? 'Scraping All Sites...' : 'Force Global Scrape'}
                </button>
              </div>
            </div>
          </div>

          {/* Tracked Products Grid */}
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: 'var(--text-primary)' }}>Currently Monitored Products</h2>
          
          {products.length === 0 ? (
            <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Sliders size={40} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p style={{ fontSize: '1.1rem' }}>No products registered yet.</p>
              <p style={{ fontSize: '0.9rem', marginTop: '6px' }}>Provide a product URL above to start price monitoring.</p>
            </div>
          ) : (
            <div className="dashboard-grid">
              {products.map(p => {
                const change = calculateChange(p.current_price_eur, p.previous_price_eur);
                return (
                  <div key={p.id} className="glass-panel product-card">
                    {/* Active Alert glow banner */}
                    {p.active_alert_status === 'active' && (
                      <div style={{ 
                        background: 'rgba(255, 78, 80, 0.1)', 
                        border: '1px solid rgba(255, 78, 80, 0.3)', 
                        padding: '4px 12px', 
                        borderRadius: '20px', 
                        fontSize: '0.75rem', 
                        color: 'var(--accent-alert)',
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        alignSelf: 'flex-start',
                        marginBottom: '12px'
                      }}>
                        <span className="glow-indicator active" />
                        Active Drop Alert Triggered
                      </div>
                    )}

                    <h3 className="product-title" title={p.name}>{p.name}</h3>
                    
                    <a 
                      href={p.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ 
                        color: 'var(--text-secondary)', 
                        fontSize: '0.8rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        textDecoration: 'none',
                        marginBottom: '20px',
                        wordBreak: 'break-all'
                      }}
                      className="hover:underline"
                    >
                      Visit Product Website
                      <ExternalLink size={12} />
                    </a>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Alert Target (%)</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                          {p.alert_pct ? `-${(p.alert_pct * 100).toFixed(0)}%` : 'None'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Alert Target (€)</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                          {p.alert_abs ? `-€${p.alert_abs.toFixed(2)}` : 'None'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Last Scraped</span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {p.last_scraped_at ? new Date(p.last_scraped_at).toLocaleTimeString() : 'Never'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                      <div className="product-price-section">
                        <span className="price-display">
                          {p.current_price_eur !== null ? `€${p.current_price_eur.toFixed(2)}` : 'N/A'}
                        </span>
                        
                        {/* Price change delta */}
                        {change && change.percent !== 0 && (
                          <span className={`price-delta ${change.direction === 'down' ? 'down' : 'up'}`}>
                            {change.direction === 'down' ? '-' : '+'}
                            {Math.abs(change.percent).toFixed(1)}%
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => handleOpenDetails(p)} 
                          className="btn-secondary" 
                          style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="View price details & charts"
                        >
                          <ChartIcon size={16} />
                        </button>
                        
                        <button 
                          onClick={() => handleDeleteProduct(p.id)} 
                          className="btn-secondary" 
                          style={{ padding: '8px 12px', borderColor: 'rgba(255, 78, 80, 0.2)' }}
                          title="Delete product"
                        >
                          <Trash2 size={16} style={{ color: 'var(--accent-alert)' }} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: ALERTS HISTORY */}
      {activeTab === 'alerts' && (
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', color: 'var(--text-primary)' }}>WhatsApp Price Drop Alerts Log</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
            Review past and active alerts sent to WhatsApp. You can toggle an alert active/inactive to reset the trigger state.
          </p>

          {alerts.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Bell size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p>No alerts triggered yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-muted)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    <th style={{ padding: '12px 16px' }}>Product</th>
                    <th style={{ padding: '12px 16px' }}>Trigger Price</th>
                    <th style={{ padding: '12px 16px' }}>Trigger Date</th>
                    <th style={{ padding: '12px 16px' }}>Alert Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert) => (
                    <tr key={alert.id} style={{ borderBottom: '1px solid var(--border-muted)' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{alert.product_name}</div>
                        <a 
                          href={alert.product_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}
                        >
                          View Site
                          <ExternalLink size={10} />
                        </a>
                      </td>
                      <td style={{ padding: '16px', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--accent-blue)', fontSize: '1.05rem' }}>
                        €{alert.price_triggered_eur.toFixed(2)}
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                        {new Date(alert.triggered_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '16px' }}>
                        {alert.status === 'active' ? (
                          <span style={{ 
                            background: 'rgba(255, 78, 80, 0.1)', 
                            color: 'var(--accent-alert)', 
                            border: '1px solid rgba(255, 78, 80, 0.3)',
                            padding: '4px 10px', 
                            borderRadius: '50px', 
                            fontSize: '0.75rem', 
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <span className="glow-indicator active" style={{ width: '6px', height: '6px' }} />
                            ACTIVE
                          </span>
                        ) : (
                          <span style={{ 
                            background: 'rgba(0, 255, 135, 0.1)', 
                            color: 'var(--accent-success)', 
                            border: '1px solid rgba(0, 255, 135, 0.3)',
                            padding: '4px 10px', 
                            borderRadius: '50px', 
                            fontSize: '0.75rem', 
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <span className="glow-indicator resolved" style={{ width: '6px', height: '6px' }} />
                            RESOLVED
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <button 
                          onClick={() => handleToggleAlertStatus(alert.id)}
                          className="btn-secondary"
                          style={{ 
                            padding: '6px 12px', 
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            borderColor: alert.status === 'active' ? 'var(--border-glow)' : 'var(--border-muted)'
                          }}
                        >
                          {alert.status === 'active' ? 'Mark Resolved' : 'Re-Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* DETAIL CHART MODAL */}
      {selectedProduct && (
        <div className="modal-backdrop" onClick={() => setSelectedProduct(null)}>
          <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedProduct(null)}>
              <X size={24} />
            </button>

            <h2 style={{ fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
              {selectedProduct.name}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Tracked URL: <a href={selectedProduct.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)' }}>{selectedProduct.url}</a>
            </p>

            {/* Price Chart */}
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ChartIcon size={18} style={{ color: 'var(--accent-blue)' }} />
              Price History (EUR)
            </h3>
            
            <div className="chart-container">
              {priceHistory.length === 0 ? (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  Loading chart historical data...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceHistory.map(h => ({
                    date: new Date(h.scraped_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric', hour: '2-digit'}),
                    price: parseFloat(h.price_eur.toFixed(2))
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" />
                    <XAxis dataKey="date" stroke="var(--text-secondary)" style={{ fontSize: '0.75rem' }} />
                    <YAxis 
                      stroke="var(--text-secondary)" 
                      style={{ fontSize: '0.75rem' }} 
                      domain={['auto', 'auto']}
                      tickFormatter={(v) => `€${v}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'var(--bg-secondary)', 
                        borderColor: 'var(--border-glow)',
                        color: 'var(--text-primary)',
                        borderRadius: '8px'
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="url(#colorPrice)" 
                      strokeWidth={3} 
                      dot={{ fill: 'var(--accent-blue)', strokeWidth: 2 }}
                    />
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="var(--accent-blue)" />
                        <stop offset="100%" stopColor="var(--accent-purple)" />
                      </linearGradient>
                    </defs>
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Alert settings config */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', borderTop: '1px solid var(--border-muted)', paddingTop: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sliders size={18} style={{ color: 'var(--accent-blue)' }} />
                  Configure Alerts Thresholds
                </h3>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Percentage Drop %</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={modalPct}
                      onChange={(e) => setModalPct(e.target.value)}
                      placeholder="E.g., 15"
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Absolute Drop €</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={modalAbs}
                      onChange={(e) => setModalAbs(e.target.value)}
                      placeholder="E.g., 30"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleSaveAlertSettings} 
                  className="btn-primary" 
                  style={{ height: '40px' }}
                  disabled={isSavingAlert}
                >
                  {isSavingAlert ? 'Saving...' : 'Update Settings'}
                </button>
              </div>

              {/* Debug Tools details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Play size={16} style={{ color: 'var(--accent-purple)' }} />
                  Diagnostics
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Force a single-product scrape check. This will pull down fresh website HTML, extract the price, convert to EUR, and evaluate configured alerts.
                </p>

                <button 
                  onClick={handleForceScrape} 
                  className="btn-secondary" 
                  style={{ height: '40px', marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  disabled={isForceScraping}
                >
                  <RefreshCw className={isForceScraping ? 'animate-spin' : ''} size={14} />
                  {isForceScraping ? 'Crawling Page...' : 'Force Scrape Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
