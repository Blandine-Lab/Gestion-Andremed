import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Shop from './pages/Shop';
import Services from './pages/Services';
import Support from './pages/Support';
import Realisations from './pages/Realisations';
import Account from './pages/Account';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminPanel from './components/AdminPanel';   // ← UN SEUL IMPORT

// ================= CONFIGURATION SUPABASE =================
const SUPABASE_URL = 'https://mobgoxdfmhkmqpiwyhhj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_GcGYY4d9w-uPgavGF4mdYQ_T-IwO88o';

// ================= DONNÉES INITIALES POUR LES PRODUITS =================
const INITIAL_PRODUCTS = [
    { id: 1, name: "HBSAG (50 Strips/box)", category: "Sérologie", quantity: 100, price: 12, unit: "boite", seuilAlerte: 20, image: "🧪" },
    { id: 2, name: "HCV (50 Strips/box)", category: "Sérologie", quantity: 100, price: 12, unit: "boite", seuilAlerte: 20, image: "🧪" },
    { id: 3, name: "SYPHILIS (TP)", category: "Sérologie", quantity: 100, price: 12, unit: "boite", seuilAlerte: 20, image: "🧪" },
    { id: 4, name: "H. PYLORI Antibody", category: "Sérologie", quantity: 70, price: 20, unit: "boite", seuilAlerte: 15, image: "🧪" },
    { id: 5, name: "SALMONELLA TYPHOID", category: "Sérologie", quantity: 50, price: 30, unit: "boite", seuilAlerte: 10, image: "🧪" },
    { id: 6, name: "Tube EDTA K3PET", category: "Consommable", quantity: 500, price: 8, unit: "boite", seuilAlerte: 100, image: "🧴" },
    { id: 7, name: "Tube SEC", category: "Consommable", quantity: 500, price: 8, unit: "boite", seuilAlerte: 100, image: "🧴" },
    { id: 8, name: "Tube heparine", category: "Consommable", quantity: 100, price: 8, unit: "boite", seuilAlerte: 20, image: "🧴" },
    { id: 9, name: "Chariot de soins", category: "Equipement", quantity: 3, price: 130, unit: "pièce", seuilAlerte: 1, image: "🚑" },
    { id: 10, name: "Paravent 4 volets", category: "Equipement", quantity: 5, price: 160, unit: "pièce", seuilAlerte: 2, image: "🪑" },
    { id: 11, name: "Micropipette 10-100μl", category: "Laboratoire", quantity: 22, price: 50, unit: "pièce", seuilAlerte: 5, image: "🔬" },
    { id: 12, name: "Micropipette 100-1000μl", category: "Laboratoire", quantity: 22, price: 50, unit: "pièce", seuilAlerte: 5, image: "🔬" },
    { id: 13, name: "Cover Glass Lamelle", category: "Consommable", quantity: 500, price: 1.5, unit: "boite", seuilAlerte: 100, image: "🔍" },
    { id: 14, name: "Microscope Slides", category: "Consommable", quantity: 400, price: 3, unit: "boite", seuilAlerte: 80, image: "🔬" },
    { id: 15, name: "Stethoscope", category: "Equipement", quantity: 100, price: 6, unit: "pièce", seuilAlerte: 20, image: "🩺" },
    { id: 16, name: "Tensiomètre anéroïde", category: "Equipement", quantity: 50, price: 20, unit: "pièce", seuilAlerte: 10, image: "💉" },
    { id: 17, name: "Oxymètre de pouls", category: "Equipement", quantity: 100, price: 10, unit: "pièce", seuilAlerte: 20, image: "📱" },
    { id: 18, name: "Analyseur d'urine", category: "Urologie", quantity: 5, price: 650, unit: "pièce", seuilAlerte: 2, image: "🔬" },
    { id: 19, name: "Bandelette 14A", category: "Urologie", quantity: 100, price: 50, unit: "boite", seuilAlerte: 20, image: "📊" },
    { id: 20, name: "Nébulisateur", category: "Médecine", quantity: 12, price: 65, unit: "pièce", seuilAlerte: 3, image: "💨" }
];

// ================= APPLICATION PRINCIPALE =================
function App() {
    // 🔐 ACCÈS DIRECT AU PANEL ADMIN (sans authentification)
    if (window.location.pathname === '/admin-panel') {
        return <AdminPanel />;
    }

    const [user, setUser] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [theme, setTheme] = React.useState('light');
    const [products, setProducts] = React.useState([]);
    const [users, setUsers] = React.useState([]);
    const [sales, setSales] = React.useState([]);
    const [online, setOnline] = React.useState(navigator.onLine);
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    React.useEffect(() => {
        const savedUser = localStorage.getItem('andremed_user');
        const savedTheme = localStorage.getItem('theme');
        if (savedUser) setUser(JSON.parse(savedUser));
        if (savedTheme) setTheme(savedTheme);
        setLoading(false);
    }, []);

    React.useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    React.useEffect(() => {
        if (!user) return;
        loadProducts();
        loadUsers();
        loadSales();
        
        const productsSub = supabase.channel('products')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => loadProducts())
            .subscribe();
        const usersSub = supabase.channel('users')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => loadUsers())
            .subscribe();
        const salesSub = supabase.channel('sales')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => loadSales())
            .subscribe();
            
        window.addEventListener('online', () => setOnline(true));
        window.addEventListener('offline', () => setOnline(false));
        
        return () => {
            productsSub.unsubscribe();
            usersSub.unsubscribe();
            salesSub.unsubscribe();
        };
    }, [user]);

    const loadProducts = async () => {
        try {
            const { data, error } = await supabase.from('products').select('*').order('id');
            if (error) throw error;
            setProducts(data || []);
        } catch (error) { console.error(error); }
    };

    const loadUsers = async () => {
        try {
            const { data, error } = await supabase.from('users').select('*').order('id');
            if (error) throw error;
            setUsers(data || []);
        } catch (error) { console.error(error); }
    };

    const loadSales = async () => {
        try {
            let query = supabase.from('sales').select('*').order('date', { ascending: false });
            if (user?.role !== 'admin') query = query.eq('user_id', user.id);
            const { data, error } = await query;
            if (error) throw error;
            setSales(data || []);
        } catch (error) { console.error(error); }
    };

    const login = async (email, password) => {
        try {
            const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
            if (error || !data || data.password !== password) {
                alert('Email ou mot de passe incorrect');
                return false;
            }
            const userData = { ...data, role: data.role };
            setUser(userData);
            localStorage.setItem('andremed_user', JSON.stringify(userData));
            return true;
        } catch (error) {
            alert('Erreur de connexion');
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('andremed_user');
    };

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

    const ConnectionStatus = () => (
        <div style={{ position: 'fixed', bottom: '16px', right: '16px', padding: '8px 16px', borderRadius: '40px', background: online ? 'var(--success)' : 'var(--danger)', color: 'white', fontSize: '12px', fontWeight: 'bold', zIndex: 1000 }}>
            {online ? '🟢 Connecté' : '🔴 Hors ligne'}
        </div>
    );

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Chargement...</div>;
    if (!user) return <LoginPage onLogin={login} theme={theme} toggleTheme={toggleTheme} />;

    switch(user.role) {
        case 'admin': return <><AdminDashboard user={user} onLogout={logout} theme={theme} toggleTheme={toggleTheme} products={products} setProducts={setProducts} users={users} setUsers={setUsers} sales={sales} supabase={supabase} /><ConnectionStatus /></>;
        case 'vendeur': return <><VendeurDashboard user={user} onLogout={logout} theme={theme} toggleTheme={toggleTheme} products={products} setProducts={setProducts} supabase={supabase} /><ConnectionStatus /></>;
        case 'acheteur': return <><AcheteurDashboard user={user} onLogout={logout} theme={theme} toggleTheme={toggleTheme} products={products} supabase={supabase} /><ConnectionStatus /></>;
        default: return <LoginPage onLogin={login} theme={theme} toggleTheme={toggleTheme} />;
    }
}

