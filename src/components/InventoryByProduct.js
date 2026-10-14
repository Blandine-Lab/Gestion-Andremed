import React, { useState, useEffect } from 'react';
import api from '../services/api';

const months = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

const InventoryByProduct = ({ products, users, onSave }) => {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [inventoryData, setInventoryData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const initial = {};
    products.forEach(p => {
      initial[p._id] = { qtyReal: 0, qtyExpired: 0, losses: 0 };
    });
    setInventoryData(initial);
  }, [products]);

  const handleChange = (productId, field, value) => {
    setInventoryData(prev => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: parseInt(value) || 0 }
    }));
  };

  const saveInventory = async () => {
    if (!selectedMonth) {
      alert('Veuillez choisir un mois');
      return;
    }
    setSaving(true);
    try {
      const items = Object.entries(inventoryData).map(([productId, data]) => ({
        productId,
        qtyReal: data.qtyReal,
        qtyExpired: data.qtyExpired,
        losses: data.losses
      }));
      await api.post('/inventories/monthly', {
        month: selectedMonth,
        year: selectedYear,
        items
      });
      alert('Inventaire enregistré avec succès');
      if (onSave) onSave();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: 'white', color: '#333', padding: 20, borderRadius: 12 }}>
      <h3>Inventaire mensuel par produit</h3>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={inputStyle}>
          <option value="">Mois</option>
          {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <input type="number" value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={inputStyle} />
      </div>
      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th style={thStyle}>Produit</th>
              <th style={thStyle}>Stock réel</th>
              <th style={thStyle}>Expirés</th>
              <th style={thStyle}>Pertes</th>
             </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product._id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={tdStyle}>{product.name}</td>
                <td style={tdStyle}>
                  <input type="number" value={inventoryData[product._id]?.qtyReal || 0}
                         onChange={e => handleChange(product._id, 'qtyReal', e.target.value)}
                         style={{ width: 80 }} />
                </td>
                <td style={tdStyle}>
                  <input type="number" value={inventoryData[product._id]?.qtyExpired || 0}
                         onChange={e => handleChange(product._id, 'qtyExpired', e.target.value)}
                         style={{ width: 80 }} />
                </td>
                <td style={tdStyle}>
                  <input type="number" value={inventoryData[product._id]?.losses || 0}
                         onChange={e => handleChange(product._id, 'losses', e.target.value)}
                         style={{ width: 80 }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={saveInventory} disabled={saving} style={addBtn}>
        {saving ? 'Enregistrement...' : 'Enregistrer l\'inventaire'}
      </button>
    </div>
  );
};

// Styles (à adapter si vous voulez les reprendre d'App.js)
const inputStyle = { padding: '8px', margin: '4px', borderRadius: 4, border: '1px solid #ccc' };
const thStyle = { padding: '8px', textAlign: 'left' };
const tdStyle = { padding: '8px' };
const addBtn = { padding: '10px 20px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', marginTop: 15 };

export default InventoryByProduct;