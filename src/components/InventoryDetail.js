import React, { useState, useEffect } from 'react';
import api from '../services/api';

const InventoryDetail = ({ products: allProducts }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(new Date().toLocaleString('fr-FR', { month: 'long' }));
  const [year, setYear] = useState(new Date().getFullYear());
  const [saving, setSaving] = useState(false);

  const getUserId = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user._id) return user._id;
        if (user.id) return user.id;
        if (user.userId) return user.userId;
      } catch (e) {}
    }
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        return payload.userId || payload.id || payload._id || '';
      } catch (e) {}
    }
    return '';
  };

  const loadInventory = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/inventory-items/current?month=${encodeURIComponent(month)}&year=${year}`);
      setItems(res.data);
    } catch (err) {
      console.error(err);
      alert('Erreur chargement inventaire');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [month, year]);

  const handleStockReelChange = (productId, value) => {
    const newValue = value === '' ? null : parseInt(value);
    setItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const stockReel = newValue;
        const ecart = stockReel !== null ? stockReel - item.stockTheorique : null;
        const valeurTotale = stockReel !== null ? stockReel * item.prixUnitaire : null;
        return { ...item, stockReel, ecart, valeurTotale };
      }
      return item;
    }));
  };

  const handleObservationsChange = (productId, value) => {
    setItems(prev => prev.map(item => 
      item.productId === productId ? { ...item, observations: value } : item
    ));
  };

  const saveInventory = async () => {
    setSaving(true);
    try {
      const itemsToSave = items.map(item => ({
        productId: item.productId,
        stockReel: item.stockReel,
        observations: item.observations
      }));
      await api.post('/inventory-items/save', { month, year, items: itemsToSave });
      alert('Inventaire enregistré avec succès');
    } catch (err) {
      alert('Erreur : ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: 'white', color: '#333', padding: 20, borderRadius: 12 }}>
      <h2>📦 Inventaire détaillé (par lot)</h2>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        <select value={month} onChange={e => setMonth(e.target.value)} style={inputStyle}>
          {["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"].map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} style={inputStyle} />
        <button onClick={loadInventory} style={buttonStyle}>🔄 Actualiser</button>
        <button onClick={saveInventory} disabled={saving} style={{ ...buttonStyle, background: '#4CAF50' }}>
          {saving ? 'Enregistrement...' : '💾 Enregistrer l\'inventaire du mois'}
        </button>
      </div>
      {loading && <p>Chargement...</p>}
      <div style={{ maxHeight: 500, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th>Code produit</th><th>Nom Item</th><th>N° lot</th><th>Péremption</th>
              <th>Stock initial</th><th>Entrées</th><th>Sorties</th><th>Stock théorique</th>
              <th>Stock réel</th><th>Écart</th><th>Prix unitaire</th><th>Valeur totale</th>
              <th>Mois</th><th>Année</th><th>Observations</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.productId} style={{ borderBottom: '1px solid #ddd' }}>
                <td>{item.codeProduit}</td>
                <td>{item.nomItem}</td>
                <td>{item.numeroLot}</td>
                <td>{item.datePeremption ? new Date(item.datePeremption).toLocaleDateString() : ''}</td>
                <td>{item.stockInitial}</td>
                <td>{item.entrees}</td>
                <td>{item.sorties}</td>
                <td>{item.stockTheorique}</td>
                <td>
                  <input
                    type="number"
                    value={item.stockReel === null ? '' : item.stockReel}
                    onChange={e => handleStockReelChange(item.productId, e.target.value)}
                    style={{ width: '80px' }}
                  />
                </td>
                <td>{item.ecart !== null ? item.ecart : ''}</td>
                <td>{item.prixUnitaire}</td>
                <td>{item.valeurTotale !== null ? item.valeurTotale.toFixed(2) : ''}</td>
                <td>{item.month}</td>
                <td>{item.year}</td>
                <td>
                  <input
                    type="text"
                    value={item.observations}
                    onChange={e => handleObservationsChange(item.productId, e.target.value)}
                    style={{ width: '100px' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const inputStyle = { padding: '8px', margin: '4px', borderRadius: 4, border: '1px solid #ccc' };
const buttonStyle = { padding: '8px 16px', background: '#2196F3', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 10 };

export default InventoryDetail;