// ================= PAGE DE CONNEXION =================
const LoginPage = ({ onLogin, theme, toggleTheme }) => {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await onLogin(email, password);
        setLoading(false);
    };

    const demoAccounts = [
        { role: 'admin', email: 'admin@andremed.com', password: 'admin123', label: '👑 Admin' },
        { role: 'vendeur', email: 'vendeur@andremed.com', password: 'vendeur123', label: '🛒 Vendeur' },
        { role: 'acheteur', email: 'client@email.com', password: 'client123', label: '🛍️ Client' }
    ];

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)', padding: '20px' }}>
            <div className="card" style={{ maxWidth: '440px', width: '100%', textAlign: 'center' }}>
                <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '40px' }}>🏥</div>
                <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Andremed Prosperity</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Gestion de Stock Médical - Cloud</p>
                <form onSubmit={handleSubmit}>
                    <input type="email" placeholder="📧 Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: '16px' }} required />
                    <input type="password" placeholder="🔐 Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} style={{ marginBottom: '24px' }} required />
                    <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '14px' }}>{loading ? 'Connexion...' : 'Se connecter'}</button>
                </form>
                <div style={{ margin: '24px 0' }}>
                    <p style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text-secondary)' }}>📋 Comptes de démonstration</p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {demoAccounts.map(demo => (
                            <button key={demo.role} onClick={() => { setEmail(demo.email); setPassword(demo.password); }} className="btn btn-secondary btn-sm">{demo.label}</button>
                        ))}
                    </div>
                </div>
                <button onClick={toggleTheme} className="btn btn-secondary" style={{ width: '100%' }}>{theme === 'light' ? '🌙 Mode sombre' : '☀️ Mode clair'}</button>
            </div>
        </div>
    );
};

