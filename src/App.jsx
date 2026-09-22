import { useEffect, useMemo, useState } from 'react'
import { collection, doc, getDocs, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import {
  ArrowRight,
  Bell,
  ChevronDown,
  ChevronRight,
  Clock3,
  Heart,
  LogOut,
  MapPin,
  Menu,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  Ticket,
  UserRound,
  X,
} from 'lucide-react'
import { auth, db, hasFirebaseConfig, onAuthStateChanged } from './firebase'

const categories = [
  { icon: '👕', label: 'Thời trang nam nữ', count: '12k sản phẩm' },
  { icon: '🏠', label: 'Gia dụng & nhà cửa', count: '8.4k sản phẩm' },
  { icon: '📱', label: 'Điện tử & công nghệ', count: '5.6k sản phẩm' },
  { icon: '💊', label: 'Thực phẩm chức năng', count: '4.2k sản phẩm' },
  { icon: '🥗', label: 'Thực phẩm & đồ ăn', count: '2.1k sản phẩm' },
  { icon: '🐾', label: 'Đồ chơi thú cưng', count: '3.8k sản phẩm' },
  { icon: '🧰', label: 'Dụng cụ & tiện ích', count: '6.3k sản phẩm' },
]

const products = [
  { id: 1, name: 'Áo thun basic nam nữ co giãn', price: 199000, oldPrice: 299000, badge: 'Mua là mê', rating: '4.9', sold: '2.4k', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=700&q=85', tone: 'sand' },
  { id: 2, name: 'Bộ nồi inox 5 đáy đa năng', price: 790000, oldPrice: 1090000, badge: 'Hot deal', rating: '4.8', sold: '890', image: 'https://images.unsplash.com/photo-1582515073490-39981397c445?auto=format&fit=crop&w=700&q=85', tone: 'aqua' },
  { id: 3, name: 'Tai nghe Bluetooth True Wireless', price: 1490000, oldPrice: 2190000, badge: '-31%', rating: '4.7', sold: '6.1k', image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=700&q=85', tone: 'cream' },
  { id: 4, name: 'Bột protein hạt dinh dưỡng', price: 690000, oldPrice: 990000, badge: 'Flash sale', rating: '4.9', sold: '1.7k', image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=700&q=85', tone: 'blue' },
  { id: 5, name: 'Thức ăn hạt cho mèo vị cá', price: 219000, oldPrice: 320000, badge: 'Bán chạy', rating: '4.8', sold: '3.2k', image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=700&q=85', tone: 'green' },
  { id: 6, name: 'Bộ dụng cụ cắt dán, sửa chữa nhà', price: 459000, oldPrice: 560000, badge: '-24%', rating: '4.6', sold: '920', image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=700&q=85', tone: 'rose' },
]

const formatPrice = (value) => `${value.toLocaleString('vi-VN')}đ`

function App() {
  const [catalog, setCatalog] = useState(products)
  const [activeCategory, setActiveCategory] = useState('Tất cả')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([])
  const [liked, setLiked] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)

  useEffect(() => onAuthStateChanged(auth, async (firebaseUser) => {
    setCurrentUser(firebaseUser)
    if (!firebaseUser) {
      setUserProfile(null)
      return
    }

    const profile = await getDoc(doc(db, 'users', firebaseUser.uid))
    setUserProfile(profile.exists() ? profile.data() : null)
  }), [])

  useEffect(() => {
    if (!hasFirebaseConfig) return

    getDocs(collection(db, 'products'))
      .then((snapshot) => {
        const remoteProducts = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }))
        if (remoteProducts.length > 0) setCatalog(remoteProducts)
      })
      .catch((error) => console.warn('Không thể tải products từ Firestore:', error.message))
  }, [])

  const filteredProducts = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    if (!normalized) return catalog
    return catalog.filter((product) => product.name.toLowerCase().includes(normalized))
  }, [catalog, search])

  const addToCart = (product) => setCart((current) => [...current, product])
  const toggleLike = (id) => setLiked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  const total = cart.reduce((sum, product) => sum + product.price, 0)

  return (
    <div className="app-shell">
      <div className="topline">Miễn phí giao hàng cho đơn từ 299.000đ <span>·</span> Đổi trả miễn phí trong 30 ngày <span>·</span> <strong>Trở thành người bán</strong></div>
      <header className="site-header">
        <div className="header-main container">
          <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Mở menu"><Menu size={22} /></button>
          <a className="brand" href="#top" aria-label="NOVA Market home"><span className="brand-mark">N</span><span>NOVA<span className="brand-dot">.</span></span></a>
          <div className="search-wrap">
            <Search size={20} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm sản phẩm, thương hiệu, điểm đến..." />
            <button className="search-button" aria-label="Tìm kiếm"><Search size={18} /></button>
          </div>
          <div className="header-actions">
            <button className="header-action" aria-label="Thông báo"><Bell size={21} /><span className="notification-dot" /></button>
            <button className="header-action" onClick={() => setCartOpen(true)} aria-label="Giỏ hàng"><ShoppingBag size={21} /><span className="cart-count">{cart.length}</span></button>
            {currentUser ? <button className="account" onClick={() => setProfileOpen(true)} title="Xem thông tin cá nhân"><span className="avatar"><UserRound size={17} /></span><span><small>Xin chào!</small><b>{userProfile?.name || currentUser.email}</b></span><ChevronDown size={15} /></button> : <button className="account" onClick={() => setAuthOpen(true)}><span className="avatar"><UserRound size={17} /></span><span><small>Xin chào!</small><b>Đăng nhập</b></span><ChevronDown size={15} /></button>}
          </div>
        </div>
        <nav className={`main-nav container ${menuOpen ? 'show-mobile' : ''}`}>
          <a className="nav-active" href="#explore">Khám phá</a>
          <a href="#flash-sale">Flash sale</a>
          <a href="#home">Gia dụng</a>
          <a href="#tech">Công nghệ</a>
          <a href="#fashion">Thời trang</a>
          <a href="#food">Thực phẩm</a>
          <a href="#pet">Thú cưng</a>
          <a href="#seller" className="seller-link">Kênh người bán <ArrowRight size={14} /></a>
        </nav>
      </header>

      <main id="top">
        <section className="hero container" id="explore">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={14} /> Mua sắm thông minh</div>
            <h1>Thời trang.<br /><em>Gia dụng.</em><br />Điện tử.</h1>
            <p>Chuyên sàn thương mại điện tử cho mọi nhu cầu mua sắm: quần áo, đồ gia dụng, điện tử, thực phẩm chức năng, đồ ăn, thú cưng và dụng cụ tiện ích.</p>
            <div className="hero-buttons"><button className="primary-button" onClick={() => document.getElementById('flash-sale')?.scrollIntoView({ behavior: 'smooth' })}>Xem ưu đãi hôm nay <ArrowRight size={17} /></button><button className="text-button" onClick={() => setActiveCategory('Điện tử & công nghệ')}>Khám phá ngay <ChevronRight size={16} /></button></div>
            <div className="hero-trust"><span><strong>4.9/5</strong> đánh giá yêu thích</span><span className="trust-line" /><span>Hơn <strong>120k+</strong> đơn hàng</span></div>
          </div>
          <div className="hero-visual">
            <div className="hero-image"><img src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1400&q=90" alt="Sản phẩm thương mại điện tử" /></div>
            <div className="trip-card"><div className="trip-icon">⚡</div><div><span>Đơn vị bán chạy</span><strong>Combo gia dụng mùa mới</strong><small>Từ 799.000đ <span>↗</span></small></div></div>
            <div className="hero-stamp"><span>NEW</span><strong>2026</strong></div>
          </div>
        </section>

        <section className="category-section container">
          <div className="section-heading"><div><span className="section-kicker">Danh mục nổi bật</span><h2>Bạn đang tìm gì hôm nay?</h2></div><button className="outline-button">Xem tất cả <ArrowRight size={15} /></button></div>
          <div className="category-grid">{categories.map((category) => <button className="category-card" key={category.label} onClick={() => setActiveCategory(category.label)}><span className="category-icon">{category.icon}</span><span className="category-name">{category.label}</span><small>{category.count}</small></button>)}</div>
        </section>

        <section className="flash-section" id="flash-sale">
          <div className="container">
            <div className="section-heading light-heading"><div><span className="section-kicker">Kết thúc trong hôm nay</span><h2><Ticket size={25} /> Flash sale <span className="sale-pulse" /></h2></div><div className="countdown"><span>01</span><i>:</i><span>24</span><i>:</i><span>36</span></div></div>
            <div className="sale-grid">{catalog.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} liked={liked.includes(product.id)} onLike={() => toggleLike(product.id)} sale />)}</div>
          </div>
        </section>

        <section className="recommend-section container" id="home">
          <div className="section-heading"><div><span className="section-kicker">Dành riêng cho bạn</span><h2>Gợi ý mua sắm</h2></div><div className="filter-actions"><button className="filter-chip active">Phù hợp nhất</button><button className="filter-chip">Bán chạy</button><button className="filter-chip"><SlidersHorizontal size={15} /> Bộ lọc</button></div></div>
          <div className="product-grid">{filteredProducts.map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} liked={liked.includes(product.id)} onLike={() => toggleLike(product.id)} />)}</div>
          {filteredProducts.length === 0 && <div className="empty-search"><Search size={24} /> Không tìm thấy sản phẩm phù hợp với “{search}”.</div>}
          <button className="load-more">Xem thêm sản phẩm <ChevronDown size={17} /></button>
        </section>

        <section className="benefits container"><div><MapPin size={22} /><span><strong>Giao hàng tận nơi</strong><small>Nhanh chóng, đúng hẹn</small></span></div><div><ShoppingBag size={22} /><span><strong>Mua sắm an tâm</strong><small>Đổi trả trong 30 ngày</small></span></div><div><Star size={22} /><span><strong>Chọn lọc chất lượng</strong><small>Người bán uy tín</small></span></div><div><Heart size={22} /><span><strong>Hỗ trợ tận tâm</strong><small>Luôn đồng hành cùng bạn</small></span></div></section>
      </main>

      <footer><div className="container footer-content"><div><a className="brand footer-brand" href="#top"><span className="brand-mark">N</span><span>NOVA<span className="brand-dot">.</span></span></a><p>Mỗi ngày một điều đáng mong chờ.</p></div><div className="footer-links"><a href="#about">Về NOVA</a><a href="#help">Trợ giúp</a><a href="#terms">Điều khoản</a><a href="#privacy">Bảo mật</a></div><small>© 2025 NOVA Market</small></div></footer>

      {cartOpen && <div className="drawer-backdrop" onClick={() => setCartOpen(false)}><aside className="cart-drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-header"><h2>Giỏ hàng <span>({cart.length})</span></h2><button onClick={() => setCartOpen(false)} aria-label="Đóng"><X size={21} /></button></div>{cart.length === 0 ? <div className="empty-cart"><ShoppingBag size={38} /><h3>Giỏ hàng đang trống</h3><p>Thêm món đồ đầu tiên để bắt đầu hành trình của bạn.</p></div> : <><div className="cart-items">{cart.map((product, index) => <div className="cart-item" key={`${product.id}-${index}`}><img src={product.image} alt="" /><div><strong>{product.name}</strong><span>{formatPrice(product.price)}</span></div></div>)}</div><div className="cart-total"><span>Tạm tính</span><strong>{formatPrice(total)}</strong></div><button className="primary-button checkout-button">Tiến hành thanh toán <ArrowRight size={17} /></button></>}</aside></div>}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onSignedIn={() => setAuthOpen(false)} />}
      {profileOpen && <ProfileModal profile={userProfile} firebaseUser={currentUser} onClose={() => setProfileOpen(false)} onSignOut={() => { setProfileOpen(false); signOut(auth) }} />}
    </div>
  )
}