// ================= GESTION DES UTILISATEURS =================
const UserManagement = ({ users, setUsers, supabase }) => {
    const [showForm, setShowForm] = React.useState(false);
    const [editingUser, setEditingUser] = React.useState(null);
    const [formData, setFormData] = React.useState({ name: '', email: '', password: '', role: 'acheteur' });
    const [search, setSearch] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');

    const roles = [
        { value: 'admin', label: '👑 Administrateur', color: '#3B82F6', description: 'Accès complet' },
        { value: 'vendeur', label: '🛒 Vendeur', color: '#10B981', description: 'Ventes uniquement' },
        { value: 'acheteur', label: '🛍️ Client', color: '#F59E0B', description: 'Achats en ligne' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (editingUser) {
                const updates = { name: formData.name, role: formData.role };
                if (formData.password) updates.password = formData.password;
                const { error } = await supabase.from('users').update(updates).eq('id', editingUser.id);
                if (error) throw error;
                setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...updates } : u));
            } else {
                if (users.find(u => u.email === formData.email)) { setError('Email déjà utilisé'); setLoading(false); return; }
                const newUser = { email: formData.email, password: formData.password, name: formData.name, role: formData.role, avatar: formData.role === 'admin' ? '👨‍⚕️' : formData.role === 'vendeur' ? '👩‍💼' : '👤' };
                const { data, error } = await supabase.from('users').insert([newUser]).select();
                if (error) throw error;
                setUsers([...users, data[0]]);
            }
            setFormData({ name: '', email: '', password: '', role: 'acheteur' });
            setEditingUser(null);
            setShowForm(false);
        } catch (error) { setError('Erreur lors de l\'enregistrement'); }
        setLoading(false);
    };

    const handleDelete = async (user) => {
        const currentUser = JSON.parse(localStorage.getItem('andremed_user'));
        if (currentUser.id === user.id) { alert('Vous ne pouvez pas supprimer votre propre compte'); return; }
        if (!confirm(`Supprimer ${user.name} ?`)) return;
        setLoading(true);
        try {
            await supabase.from('users').delete().eq('id', user.id);
            setUsers(users.filter(u => u.id !== user.id));
        } catch (error) { alert('Erreur lors de la suppression'); }
        setLoading(false);
    };

    const getRoleColor = (role) => roles.find(r => r.value === role)?.color || '#94A3B8';
    const filteredUsers = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
    const stats = { total: users.length, admins: users.filter(u => u.role === 'admin').length, vendeurs: users.filter(u => u.role === 'vendeur').length, acheteurs: users.filter(u => u.role === 'acheteur').length };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div><h2>👥 Utilisateurs ({stats.total})</h2><p style={{ color: 'var(--text-secondary)' }}>Gérez les comptes</p></div>
                <button onClick={() => { setEditingUser(null); setFormData({ name: '', email: '', password: '', role: 'acheteur' }); setShowForm(!showForm); }} className="btn btn-primary">{showForm ? '✖ Annuler' : '+ Nouvel utilisateur'}</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div className="card" style={{ textAlign: 'center' }}><div style={{ fontSize: '32px' }}>👥</div><div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.total}</div><div>Total</div></div>
                <div className="card" style={{ textAlign: 'center' }}><div style={{ fontSize: '32px' }}>👑</div><div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.admins}</div><div>Admins</div></div>
                <div className="card" style={{ textAlign: 'center' }}><div style={{ fontSize: '32px' }}>🛒</div><div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.vendeurs}</div><div>Vendeurs</div></div>
                <div className="card" style={{ textAlign: 'center' }}><div style={{ fontSize: '32px' }}>🛍️</div><div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.acheteurs}</div><div>Clients</div></div>
            </div>
            <input type="text" placeholder="🔍 Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: '24px' }} />
            {showForm && (
                <form onSubmit={handleSubmit} className="card" style={{ marginBottom: '24px' }}>
                    <h3>{editingUser ? '✏️ Modifier' : '➕ Nouvel utilisateur'}</h3>
                    {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', padding: '12px', borderRadius: '12px', marginBottom: '16px' }}>{error}</div>}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <input placeholder="Nom" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                        <input placeholder="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required disabled={!!editingUser} />
                        <input placeholder="Mot de passe" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!editingUser} />
                        <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                            {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '16px', width: '100%' }} disabled={loading}>{loading ? 'Enregistrement...' : (editingUser ? '💾 Sauvegarder' : '➕ Créer')}</button>
                </form>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredUsers.map(user => (
                    <div key={user.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '48px', height: '48px', background: `${getRoleColor(user.role)}20`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>{user.avatar || '👤'}</div>
                            <div><h4>{user.name}</h4><p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{user.email}</p></div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ padding: '4px 12px', borderRadius: '20px', background: `${getRoleColor(user.role)}20`, color: getRoleColor(user.role), fontSize: '12px' }}>{roles.find(r => r.value === user.role)?.label}</span>
                            <button onClick={() => { setEditingUser(user); setFormData({ name: user.name, email: user.email, password: '', role: user.role }); setShowForm(true); }} className="btn btn-secondary btn-sm">✏️</button>
                            <button onClick={() => handleDelete(user)} className="btn btn-danger btn-sm">🗑️</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ================= GESTION DU CONTENU (ACTUALITÉS, À PROPOS, ÉQUIPE, VILLES) =================
const SiteSettings = ({ supabase }) => {
    const [news, setNews] = React.useState([]);
    const [settings, setSettings] = React.useState({});
    const [team, setTeam] = React.useState([]);
    const [cities, setCities] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        const { data: newsData } = await supabase.from('site_news').select('*').order('id');
        const { data: settingsData } = await supabase.from('site_settings').select('*').eq('id', 1).single();
        const { data: teamData } = await supabase.from('team_members').select('*').order('order', { ascending: true });
        const { data: citiesData } = await supabase.from('cities_coverage').select('*').order('order_index', { ascending: true });
        setNews(newsData || []);
        setSettings(settingsData || {});
        setTeam(teamData || []);
        setCities(citiesData || []);
        setLoading(false);
    };

    const saveSettings = async () => {
        await supabase.from('site_settings').upsert({ ...settings, id: 1, updated_at: new Date().toISOString() });
        alert('Paramètres généraux mis à jour');
    };

    const addNews = () => setNews([...news, { id: Date.now(), type: 'promotion', title: '', description: '', date: '', icon: '📢', product_link: '', active: true, created_at: new Date().toISOString() }]);
    const updateNews = (idx, field, value) => setNews(news.map((n, i) => i === idx ? { ...n, [field]: value } : n));
    const deleteNews = async (idx) => {
        const item = news[idx];
        if (item.id && typeof item.id === 'number') await supabase.from('site_news').delete().eq('id', item.id);
        setNews(news.filter((_, i) => i !== idx));
    };
    const saveAllNews = async () => {
        for (const item of news) await supabase.from('site_news').upsert(item);
        alert('Actualités sauvegardées');
    };

    const addTeamMember = () => setTeam([...team, { id: Date.now(), name: '', role: '', photo_url: '', bio: '', order: team.length, active: true }]);
    const updateTeamMember = (idx, field, value) => setTeam(team.map((m, i) => i === idx ? { ...m, [field]: value } : m));
    const deleteTeamMember = async (idx) => {
        const member = team[idx];
        if (member.id && typeof member.id === 'number') await supabase.from('team_members').delete().eq('id', member.id);
        setTeam(team.filter((_, i) => i !== idx));
    };
    const saveTeam = async () => {
        for (const member of team) await supabase.from('team_members').upsert(member);
        alert('Équipe sauvegardée');
        loadData();
    };

    const addCity = () => {
        setCities([...cities, {
            id: Date.now(),
            city_name: 'Nouvelle ville',
            region: '',
            address: '',
            image_url: '',
            order_index: cities.length,
            active: true
        }]);
    };

    const updateCity = (idx, field, value) => setCities(cities.map((c, i) => i === idx ? { ...c, [field]: value } : c));
    const deleteCity = async (idx) => {
        const city = cities[idx];
        if (city.id && typeof city.id === 'number') await supabase.from('cities_coverage').delete().eq('id', city.id);
        setCities(cities.filter((_, i) => i !== idx));
    };
    const saveCities = async () => {
        for (const city of cities) {
            if (typeof city.id === 'number' && city.id > 1000000000000) delete city.id;
            await supabase.from('cities_coverage').upsert(city);
        }
        alert('Villes sauvegardées');
        loadData();
    };

    if (loading) return <div>Chargement du contenu...</div>;

    return (
        <div>
            <h2>📝 Gestion du contenu du site</h2>

            <div className="card" style={{ marginBottom: '32px' }}>
                <h3>📰 Actualités & Promotions</h3>
                <button onClick={addNews} className="btn btn-primary btn-sm">➕ Ajouter une actualité</button>
                {news.map((item, idx) => (
                    <div key={idx} style={{ border: '1px solid var(--border)', padding: '16px', marginTop: '16px', borderRadius: '12px' }}>
                        <select value={item.type} onChange={e => updateNews(idx, 'type', e.target.value)}>
                            <option value="promotion">Promotion</option>
                            <option value="nouveaute">Nouveauté</option>
                            <option value="evenement">Événement</option>
                        </select>
                        <input placeholder="Titre" value={item.title} onChange={e => updateNews(idx, 'title', e.target.value)} style={{ width: '100%', marginTop: '8px' }} />
                        <textarea placeholder="Description" value={item.description} onChange={e => updateNews(idx, 'description', e.target.value)} rows="2" style={{ width: '100%' }} />
                        <input placeholder="Date (ex: 31 mai 2026)" value={item.date} onChange={e => updateNews(idx, 'date', e.target.value)} />
                        <input placeholder="Icône (emoji)" value={item.icon} onChange={e => updateNews(idx, 'icon', e.target.value)} />
                        <input placeholder="Lien produit (ex: /shop ou null)" value={item.product_link || ''} onChange={e => updateNews(idx, 'product_link', e.target.value)} />
                        <label style={{ marginLeft: '16px' }}>
                            <input type="checkbox" checked={item.active} onChange={e => updateNews(idx, 'active', e.target.checked)} /> Actif
                        </label>
                        <button onClick={() => deleteNews(idx)} className="btn btn-danger btn-sm" style={{ marginLeft: '16px' }}>🗑 Supprimer</button>
                    </div>
                ))}
                <button onClick={saveAllNews} className="btn btn-primary" style={{ marginTop: '16px' }}>💾 Sauvegarder toutes les actualités</button>
            </div>

            <div className="card" style={{ marginBottom: '32px' }}>
                <h3>🏢 À propos & coordonnées</h3>
                <input placeholder="Titre de la page À propos" value={settings.about_title || ''} onChange={e => setSettings({ ...settings, about_title: e.target.value })} style={{ marginBottom: '8px', width: '100%' }} />
                <textarea placeholder="Description complète" rows="3" value={settings.about_description || ''} onChange={e => setSettings({ ...settings, about_description: e.target.value })} style={{ marginBottom: '8px', width: '100%' }} />
                <textarea placeholder="Vision" rows="2" value={settings.about_vision || ''} onChange={e => setSettings({ ...settings, about_vision: e.target.value })} style={{ marginBottom: '8px', width: '100%' }} />
                <textarea placeholder="Mission" rows="2" value={settings.about_mission || ''} onChange={e => setSettings({ ...settings, about_mission: e.target.value })} style={{ marginBottom: '8px', width: '100%' }} />
                <h4>📞 Coordonnées</h4>
                <input placeholder="Téléphone 1" value={settings.phone1 || ''} onChange={e => setSettings({ ...settings, phone1: e.target.value })} style={{ marginBottom: '8px', width: '100%' }} />
                <input placeholder="Téléphone 2" value={settings.phone2 || ''} onChange={e => setSettings({ ...settings, phone2: e.target.value })} style={{ marginBottom: '8px', width: '100%' }} />
                <input placeholder="Email contact" value={settings.email || ''} onChange={e => setSettings({ ...settings, email: e.target.value })} style={{ marginBottom: '8px', width: '100%' }} />
                <input placeholder="Email support" value={settings.support_email || ''} onChange={e => setSettings({ ...settings, support_email: e.target.value })} style={{ marginBottom: '8px', width: '100%' }} />
                <textarea placeholder="Adresse physique" rows="2" value={settings.address || ''} onChange={e => setSettings({ ...settings, address: e.target.value })} style={{ marginBottom: '8px', width: '100%' }} />
                <h4>🔗 Réseaux sociaux</h4>
                <input placeholder="Facebook URL" value={settings.facebook_url || ''} onChange={e => setSettings({ ...settings, facebook_url: e.target.value })} style={{ marginBottom: '8px', width: '100%' }} />
                <input placeholder="LinkedIn URL" value={settings.linkedin_url || ''} onChange={e => setSettings({ ...settings, linkedin_url: e.target.value })} style={{ marginBottom: '8px', width: '100%' }} />
                <input placeholder="TikTok URL" value={settings.tiktok_url || ''} onChange={e => setSettings({ ...settings, tiktok_url: e.target.value })} style={{ marginBottom: '8px', width: '100%' }} />
                <button onClick={saveSettings} className="btn btn-primary">💾 Sauvegarder les paramètres</button>
            </div>

            <div className="card" style={{ marginBottom: '32px' }}>
                <h3>👥 Équipe</h3>
                <button onClick={addTeamMember} className="btn btn-primary btn-sm">➕ Ajouter un membre</button>
                {team.map((member, idx) => (
                    <div key={idx} style={{ borderTop: '1px solid var(--border)', padding: '16px', marginTop: '16px' }}>
                        <input placeholder="Nom complet" value={member.name} onChange={e => updateTeamMember(idx, 'name', e.target.value)} style={{ marginBottom: '8px', width: '100%' }} />
                        <input placeholder="Rôle / Titre" value={member.role} onChange={e => updateTeamMember(idx, 'role', e.target.value)} style={{ marginBottom: '8px', width: '100%' }} />
                        <input placeholder="URL de la photo" value={member.photo_url || ''} onChange={e => updateTeamMember(idx, 'photo_url', e.target.value)} style={{ marginBottom: '8px', width: '100%' }} />
                        <textarea placeholder="Biographie" rows="2" value={member.bio || ''} onChange={e => updateTeamMember(idx, 'bio', e.target.value)} style={{ marginBottom: '8px', width: '100%' }} />
                        <label style={{ marginRight: '16px' }}>
                            <input type="checkbox" checked={member.active} onChange={e => updateTeamMember(idx, 'active', e.target.checked)} /> Actif
                        </label>
                        <label style={{ marginRight: '16px' }}>
                            Ordre : <input type="number" value={member.order} onChange={e => updateTeamMember(idx, 'order', parseInt(e.target.value))} style={{ width: '60px' }} />
                        </label>
                        <button onClick={() => deleteTeamMember(idx)} className="btn btn-danger btn-sm">🗑 Supprimer</button>
                    </div>
                ))}
                <button onClick={saveTeam} className="btn btn-primary" style={{ marginTop: '16px' }}>💾 Sauvegarder l’équipe</button>
            </div>

            <div className="card">
                <h3>📍 Villes couvertes (Notre Présence)</h3>
                <button onClick={addCity} className="btn btn-primary btn-sm">➕ Ajouter une ville</button>
                {cities.map((city, idx) => (
                    <div key={idx} style={{ borderTop: '1px solid var(--border)', padding: '16px', marginTop: '16px' }}>
                        <input placeholder="Nom de la ville" value={city.city_name} onChange={e => updateCity(idx, 'city_name', e.target.value)} style={{ marginBottom: '8px', width: '100%' }} />
                        <input placeholder="Région / Province" value={city.region || ''} onChange={e => updateCity(idx, 'region', e.target.value)} style={{ marginBottom: '8px', width: '100%' }} />
                        <input placeholder="Adresse / Représentation" value={city.address || ''} onChange={e => updateCity(idx, 'address', e.target.value)} style={{ marginBottom: '8px', width: '100%' }} />
                        <input placeholder="URL de l'image (carte ou photo)" value={city.image_url || ''} onChange={e => updateCity(idx, 'image_url', e.target.value)} style={{ marginBottom: '8px', width: '100%' }} />
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <label>Ordre : <input type="number" value={city.order_index} onChange={e => updateCity(idx, 'order_index', parseInt(e.target.value))} style={{ width: '70px' }} /></label>
                            <label><input type="checkbox" checked={city.active} onChange={e => updateCity(idx, 'active', e.target.checked)} /> Actif</label>
                            <button onClick={() => deleteCity(idx)} className="btn btn-danger btn-sm">🗑 Supprimer</button>
                        </div>
                    </div>
                ))}
                <button onClick={saveCities} className="btn btn-primary" style={{ marginTop: '16px' }}>💾 Sauvegarder les villes</button>
            </div>
        </div>
    );
};

// ================= DASHBOARD ADMIN =================
const AdminDashboard = ({ user, onLogout, theme, toggleTheme, products, setProducts, users, setUsers, sales, supabase }) => {
    const [activeTab, setActiveTab] = React.useState('overview');
    const [showForm, setShowForm] = React.useState(false);
    const [editingId, setEditingId] = React.useState(null);
    const [formData, setFormData] = React.useState({ name: '', category: '', quantity: '', price: '', unit: 'pièce', seuilAlerte: 10 });
    const [search, setSearch] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const totalStock = products.reduce((s, p) => s + p.quantity, 0);
    const totalValue = products.reduce((s, p) => s + (p.quantity * p.price), 0);
    const lowStock = products.filter(p => p.quantity <= p.seuilAlerte).length;
    const totalSales = sales.reduce((s, sale) => s + sale.total, 0);
    const todaySales = sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).reduce((s, sale) => s + sale.total, 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const productData = { name: formData.name, category: formData.category, quantity: Number(formData.quantity), price: Number(formData.price), unit: formData.unit, seuil_alerte: Number(formData.seuilAlerte), image: '📦' };
        try {
            if (editingId) await supabase.from('products').update(productData).eq('id', editingId);
            else await supabase.from('products').insert([productData]);
            const { data } = await supabase.from('products').select('*').order('id');
            setProducts(data);
            setFormData({ name: '', category: '', quantity: '', price: '', unit: 'pièce', seuilAlerte: 10 });
            setEditingId(null);
            setShowForm(false);
        } catch (error) { alert('Erreur'); }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (!confirm('Supprimer ce produit ?')) return;
        setLoading(true);
        try {
            await supabase.from('products').delete().eq('id', id);
            const { data } = await supabase.from('products').select('*').order('id');
            setProducts(data);
        } catch (error) { alert('Erreur'); }
        setLoading(false);
    };

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()));
    const stats = [
        { title: 'Produits', value: products.length, icon: '📦', color: '#3B82F6' },
        { title: 'Stock total', value: totalStock, icon: '📊', color: '#10B981' },
        { title: 'Valeur stock', value: `${totalValue.toLocaleString()} $`, icon: '💰', color: '#F59E0B' },
        { title: 'Alertes', value: lowStock, icon: '⚠️', color: '#EF4444' },
        { title: 'CA Total', value: `${totalSales.toLocaleString()} $`, icon: '📈', color: '#8B5CF6' },
        { title: 'Ventes aujourd\'hui', value: `${todaySales.toLocaleString()} $`, icon: '🛒', color: '#10B981' }
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <div style={{ width: '280px', background: 'var(--surface)', borderRight: '1px solid var(--border)', padding: '24px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}><div style={{ fontSize: '48px' }}>🏥</div><h2>Andremed</h2><p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Administrateur</p></div>
                <nav style={{ flex: 1 }}>
                    {['overview', 'products', 'users', 'sales', 'content'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className="btn btn-secondary" style={{ width: '100%', marginBottom: '8px', background: activeTab === tab ? 'var(--secondary)' : 'transparent', color: activeTab === tab ? 'white' : 'var(--text)' }}>
                            {tab === 'overview' && '📊 Vue d\'ensemble'}
                            {tab === 'products' && '📦 Produits'}
                            {tab === 'users' && '👥 Utilisateurs'}
                            {tab === 'sales' && '💰 Ventes'}
                            {tab === 'content' && '📝 Contenu'}
                        </button>
                    ))}
                </nav>
                <div><button onClick={toggleTheme} className="btn btn-secondary" style={{ width: '100%', marginBottom: '12px' }}>{theme === 'light' ? '🌙' : '☀️'} Mode</button><button onClick={onLogout} className="btn btn-danger" style={{ width: '100%' }}>🔓 Déconnexion</button></div>
            </div>
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                {activeTab === 'overview' && (
                    <div>
                        <h2>Tableau de bord</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Bienvenue {user.name}</p>
                        <div className="products-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginBottom: '32px' }}>
                            {stats.map(s => (<div key={s.title} className="card" style={{ textAlign: 'center' }}><div style={{ fontSize: '32px' }}>{s.icon}</div><p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.title}</p><h2>{s.value}</h2></div>))}
                        </div>
                        <div className="card"><h3>📈 Dernières ventes</h3>{sales.slice(0, 5).map(sale => (<div key={sale.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}><span>{new Date(sale.date).toLocaleString()}</span><span>{sale.items?.length || 0} articles</span><span style={{ fontWeight: 'bold' }}>{sale.total.toFixed(2)} $</span></div>))}</div>
                    </div>
                )}
                {activeTab === 'products' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}><h2>📦 Produits</h2><button onClick={() => setShowForm(!showForm)} className="btn btn-primary">{showForm ? 'Annuler' : '+ Ajouter'}</button></div>
                        <input type="text" placeholder="🔍 Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: '24px' }} />
                        {showForm && (
                            <form onSubmit={handleSubmit} className="card" style={{ marginBottom: '24px' }}>
                                <h3>{editingId ? '✏️ Modifier' : '➕ Ajouter'}</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
                                    <input placeholder="Nom" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                                    <input placeholder="Catégorie" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
                                    <input placeholder="Quantité" type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} required />
                                    <input placeholder="Prix USD" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                                    <input placeholder="Unité" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} />
                                    <input placeholder="Seuil alerte" type="number" value={formData.seuilAlerte} onChange={(e) => setFormData({ ...formData, seuilAlerte: e.target.value })} />
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ marginTop: '16px', width: '100%' }} disabled={loading}>{loading ? 'Enregistrement...' : (editingId ? '💾 Sauvegarder' : '➕ Ajouter')}</button>
                            </form>
                        )}
                        <div className="products-grid">
                            {filteredProducts.map(p => (<div key={p.id} className="card"><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}><span style={{ fontSize: '32px' }}>{p.image}</span><span className={`stock-badge ${p.quantity > 20 ? 'stock-high' : p.quantity > 5 ? 'stock-medium' : 'stock-low'}`}>Stock: {p.quantity}</span></div><h3>{p.name}</h3><p style={{ color: 'var(--text-secondary)' }}>{p.category}</p><p><strong>Prix:</strong> {p.price} $ / {p.unit}</p><div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}><button onClick={() => { setEditingId(p.id); setFormData({ name: p.name, category: p.category, quantity: p.quantity, price: p.price, unit: p.unit, seuilAlerte: p.seuil_alerte }); setShowForm(true); }} className="btn btn-secondary btn-sm">✏️</button><button onClick={() => handleDelete(p.id)} className="btn btn-danger btn-sm">🗑️</button></div></div>))}
                        </div>
                    </div>
                )}
                {activeTab === 'users' && <UserManagement users={users} setUsers={setUsers} supabase={supabase} />}
                {activeTab === 'sales' && (
                    <div><h2>💰 Historique des ventes</h2><div className="card" style={{ marginTop: '24px' }}><table style={{ width: '100%' }}><thead><tr><th style={{ textAlign: 'left', padding: '12px' }}>Date</th><th style={{ textAlign: 'left', padding: '12px' }}>Articles</th><th style={{ textAlign: 'right', padding: '12px' }}>Total</th></tr></thead><tbody>{sales.map(sale => (<tr key={sale.id}><td style={{ padding: '12px' }}>{new Date(sale.date).toLocaleString()}</td><td style={{ padding: '12px' }}>{sale.items?.length || 0} articles</td><td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>{sale.total.toFixed(2)} $</td></tr>))}</tbody>}</table></div></div>
                )}
                {activeTab === 'content' && <SiteSettings supabase={supabase} />}
            </div>
        </div>
    );
};