function ProductCard({ product, onAdd, liked, onLike, sale = false }) {
  return <article className={`product-card ${sale ? 'sale-card' : ''}`}><div className={`product-image ${product.tone}`}><img src={product.image} alt={product.name} /><span className="product-badge">{product.badge}</span><button className={`like-button ${liked ? 'liked' : ''}`} onClick={onLike} aria-label="Yêu thích"><Heart size={17} fill={liked ? 'currentColor' : 'none'} /></button>{sale && <span className="deal-label"><Clock3 size={12} /> Còn 2h</span>}</div><div className="product-info"><div className="rating"><Star size={13} fill="currentColor" /> {product.rating} <span>·</span> Đã bán {product.sold}</div><h3>{product.name}</h3><div className="price-row"><strong>{formatPrice(product.price)}</strong><del>{formatPrice(product.oldPrice)}</del></div><div className="product-bottom"><span className="shipping">Freeship</span><button className="add-button" onClick={() => onAdd(product)} aria-label={`Thêm ${product.name} vào giỏ`}><ShoppingBag size={16} /></button></div></div></article>
}

function AuthModal({ onClose, onSignedIn }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, form.email)
        setError('Đã gửi email đặt lại mật khẩu. Hãy kiểm tra hộp thư và cả thư mục Spam.')
        setLoading(false)
        return
      }

      if (mode === 'register') {
        const credential = await createUserWithEmailAndPassword(auth, form.email, form.password)
        await setDoc(doc(db, 'users', credential.user.uid), {
          userId: credential.user.uid,
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          role: 'customer',
          createdAt: serverTimestamp(),
        })
      } else {
        await signInWithEmailAndPassword(auth, form.email, form.password)
      }
      onSignedIn()
    } catch (authError) {
      const messages = {
        'auth/email-already-in-use': 'Email này đã được đăng ký.',
        'auth/invalid-credential': 'Email hoặc mật khẩu không đúng.',
        'auth/weak-password': 'Mật khẩu cần có ít nhất 6 ký tự.',
        'auth/invalid-email': 'Email không hợp lệ.',
        'auth/operation-not-allowed': 'Firebase chưa bật đăng nhập Email/Password. Hãy bật tại Authentication → Sign-in method.',
        'auth/unauthorized-domain': 'Tên miền hiện tại chưa được thêm vào Firebase Authentication → Settings → Authorized domains.',
        'permission-denied': 'Firestore đang từ chối ghi hồ sơ user. Hãy triển khai firestore.rules hoặc kiểm tra quyền database.',
        'auth/user-not-found': 'Không tìm thấy tài khoản với email này.',
      }
      setError(messages[authError.code] || 'Có lỗi xảy ra. Hãy kiểm tra Firebase Authentication đã bật Email/Password chưa.')
    } finally {
      setLoading(false)
    }
  }

  const isForgot = mode === 'forgot'
  return <div className="auth-backdrop" onClick={onClose}><section className="auth-modal" onClick={(event) => event.stopPropagation()}><button className="auth-close" onClick={onClose} aria-label="Đóng"><X size={20} /></button><div className="auth-brand"><span className="brand-mark">N</span><span>NOVA<span className="brand-dot">.</span></span></div><span className="section-kicker">{isForgot ? 'Khôi phục tài khoản' : 'Chào mừng bạn'}</span><h2>{mode === 'login' ? 'Đăng nhập để tiếp tục' : mode === 'register' ? 'Tạo tài khoản NOVA' : 'Quên mật khẩu?'}</h2><p className="auth-subtitle">{mode === 'login' ? 'Lưu sản phẩm yêu thích và theo dõi đơn hàng dễ dàng.' : mode === 'register' ? 'Tham gia cộng đồng mua sắm và trải nghiệm của NOVA.' : 'Nhập email đã đăng ký. Firebase sẽ gửi link an toàn để tạo mật khẩu mới.'}</p><form onSubmit={submit}>{mode === 'register' && <><label>Họ và tên<input name="name" value={form.name} onChange={updateField} placeholder="Nguyễn Văn A" required /></label><label>Số điện thoại<input name="phone" value={form.phone} onChange={updateField} placeholder="0901 234 567" type="tel" required /></label></>}<label>Email<input name="email" value={form.email} onChange={updateField} placeholder="ban@email.com" type="email" required /></label>{!isForgot && <label>Mật khẩu<input name="password" value={form.password} onChange={updateField} placeholder="Tối thiểu 6 ký tự" type="password" minLength="6" required /></label>}{error && <div className={`auth-error ${isForgot && error.startsWith('Đã gửi') ? 'auth-success' : ''}`}>{error}</div>}<button className="primary-button auth-submit" disabled={loading}>{loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : mode === 'register' ? 'Đăng ký tài khoản' : 'Gửi email khôi phục'}</button></form><div className="auth-switch">{isForgot ? 'Nhớ mật khẩu rồi?' : mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'} <button onClick={() => { setError(''); setMode(isForgot || mode === 'register' ? 'login' : 'register') }}>{isForgot || mode === 'register' ? 'Đăng nhập' : 'Đăng ký ngay'}</button></div>{mode === 'login' && <button className="forgot-link" onClick={() => { setError(''); setMode('forgot') }}>Quên mật khẩu?</button>}<small className="auth-note">Mật khẩu được Firebase Authentication bảo vệ, không lưu trong bảng users.</small></section></div>
}

function ProfileModal({ profile, firebaseUser, onClose, onSignOut }) {
  return <div className="auth-backdrop" onClick={onClose}><section className="profile-modal" onClick={(event) => event.stopPropagation()}><button className="auth-close" onClick={onClose} aria-label="Đóng"><X size={20} /></button><div className="profile-avatar"><UserRound size={28} /></div><span className="section-kicker">Tài khoản của bạn</span><h2>{profile?.name || 'Thành viên NOVA'}</h2><p className="auth-subtitle">Thông tin cá nhân và quyền tài khoản</p><div className="profile-details"><div><small>Mã người dùng</small><strong>{profile?.userId || firebaseUser?.uid}</strong></div><div><small>Email</small><strong>{profile?.email || firebaseUser?.email}</strong></div><div><small>Số điện thoại</small><strong>{profile?.phone || 'Chưa cập nhật'}</strong></div><div><small>Vai trò</small><strong className="role-badge">{profile?.role || 'customer'}</strong></div></div><button className="logout-button" onClick={onSignOut}><LogOut size={16} /> Đăng xuất</button></section></div>
}

export default App