// ================= DASHBOARD VENDEUR =================
const VendeurDashboard = ({ user, onLogout, theme, toggleTheme, products, setProducts, supabase }) => {
    const [cart, setCart] = React.useState([]);
    const [showCart, setShowCart] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const [selectedCategory, setSelectedCategory] = React.useState('all');
    const [loading, setLoading] = React.useState(false);
    const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    const categories = ['all', ...new Set(products.map(p => p.category))];

    const addToCart = (product) => {
        const existing = cart.find(i => i.id === product.id);
        if (existing) { if (existing.quantity + 1 > product.quantity) { alert(`Stock insuffisant!`); return; } setCart(cart.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)); }
        else setCart([...cart, { ...product, quantity: 1 }]);
    };
    const updateQuantity = (id, qty) => { if (qty <= 0) setCart(cart.filter(i => i.id !== id)); else setCart(cart.map(i => i.id === id ? { ...i, quantity: qty } : i)); };
    const removeFromCart = (id) => setCart(cart.filter(i => i.id !== id));
    const validateSale = async () => {
        if (cart.length === 0) { alert('Panier vide'); return; }
        setLoading(true);
        try {
            for (const item of cart) await supabase.from('products').update({ quantity: products.find(p => p.id === item.id).quantity - item.quantity }).eq('id', item.id);
            await supabase.from('sales').insert([{ user_id: user.id, total: total, items: cart.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price })), date: new Date().toISOString() }]);
            const { data } = await supabase.from('products').select('*').order('id');
            setProducts(data);
            setCart([]); setShowCart(false);
            alert(`✅ Vente effectuée! Total: ${total.toFixed(2)} $`);
        } catch (error) { alert('Erreur'); }
        setLoading(false);
    };
    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) && (selectedCategory === 'all' || p.category === selectedCategory));

    return (
        <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
            <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div><span style={{ fontSize: '32px' }}>🏥</span><h2 style={{ display: 'inline', marginLeft: '12px' }}>Point de Vente</h2><p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{user.name}</p></div>
                <div style={{ display: 'flex', gap: '12px' }}><button onClick={() => setShowCart(true)} className="btn btn-secondary">🛒 Panier ({cart.reduce((s, i) => s + i.quantity, 0)})</button><button onClick={toggleTheme} className="btn btn-secondary">{theme === 'light' ? '🌙' : '☀️'}</button><button onClick={onLogout} className="btn btn-danger">🔓</button></div>
            </div>
            {showCart && (<div className="modal-overlay" onClick={() => setShowCart(false)}><div className="modal-content" onClick={e => e.stopPropagation()}><h3>🛒 Panier</h3>{cart.map(item => (<div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}><div><strong>{item.name}</strong><div>{item.price} $</div></div><div><button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="btn btn-secondary btn-sm">-</button><span style={{ margin: '0 8px' }}>{item.quantity}</span><button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="btn btn-secondary btn-sm">+</button><span style={{ marginLeft: '16px' }}>{(item.price * item.quantity).toFixed(2)} $</span><button onClick={() => removeFromCart(item.id)} className="btn btn-danger btn-sm" style={{ marginLeft: '8px' }}>✖</button></div></div>))}<div style={{ marginTop: '16px', textAlign: 'right', fontSize: '20px', fontWeight: 'bold' }}>Total: {total.toFixed(2)} $</div><button onClick={validateSale} className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }} disabled={loading}>{loading ? 'Traitement...' : '✅ Valider'}</button></div></div>)}
            <div style={{ padding: '24px' }}>
                <input type="text" placeholder="🔍 Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: '24px' }} />
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>{categories.map(cat => (<button key={cat} onClick={() => setSelectedCategory(cat)} className="btn btn-secondary" style={{ background: selectedCategory === cat ? 'var(--secondary)' : 'transparent', color: selectedCategory === cat ? 'white' : 'var(--text)' }}>{cat === 'all' ? 'Tous' : cat}</button>))}</div>
                <div className="products-grid">{filteredProducts.map(p => (<div key={p.id} className="card"><div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '32px' }}>{p.image}</span><span className={`stock-badge ${p.quantity > 20 ? 'stock-high' : p.quantity > 5 ? 'stock-medium' : 'stock-low'}`}>{p.quantity}</span></div><h3>{p.name}</h3><p style={{ color: 'var(--text-secondary)' }}>{p.category}</p><div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}><span style={{ fontSize: '20px', fontWeight: 'bold' }}>{p.price} $</span><button onClick={() => addToCart(p)} disabled={p.quantity === 0} className="btn btn-primary btn-sm">{p.quantity === 0 ? 'Rupture' : 'Ajouter'}</button></div></div>))}</div>
            </div>
        </div>
    );
};

// ================= DASHBOARD ACHETEUR AVEC PAIEMENT =================
const AcheteurDashboard = ({ user, onLogout, theme, toggleTheme, products, supabase }) => {
    const [cart, setCart] = React.useState([]);
    const [showCart, setShowCart] = React.useState(false);
    const [showPayment, setShowPayment] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const [selectedCategory, setSelectedCategory] = React.useState('all');
    const [orders, setOrders] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const categories = ['all', ...new Set(products.map(p => p.category))];
    const cartTotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);

    React.useEffect(() => { loadOrders(); }, []);
    const loadOrders = async () => {
        try { const { data } = await supabase.from('sales').select('*').eq('user_id', user.id).order('date', { ascending: false }); setOrders(data || []); } catch (error) { console.error(error); }
    };
    const addToCart = (product) => { const existing = cart.find(i => i.id === product.id); existing ? setCart(cart.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)) : setCart([...cart, { ...product, quantity: 1 }]); };
    const updateQuantity = (id, qty) => { if (qty <= 0) setCart(cart.filter(i => i.id !== id)); else setCart(cart.map(i => i.id === id ? { ...i, quantity: qty } : i)); };
    const removeFromCart = (id) => setCart(cart.filter(i => i.id !== id));
    const handlePaymentSuccess = async (order) => {
        setLoading(true);
        try {
            for (const item of order.items) await supabase.from('products').update({ quantity: products.find(p => p.id === item.id).quantity - item.quantity }).eq('id', item.id);
            await supabase.from('sales').insert([{ user_id: user.id, total: order.total, items: order.items, payment_method: order.paymentMethod, transaction_id: order.transactionId, status: 'Payée', date: order.date }]);
            setOrders([order, ...orders]); setCart([]); setShowCart(false); setShowPayment(false);
            alert(`✅ Paiement réussi ! Commande #${order.id} confirmée.`);
            const { data } = await supabase.from('products').select('*').order('id');
            window.location.reload();
        } catch (error) { alert('Erreur lors du paiement'); }
        setLoading(false);
    };
    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) && (selectedCategory === 'all' || p.category === selectedCategory));

    return (
        <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
            <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div><span style={{ fontSize: '32px' }}>🛍️</span><h2 style={{ display: 'inline', marginLeft: '12px' }}>Andremed Pharmacy</h2><p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Bienvenue {user.name}</p></div>
                <div style={{ display: 'flex', gap: '12px' }}><button onClick={() => setShowCart(true)} className="btn btn-secondary">🛒 Panier ({cart.reduce((s, i) => s + i.quantity, 0)}) - {cartTotal.toFixed(2)} $</button><button onClick={toggleTheme} className="btn btn-secondary">{theme === 'light' ? '🌙' : '☀️'}</button><button onClick={onLogout} className="btn btn-danger">🔓</button></div>
            </div>
            {showCart && (<div className="modal-overlay" onClick={() => setShowCart(false)}><div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}><h3>🛒 Mon panier</h3><button onClick={() => setShowCart(false)} style={{ background: 'var(--danger)', color: 'white', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer' }}>✖</button></div>{cart.map(item => (<div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}><div><strong>{item.name}</strong><div>{item.price} $ / {item.unit}</div></div><div><button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="btn btn-secondary btn-sm">-</button><span style={{ margin: '0 8px' }}>{item.quantity}</span><button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="btn btn-secondary btn-sm">+</button><span style={{ marginLeft: '16px' }}>{(item.price * item.quantity).toFixed(2)} $</span><button onClick={() => removeFromCart(item.id)} className="btn btn-danger btn-sm" style={{ marginLeft: '8px' }}>✖</button></div></div>))}<div style={{ marginTop: '16px', textAlign: 'right', fontSize: '20px', fontWeight: 'bold' }}>Total: {cartTotal.toFixed(2)} $</div><div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}><button onClick={() => setCart([])} className="btn btn-danger" style={{ flex: 1 }}>🗑️ Vider</button><button onClick={() => { setShowCart(false); setShowPayment(true); }} className="btn btn-primary" style={{ flex: 2 }}>💳 Payer</button></div></div></div>)}
            {showPayment && (<PaymentModal cart={cart} total={cartTotal} onClose={() => setShowPayment(false)} onSuccess={handlePaymentSuccess} />)}
            <div style={{ padding: '24px' }}>
                <input type="text" placeholder="🔍 Rechercher un produit..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: '24px' }} />
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>{categories.map(cat => (<button key={cat} onClick={() => setSelectedCategory(cat)} className="btn btn-secondary" style={{ background: selectedCategory === cat ? 'var(--secondary)' : 'transparent', color: selectedCategory === cat ? 'white' : 'var(--text)' }}>{cat === 'all' ? 'Tous' : cat}</button>))}</div>
                <div className="products-grid">{filteredProducts.map(p => (<div key={p.id} className="card"><div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '48px' }}>{p.image}</span><span className={`stock-badge ${p.quantity > 20 ? 'stock-high' : p.quantity > 5 ? 'stock-medium' : 'stock-low'}`}>{p.quantity > 0 ? `Stock: ${p.quantity}` : 'Rupture'}</span></div><h3>{p.name}</h3><p style={{ color: 'var(--text-secondary)' }}>{p.category}</p><div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}><span style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--secondary)' }}>{p.price} $<span style={{ fontSize: '12px' }}> / {p.unit}</span></span><button onClick={() => addToCart(p)} disabled={p.quantity === 0} className="btn btn-primary btn-sm">{p.quantity === 0 ? 'Rupture' : 'Ajouter'}</button></div></div>))}</div>
                {orders.length > 0 && (<div style={{ marginTop: '48px' }}><h3>📦 Mes commandes</h3>{orders.map(order => (<div key={order.id} className="card" style={{ marginBottom: '16px' }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Commande #{order.id}</strong><span style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(16,185,129,0.2)', color: 'var(--success)' }}>{order.status || 'Confirmée'}</span></div><p>Date: {new Date(order.date).toLocaleString()}</p><p>Total: <strong>{order.total.toFixed(2)} $</strong></p><details><summary style={{ cursor: 'pointer', color: 'var(--secondary)' }}>Voir détails</summary><div>{order.items.map((item, idx) => (<p key={idx}>{item.name}: {item.quantity} x {item.price}$ = {(item.quantity * item.price).toFixed(2)}$</p>))}</div></details></div>))}</div>)}
            </div>
            {/* 🔓 BOUTON POUR FORCER L'ACCÈS ADMIN (déjà présent dans Home, mais on le garde ici aussi) */}
            <button 
                onClick={() => { localStorage.clear(); window.location.href = '/'; }}
                style={{ position: 'fixed', bottom: '20px', left: '20px', zIndex: 9999, background: '#B41E1E', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '40px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
            >
                🔓 Accès Admin (déconnexion)
            </button>
        </div>
    );
};

// ================= MODAL DE PAIEMENT =================
const PaymentModal = ({ cart, total, onClose, onSuccess }) => {
    const [step, setStep] = React.useState('method');
    const [paymentMethod, setPaymentMethod] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [formData, setFormData] = React.useState({ cardNumber: '', cardExpiry: '', cardCvc: '', cardName: '', mobileNumber: '', provider: 'ORANGE_MONEY' });
    const [error, setError] = React.useState('');

    const handleMethodSelect = (method) => { setPaymentMethod(method); setStep('payment'); };
    const handleCardPayment = (e) => { e.preventDefault(); setLoading(true); setTimeout(() => { setStep('confirmation'); setLoading(false); onSuccess({ id: Date.now(), date: new Date().toISOString(), items: cart, total: total, paymentMethod: 'carte', status: 'Payée', transactionId: 'card_' + Date.now() }); }, 1500); };
    const handleMobileMoneyPayment = (e) => { e.preventDefault(); setLoading(true); setTimeout(() => { setStep('confirmation'); setLoading(false); onSuccess({ id: Date.now(), date: new Date().toISOString(), items: cart, total: total, paymentMethod: 'mobile_money', provider: formData.provider, mobileNumber: formData.mobileNumber, status: 'Payée', transactionId: 'mm_' + Date.now() }); }, 1500); };
    const formatCardNumber = (v) => { const match = v.replace(/\s+/g, '').replace(/[^0-9]/gi, '').match(/\d{4,16}/g); return match ? match[0].match(/.{1,4}/g).join(' ') : v; };
    const formatExpiry = (v) => { const clean = v.replace(/\s+/g, '').replace(/[^0-9]/gi, ''); return clean.length >= 2 ? clean.substring(0, 2) + (clean.length > 2 ? '/' + clean.substring(2, 4) : '') : clean; };

    return (<div className="modal-overlay" onClick={onClose}><div className="modal-content" onClick={e => e.stopPropagation()}>
        {step === 'method' && (<><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}><h3>💰 Choisissez votre paiement</h3><button onClick={onClose} style={{ background: 'var(--danger)', color: 'white', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer' }}>✖</button></div>
        <button onClick={() => handleMethodSelect('card')} className="card" style={{ width: '100%', marginBottom: '16px', textAlign: 'left' }}><div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}><span style={{ fontSize: '32px' }}>💳</span><div><strong>Carte bancaire</strong><p style={{ fontSize: '12px', margin: 0 }}>Visa, Mastercard</p></div></div></button>
        <button onClick={() => handleMethodSelect('mobile')} className="card" style={{ width: '100%', textAlign: 'left' }}><div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}><span style={{ fontSize: '32px' }}>📱</span><div><strong>Mobile Money</strong><p style={{ fontSize: '12px', margin: 0 }}>Orange Money, MTN, Wave</p></div></div></button>
        <div style={{ marginTop: '24px', padding: '16px', background: 'var(--background)', borderRadius: '16px' }}><p>Total à payer: <strong style={{ fontSize: '20px', color: 'var(--secondary)' }}>{total.toFixed(2)} $</strong></p></div></>)}
        {step === 'payment' && paymentMethod === 'card' && (<><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}><h3>💳 Paiement par carte</h3><button onClick={onClose} style={{ background: 'var(--danger)', color: 'white', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer' }}>✖</button></div>
        <form onSubmit={handleCardPayment}><input type="text" placeholder="Numéro de carte" value={formData.cardNumber} onChange={(e) => setFormData({ ...formData, cardNumber: formatCardNumber(e.target.value) })} style={{ marginBottom: '16px' }} required /><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}><input placeholder="MM/AA" value={formData.cardExpiry} onChange={(e) => setFormData({ ...formData, cardExpiry: formatExpiry(e.target.value) })} required /><input placeholder="CVC" value={formData.cardCvc} onChange={(e) => setFormData({ ...formData, cardCvc: e.target.value.replace(/[^0-9]/g, '').slice(0, 4) })} required /></div><input type="text" placeholder="Nom sur la carte" value={formData.cardName} onChange={(e) => setFormData({ ...formData, cardName: e.target.value })} style={{ margin: '16px 0' }} required /><button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>{loading ? 'Traitement...' : `Payer ${total.toFixed(2)} $`}</button></form></>)}
        {step === 'payment' && paymentMethod === 'mobile' && (<><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}><h3>📱 Paiement Mobile Money</h3><button onClick={onClose} style={{ background: 'var(--danger)', color: 'white', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer' }}>✖</button></div>
        <form onSubmit={handleMobileMoneyPayment}><select value={formData.provider} onChange={(e) => setFormData({ ...formData, provider: e.target.value })} style={{ marginBottom: '16px' }}><option value="ORANGE_MONEY">🟠 Orange Money</option><option value="MTN_MONEY">🟡 MTN Mobile Money</option><option value="WAVE">🌊 Wave</option></select>
        <input type="tel" placeholder="Numéro de mobile" value={formData.mobileNumber} onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })} style={{ marginBottom: '16px' }} required /><button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>{loading ? 'Traitement...' : `Payer ${total.toFixed(2)} $`}</button></form></>)}
        {step === 'confirmation' && (<div style={{ textAlign: 'center' }}><div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div><h3>Paiement réussi !</h3><p>Votre commande a été enregistrée.</p><button onClick={onClose} className="btn btn-primary" style={{ marginTop: '24px' }}>Continuer</button></div>)}
    </div></div>);
};

// ================= STYLES GLOBAUX =================
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    :root {
        --primary: #2563eb;
        --secondary: #0A4D8C;
        --success: #10b981;
        --danger: #ef4444;
        --warning: #f59e0b;
        --background: #f8fafc;
        --surface: #ffffff;
        --text: #1e293b;
        --text-secondary: #64748b;
        --border: #e2e8f0;
        --card-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    [data-theme="dark"] {
        --background: #0f172a;
        --surface: #1e293b;
        --text: #f1f5f9;
        --text-secondary: #94a3b8;
        --border: #334155;
        --card-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background: var(--background);
        color: var(--text);
        transition: background 0.3s, color 0.3s;
    }
    .card {
        background: var(--surface);
        border-radius: 16px;
        padding: 20px;
        box-shadow: var(--card-shadow);
        border: 1px solid var(--border);
        transition: transform 0.2s, box-shadow 0.2s;
    }
    .card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .btn {
        border: none;
        padding: 8px 16px;
        border-radius: 40px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 14px;
    }
    .btn-primary {
        background: var(--primary);
        color: white;
    }
    .btn-primary:hover {
        background: #1d4ed8;
        transform: translateY(-1px);
    }
    .btn-secondary {
        background: var(--surface);
        color: var(--text);
        border: 1px solid var(--border);
    }
    .btn-secondary:hover {
        background: var(--background);
    }
    .btn-danger {
        background: var(--danger);
        color: white;
    }
    .btn-danger:hover {
        background: #dc2626;
    }
    .btn-sm {
        padding: 4px 12px;
        font-size: 12px;
    }
    input, select, textarea {
        background: var(--background);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 10px 14px;
        font-size: 14px;
        color: var(--text);
        width: 100%;
        box-sizing: border-box;
        transition: border 0.2s;
    }
    input:focus, select:focus, textarea:focus {
        outline: none;
        border-color: var(--primary);
    }
    .products-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 24px;
    }
    .stock-badge {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 40px;
        font-size: 12px;
        font-weight: 600;
    }
    .stock-high {
        background: rgba(16,185,129,0.2);
        color: #10b981;
    }
    .stock-medium {
        background: rgba(245,158,11,0.2);
        color: #f59e0b;
    }
    .stock-low {
        background: rgba(239,68,68,0.2);
        color: #ef4444;
    }
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }
    .modal-content {
        background: var(--surface);
        border-radius: 24px;
        padding: 24px;
        max-width: 500px;
        width: 90%;
        max-height: 85vh;
        overflow-y: auto;
    }
    table {
        width: 100%;
        border-collapse: collapse;
    }
    th, td {
        padding: 12px;
        border-bottom: 1px solid var(--border);
        text-align: left;
    }
`;
document.head.appendChild(styleSheet);

export default App;