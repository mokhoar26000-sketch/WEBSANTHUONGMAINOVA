import { useEffect, useMemo, useState } from 'react'
import { collection, doc, getDocs, getDoc, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore'
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
const appBasePath = import.meta.env.BASE_URL.replace(/\/$/, '')
const appHomePath = import.meta.env.BASE_URL

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
  const [shopOpen, setShopOpen] = useState(false)
  const [productOpen, setProductOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    if (!auth) return undefined

    return onAuthStateChanged(auth, async (firebaseUser) => {
    setCurrentUser(firebaseUser)
    if (!firebaseUser) {
      setUserProfile(null)
      setAuthReady(true)
      return
    }

    const profile = await getDoc(doc(db, 'users', firebaseUser.uid))
    if (profile.exists() && profile.data().status === 'blocked') {
      setUserProfile(null)
      await signOut(auth)
      setAuthReady(true)
      return
    }
    setUserProfile(profile.exists() ? profile.data() : null)
    setAuthReady(true)
    })
  }, [])

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

  if (window.location.pathname.replace(/\/+$/, '') === `${appBasePath}/admin` || (appBasePath === '' && window.location.pathname.replace(/\/+$/, '') === '/admin')) {
    if (!authReady) return <div className="admin-loading">Đang kiểm tra quyền truy cập...</div>
    if (!currentUser || !userProfile) return <AdminAccessDenied onBack={() => window.location.assign(appHomePath)} />
    if (userProfile.role !== 'admin') return <AdminAccessDenied onBack={() => window.location.assign(appHomePath)} />
    return <AdminWorkspace onClose={() => window.location.assign(appHomePath)} />
  }

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
          {currentUser && userProfile?.role !== 'shop' && userProfile?.role !== 'admin' && <button className="seller-link nav-button" onClick={() => setShopOpen(true)}>Đăng ký bán hàng <ArrowRight size={14} /></button>}
          {userProfile?.role === 'shop' && <button className="seller-link nav-button" onClick={() => setProductOpen(true)}>Sản phẩm của tôi <ArrowRight size={14} /></button>}
          {userProfile?.role === 'admin' && <a className="seller-link" href={`${import.meta.env.BASE_URL}admin`}>Quản lý <ArrowRight size={14} /></a>}
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
      {shopOpen && <ShopRegistrationModal currentUser={currentUser} profile={userProfile} onClose={() => setShopOpen(false)} />}
      {productOpen && <ProductManager currentUser={currentUser} onClose={() => setProductOpen(false)} />}
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

function ShopRegistrationModal({ currentUser, profile, onClose }) {
  const [form, setForm] = useState({ shopName: '', description: '', phone: '', address: '' })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const shopRef = doc(collection(db, 'shops'))
      await setDoc(shopRef, {
        shopId: shopRef.id,
        userId: currentUser.uid,
        shopName: form.shopName.trim(),
        description: form.description.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
      })
      setMessage('Đã gửi hồ sơ. Admin sẽ kiểm tra và phản hồi cho bạn.')
    } catch (error) {
      setMessage(error.code === 'permission-denied' ? 'Bạn chưa được phép gửi hồ sơ shop. Hãy triển khai firestore.rules mới.' : 'Không thể gửi hồ sơ lúc này.')
    } finally {
      setLoading(false)
    }
  }

  return <div className="auth-backdrop" onClick={onClose}><section className="auth-modal shop-registration-modal" onClick={(event) => event.stopPropagation()}><button className="auth-close" onClick={onClose} aria-label="Đóng"><X size={20} /></button><div className="auth-brand"><span className="brand-mark">N</span><span>NOVA<span className="brand-dot">.</span></span></div><span className="section-kicker">Kênh người bán</span><h2>Đăng ký mở shop</h2><p className="auth-subtitle">Hồ sơ sẽ ở trạng thái chờ duyệt. Chỉ admin mới có quyền phê duyệt shop.</p><form onSubmit={submit}><label>Tên shop<input value={form.shopName} onChange={(event) => setForm({ ...form, shopName: event.target.value })} placeholder="Shop Gia Dụng HomeCare" required /></label><label>Mô tả shop<input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Bạn kinh doanh mặt hàng gì?" required /></label><label>Số điện thoại<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="0901 234 567" type="tel" required /></label><label>Địa chỉ lấy hàng<input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="Địa chỉ shop" required /></label>{message && <div className={`auth-error ${message.startsWith('Đã gửi') ? 'auth-success' : ''}`}>{message}</div>}<button className="primary-button auth-submit" disabled={loading}>{loading ? 'Đang gửi...' : 'Gửi hồ sơ xét duyệt'}</button></form><small className="auth-note">Tài khoản: {profile?.email || currentUser?.email}</small></section></div>
}

function ProductManager({ currentUser, onClose }) {
  const [shop, setShop] = useState(null)
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({ name: '', category: 'thời trang', price: '', description: '', stock: '', imageUrl: '', sourceUrl: '' })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const loadProducts = async () => {
    try {
      const shopSnapshot = await getDocs(collection(db, 'shops'))
      const currentShop = shopSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })).find((item) => item.userId === currentUser.uid && item.status === 'active')
      if (!currentShop) {
        setMessage('Tài khoản chưa có shop được admin duyệt.')
        return
      }
      setShop(currentShop)
      const productSnapshot = await getDocs(collection(db, 'products'))
      setProducts(productSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })).filter((item) => item.shopId === currentShop.shopId))
    } catch (error) {
      setMessage('Không thể tải sản phẩm của shop.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProducts() }, [])

  const submit = async (event) => {
    event.preventDefault()
    if (!shop) return
    try {
      const productRef = doc(collection(db, 'products'))
      await setDoc(productRef, {
        productId: productRef.id,
        shopId: shop.shopId,
        shopAddress: shop.address,
        userId: currentUser.uid,
        productName: form.name.trim(),
        category: form.category,
        price: Number(form.price),
        description: form.description.trim(),
        stock: Number(form.stock),
        imageUrls: form.imageUrl.trim() ? [form.imageUrl.trim()] : [],
        sourceUrl: form.sourceUrl.trim(),
        sourcePlatform: form.sourceUrl.includes('shopee') ? 'shopee' : 'manual',
        affiliateUrl: '',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      setForm({ name: '', category: 'thời trang', price: '', description: '', stock: '', imageUrl: '', sourceUrl: '' })
      setMessage('Đã thêm sản phẩm vào shop.')
      await loadProducts()
    } catch (error) {
      setMessage(error.code === 'permission-denied' ? 'Shop chưa được admin duyệt hoặc rules chưa được cập nhật.' : 'Không thể thêm sản phẩm.')
    }
  }

  return <div className="auth-backdrop" onClick={onClose}><section className="product-manager" onClick={(event) => event.stopPropagation()}><div className="product-manager-header"><div><span className="section-kicker">Kênh người bán</span><h2>Quản lý sản phẩm</h2><p className="auth-subtitle">{shop?.shopName || 'Đang tải shop...'}</p></div><button className="auth-close" onClick={onClose} aria-label="Đóng"><X size={20} /></button></div><div className="affiliate-note"><strong>Nhập sản phẩm từ link Shopee</strong><span>Link chỉ được lưu làm nguồn tham khảo. Muốn tự lấy tên, giá, ảnh và tạo link hoa hồng cần kết nối Shopee Affiliate API chính thức.</span></div><form className="product-form" onSubmit={submit}><label>Tên sản phẩm<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label><label>Loại sản phẩm<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option>thời trang</option><option>đồ gia dụng</option><option>đồ điện tử</option><option>thực phẩm chức năng</option><option>đồ ăn</option><option>đồ chơi thú cưng</option><option>dụng cụ</option></select></label><label>Giá bán<input type="number" min="0" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required /></label><label>Số lượng<input type="number" min="0" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} required /></label><label className="wide-field">Chi tiết sản phẩm<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required /></label><label>Link hình ảnh<input type="url" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} placeholder="https://..." /></label><label>Link Shopee nguồn<input type="url" value={form.sourceUrl} onChange={(event) => setForm({ ...form, sourceUrl: event.target.value })} placeholder="https://shopee.vn/..." /></label><button className="primary-button product-submit" type="submit">Thêm sản phẩm</button></form>{message && <div className="auth-error auth-success">{message}</div>}<div className="shop-products"><h3>Sản phẩm của shop ({products.length})</h3>{loading ? <p className="admin-empty">Đang tải...</p> : products.length === 0 ? <p className="admin-empty">Shop chưa có sản phẩm.</p> : products.map((product) => <div className="admin-row" key={product.id}><div><strong>{product.productName}</strong><small>{product.category} · {formatPrice(Number(product.price || 0))} · Còn {product.stock}</small></div><span className="status-badge active">Đang bán</span></div>)}</div></section></div>
}

function AdminAccessDenied({ onBack }) {
  return <main className="admin-page"><div className="admin-empty admin-access"><h2>Không có quyền truy cập</h2><p>Trang này chỉ dành cho tài khoản admin.</p><button className="primary-button" onClick={onBack}>Về trang mua sắm</button></div></main>
}

function AdminPanel({ onClose }) {
  const [users, setUsers] = useState([])
  const [shops, setShops] = useState([])
  const [orders, setOrders] = useState([])
  const [carts, setCarts] = useState([])
  const [promotions, setPromotions] = useState([])
  const [promoForm, setPromoForm] = useState({ code: '', discount: '', expiresAt: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [userSnapshot, shopSnapshot, orderSnapshot, cartSnapshot, promotionSnapshot] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'shops')),
        getDocs(collection(db, 'orders')),
        getDocs(collection(db, 'carts')),
        getDocs(collection(db, 'promotions')),
      ])
      setUsers(userSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })))
      setShops(shopSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })))
      setOrders(orderSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })))
      setCarts(cartSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })))
      setPromotions(promotionSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })))
      setError('')
    } catch (loadError) {
      setError(loadError.code === 'permission-denied' ? 'Tài khoản hiện tại chưa có quyền admin hoặc thiếu rules cho dashboard.' : 'Không thể tải dữ liệu quản trị.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const approveShop = async (shop) => {
    try {
      const batch = writeBatch(db)
      batch.update(doc(db, 'shops', shop.id), { status: 'active', reviewedAt: serverTimestamp() })
      batch.update(doc(db, 'users', shop.userId), { role: 'shop', updatedAt: serverTimestamp() })
      await batch.commit()
      await loadData()
    } catch (approveError) { setError('Không thể duyệt shop.') }
  }

  const rejectShop = async (shop) => {
    try { await updateDoc(doc(db, 'shops', shop.id), { status: 'rejected', reviewedAt: serverTimestamp() }); await loadData() } catch (rejectError) { setError('Không thể từ chối hồ sơ shop.') }
  }

  const toggleUser = async (user) => {
    if (user.role === 'admin') return
    try { await updateDoc(doc(db, 'users', user.id), { status: user.status === 'blocked' ? 'active' : 'blocked', updatedAt: serverTimestamp() }); await loadData() } catch (toggleError) { setError('Không thể cập nhật trạng thái tài khoản.') }
  }

  const promoteUser = async (user) => {
    try { await updateDoc(doc(db, 'users', user.id), { role: 'shop', updatedAt: serverTimestamp() }); await loadData() } catch (promoteError) { setError('Không thể nâng tài khoản lên shop.') }
  }

  const updateOrderStatus = async (order, status) => {
    try { await updateDoc(doc(db, 'orders', order.id), { status, updatedAt: serverTimestamp() }); await loadData() } catch (orderError) { setError('Không thể cập nhật đơn hàng.') }
  }

  const createPromotion = async (event) => {
    event.preventDefault()
    try {
      const promotionRef = doc(collection(db, 'promotions'))
      await setDoc(promotionRef, { promotionId: promotionRef.id, code: promoForm.code.trim().toUpperCase(), discount: Number(promoForm.discount), expiresAt: promoForm.expiresAt, status: 'active', createdAt: serverTimestamp() })
      setPromoForm({ code: '', discount: '', expiresAt: '' })
      await loadData()
    } catch (promotionError) { setError('Không thể tạo khuyến mãi.') }
  }

  const togglePromotion = async (promotion) => {
    try { await updateDoc(doc(db, 'promotions', promotion.id), { status: promotion.status === 'active' ? 'inactive' : 'active', updatedAt: serverTimestamp() }); await loadData() } catch (promotionError) { setError('Không thể cập nhật khuyến mãi.') }
  }

  const currentMonth = new Date()
  const monthlyRevenue = orders.reduce((total, order) => {
    const createdAt = order.createdAt?.toDate ? order.createdAt.toDate() : order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000) : null
    if (!createdAt || createdAt.getFullYear() !== currentMonth.getFullYear() || createdAt.getMonth() !== currentMonth.getMonth() || order.status === 'cancelled') return total
    return total + Number(order.total || 0)
  }, 0)

  return <main className="admin-page"><div className="admin-page-inner"><div className="admin-header"><div><span className="section-kicker">Quản trị hệ thống</span><h2>Dashboard admin</h2><p className="admin-subtitle">Quản lý toàn bộ vận hành của NOVA Market.</p></div><button className="outline-button" onClick={onClose}><ArrowRight size={15} /> Về trang mua sắm</button></div>{error && <div className="auth-error">{error}</div>}{loading ? <p className="admin-empty">Đang tải dữ liệu...</p> : <><div className="admin-stats"><div><strong>{formatPrice(monthlyRevenue)}</strong><span>Doanh thu tháng này</span></div><div><strong>{orders.length}</strong><span>Đơn hàng</span></div><div><strong>{carts.length}</strong><span>Giỏ hàng đang lưu</span></div><div><strong>{users.length}</strong><span>Tài khoản</span></div><div><strong>{shops.filter((shop) => shop.status === 'pending').length}</strong><span>Shop chờ duyệt</span></div><div><strong>{promotions.filter((promotion) => promotion.status === 'active').length}</strong><span>Khuyến mãi hoạt động</span></div></div><div className="admin-section"><div className="admin-section-title"><h3>Đơn hàng</h3><button className="outline-button" onClick={loadData}>Làm mới</button></div>{orders.length === 0 ? <p className="admin-empty">Chưa có đơn hàng.</p> : <div className="admin-list">{orders.slice(0, 20).map((order) => <div className="admin-row" key={order.id}><div><strong>#{order.id}</strong><small>Khách: {order.userId || 'Chưa có'} · {formatPrice(Number(order.total || 0))}</small></div><select className="admin-select" value={order.status || 'pending'} onChange={(event) => updateOrderStatus(order, event.target.value)}><option value="pending">Chờ xử lý</option><option value="paid">Đã thanh toán</option><option value="shipping">Đang giao</option><option value="completed">Hoàn tất</option><option value="cancelled">Đã hủy</option></select></div>)}</div>}</div><div className="admin-section"><div className="admin-section-title"><h3>Hồ sơ đăng ký shop</h3></div>{shops.length === 0 ? <p className="admin-empty">Chưa có hồ sơ đăng ký shop.</p> : <div className="admin-list">{shops.map((shop) => <div className="admin-row" key={shop.id}><div><strong>{shop.shopName}</strong><small>{shop.description} · Chủ shop: {shop.userId}</small></div><div className="admin-row-actions"><span className={`status-badge ${shop.status}`}>{shop.status === 'pending' ? 'Chờ duyệt' : shop.status === 'active' ? 'Đã duyệt' : 'Từ chối'}</span>{shop.status === 'pending' && <><button className="approve-button" onClick={() => approveShop(shop)}>Duyệt</button><button className="reject-button" onClick={() => rejectShop(shop)}>Từ chối</button></>}</div></div>)}</div>}</div><div className="admin-section"><div className="admin-section-title"><h3>Quản lý account</h3><span className="admin-caption">Nâng customer thành shop hoặc vô hiệu hóa</span></div><div className="admin-list">{users.map((user) => <div className="admin-row" key={user.id}><div><strong>{user.name || 'Chưa có tên'}</strong><small>{user.email} · {user.phone || 'Chưa có SĐT'}</small></div><div className="admin-row-actions"><span className="role-badge">{user.role || 'customer'}</span>{user.role === 'customer' && <button className="approve-button" onClick={() => promoteUser(user)}>Nâng lên shop</button>}{user.role !== 'admin' && <button className="reject-button" onClick={() => toggleUser(user)}>{user.status === 'blocked' ? 'Mở khóa' : 'Vô hiệu hóa'}</button>}</div></div>)}</div></div><div className="admin-section"><div className="admin-section-title"><h3>Khuyến mãi</h3><span className="admin-caption">Tạo và bật/tắt mã giảm giá</span></div><form className="promotion-form" onSubmit={createPromotion}><input value={promoForm.code} onChange={(event) => setPromoForm({ ...promoForm, code: event.target.value })} placeholder="Mã, ví dụ NOVA10" required /><input value={promoForm.discount} onChange={(event) => setPromoForm({ ...promoForm, discount: event.target.value })} type="number" min="1" placeholder="Giảm %" required /><input value={promoForm.expiresAt} onChange={(event) => setPromoForm({ ...promoForm, expiresAt: event.target.value })} type="date" required /><button className="primary-button" type="submit">Tạo khuyến mãi</button></form><div className="admin-list">{promotions.map((promotion) => <div className="admin-row" key={promotion.id}><div><strong>{promotion.code} · Giảm {promotion.discount}%</strong><small>Hết hạn: {promotion.expiresAt || 'Không có'}</small></div><button className={promotion.status === 'active' ? 'approve-button' : 'reject-button'} onClick={() => togglePromotion(promotion)}>{promotion.status === 'active' ? 'Đang bật' : 'Đã tắt'}</button></div>)}</div></div></>}</div></main>
}

function ProfileModal({ profile, firebaseUser, onClose, onSignOut }) {
  return <div className="auth-backdrop" onClick={onClose}><section className="profile-modal" onClick={(event) => event.stopPropagation()}><button className="auth-close" onClick={onClose} aria-label="Đóng"><X size={20} /></button><div className="profile-avatar"><UserRound size={28} /></div><span className="section-kicker">Tài khoản của bạn</span><h2>{profile?.name || 'Thành viên NOVA'}</h2><p className="auth-subtitle">Thông tin cá nhân và quyền tài khoản</p><div className="profile-details"><div><small>Mã người dùng</small><strong>{profile?.userId || firebaseUser?.uid}</strong></div><div><small>Email</small><strong>{profile?.email || firebaseUser?.email}</strong></div><div><small>Số điện thoại</small><strong>{profile?.phone || 'Chưa cập nhật'}</strong></div><div><small>Vai trò</small><strong className="role-badge">{profile?.role || 'customer'}</strong></div></div><button className="logout-button" onClick={onSignOut}><LogOut size={16} /> Đăng xuất</button></section></div>
}

function AdminWorkspace({ onClose }) {
  const [activeView, setActiveView] = useState('overview')
  const [users, setUsers] = useState([])
  const [shops, setShops] = useState([])
  const [orders, setOrders] = useState([])
  const [carts, setCarts] = useState([])
  const [promotions, setPromotions] = useState([])
  const [promoForm, setPromoForm] = useState({ code: '', discount: '', expiresAt: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const snapshots = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'shops')),
        getDocs(collection(db, 'orders')),
        getDocs(collection(db, 'carts')),
        getDocs(collection(db, 'promotions')),
      ])
      setUsers(snapshots[0].docs.map((item) => ({ id: item.id, ...item.data() })))
      setShops(snapshots[1].docs.map((item) => ({ id: item.id, ...item.data() })))
      setOrders(snapshots[2].docs.map((item) => ({ id: item.id, ...item.data() })))
      setCarts(snapshots[3].docs.map((item) => ({ id: item.id, ...item.data() })))
      setPromotions(snapshots[4].docs.map((item) => ({ id: item.id, ...item.data() })))
      setError('')
    } catch (loadError) {
      setError(loadError.code === 'permission-denied' ? 'Không đủ quyền đọc dữ liệu quản trị.' : 'Không thể tải dữ liệu quản trị.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const approveShop = async (shop) => {
    try {
      const batch = writeBatch(db)
      batch.update(doc(db, 'shops', shop.id), { status: 'active', reviewedAt: serverTimestamp() })
      batch.update(doc(db, 'users', shop.userId), { role: 'shop', updatedAt: serverTimestamp() })
      await batch.commit()
      await loadData()
    } catch (actionError) { setError('Không thể duyệt shop.') }
  }

  const updateUser = async (user, changes) => {
    try { await updateDoc(doc(db, 'users', user.id), { ...changes, updatedAt: serverTimestamp() }); await loadData() } catch (actionError) { setError('Không thể cập nhật account.') }
  }

  const updateOrder = async (order, status) => {
    try { await updateDoc(doc(db, 'orders', order.id), { status, updatedAt: serverTimestamp() }); await loadData() } catch (actionError) { setError('Không thể cập nhật đơn hàng.') }
  }

  const createPromotion = async (event) => {
    event.preventDefault()
    try {
      const promotionRef = doc(collection(db, 'promotions'))
      await setDoc(promotionRef, { promotionId: promotionRef.id, code: promoForm.code.trim().toUpperCase(), discount: Number(promoForm.discount), expiresAt: promoForm.expiresAt, status: 'active', createdAt: serverTimestamp() })
      setPromoForm({ code: '', discount: '', expiresAt: '' })
      await loadData()
    } catch (actionError) { setError('Không thể tạo khuyến mãi.') }
  }

  const currentMonth = new Date()
  const monthlyRevenue = orders.reduce((total, order) => {
    const createdAt = order.createdAt?.toDate ? order.createdAt.toDate() : order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000) : null
    if (!createdAt || createdAt.getFullYear() !== currentMonth.getFullYear() || createdAt.getMonth() !== currentMonth.getMonth() || order.status === 'cancelled') return total
    return total + Number(order.total || 0)
  }, 0)

  const viewTitles = { orders: 'Quản lý đơn hàng', carts: 'Theo dõi giỏ hàng', promotions: 'Quản lý khuyến mãi' }
  return <main className="admin-page"><div className="admin-page-inner"><header className="admin-workspace-header"><div><span className="section-kicker">NOVA Market Admin</span><h2>{activeView === 'overview' ? 'Tổng quan vận hành' : viewTitles[activeView]}</h2><p className="admin-subtitle">Quản trị sàn thương mại điện tử</p></div><div className="admin-header-actions"><button className="outline-button" onClick={loadData}>Làm mới</button><button className="outline-button" onClick={onClose}><ArrowRight size={15} /> Về sàn</button></div></header>{error && <div className="auth-error">{error}</div>}{loading ? <p className="admin-empty">Đang tải dữ liệu...</p> : <div className="admin-layout"><aside className="admin-sidebar"><span className="admin-sidebar-label">Điều hành</span><button className={activeView === 'overview' ? 'admin-nav active' : 'admin-nav'} onClick={() => setActiveView('overview')}><Star size={16} /> Tổng quan</button><button className={activeView === 'orders' ? 'admin-nav active' : 'admin-nav'} onClick={() => setActiveView('orders')}><ShoppingBag size={16} /> Đơn hàng <b>{orders.length}</b></button><button className={activeView === 'carts' ? 'admin-nav active' : 'admin-nav'} onClick={() => setActiveView('carts')}><Heart size={16} /> Giỏ hàng <b>{carts.length}</b></button><button className={activeView === 'promotions' ? 'admin-nav active' : 'admin-nav'} onClick={() => setActiveView('promotions')}><Ticket size={16} /> Khuyến mãi <b>{promotions.filter((promotion) => promotion.status === 'active').length}</b></button></aside><section className="admin-content">{activeView === 'overview' && <><div className="admin-stats"><div><strong>{formatPrice(monthlyRevenue)}</strong><span>Doanh thu tháng này</span></div><div><strong>{users.length}</strong><span>Tổng account</span></div><div><strong>{shops.filter((shop) => shop.status === 'pending').length}</strong><span>Shop chờ duyệt</span></div><div><strong>{shops.filter((shop) => shop.status === 'active').length}</strong><span>Shop hoạt động</span></div></div><div className="admin-section"><div className="admin-section-title"><h3>Quản lý account</h3><span className="admin-caption">Nâng user lên shop hoặc vô hiệu hóa</span></div><div className="admin-list">{users.map((user) => <div className="admin-row" key={user.id}><div><strong>{user.name || 'Chưa có tên'}</strong><small>{user.email} · {user.phone || 'Chưa có SĐT'}</small></div><div className="admin-row-actions"><span className="role-badge">{user.role || 'customer'}</span>{user.role === 'customer' && <button className="approve-button" onClick={() => updateUser(user, { role: 'shop' })}>Nâng lên shop</button>}{user.role !== 'admin' && <button className="reject-button" onClick={() => updateUser(user, { status: user.status === 'blocked' ? 'active' : 'blocked' })}>{user.status === 'blocked' ? 'Mở khóa' : 'Vô hiệu hóa'}</button>}</div></div>)}</div></div><div className="admin-section"><div className="admin-section-title"><h3>Quản lý shop</h3><span className="admin-caption">Duyệt hồ sơ người bán</span></div><div className="admin-list">{shops.length === 0 ? <p className="admin-empty">Chưa có shop.</p> : shops.map((shop) => <div className="admin-row" key={shop.id}><div><strong>{shop.shopName}</strong><small>{shop.description} · Chủ: {shop.userId}</small></div><div className="admin-row-actions"><span className={`status-badge ${shop.status}`}>{shop.status === 'pending' ? 'Chờ duyệt' : shop.status === 'active' ? 'Đã duyệt' : 'Từ chối'}</span>{shop.status === 'pending' && <button className="approve-button" onClick={() => approveShop(shop)}>Duyệt</button>}</div></div>)}</div></div></>}{activeView === 'orders' && <div className="admin-section"><div className="admin-list">{orders.length === 0 ? <p className="admin-empty">Chưa có đơn hàng.</p> : orders.map((order) => <div className="admin-row" key={order.id}><div><strong>#{order.id}</strong><small>Khách: {order.userId || 'Chưa có'} · {formatPrice(Number(order.total || 0))}</small></div><select className="admin-select" value={order.status || 'pending'} onChange={(event) => updateOrder(order, event.target.value)}><option value="pending">Chờ xử lý</option><option value="paid">Đã thanh toán</option><option value="shipping">Đang giao</option><option value="completed">Hoàn tất</option><option value="cancelled">Đã hủy</option></select></div>)}</div></div>}{activeView === 'carts' && <div className="admin-section"><div className="admin-list">{carts.length === 0 ? <p className="admin-empty">Chưa có giỏ hàng đang lưu.</p> : carts.map((cart) => <div className="admin-row" key={cart.id}><div><strong>Giỏ hàng của {cart.userId}</strong><small>{Array.isArray(cart.items) ? `${cart.items.length} sản phẩm` : 'Chưa có sản phẩm'}</small></div><span className="status-badge active">Đang lưu</span></div>)}</div></div>}{activeView === 'promotions' && <div className="admin-section"><form className="promotion-form" onSubmit={createPromotion}><input value={promoForm.code} onChange={(event) => setPromoForm({ ...promoForm, code: event.target.value })} placeholder="Mã NOVA10" required /><input value={promoForm.discount} onChange={(event) => setPromoForm({ ...promoForm, discount: event.target.value })} type="number" min="1" placeholder="Giảm %" required /><input value={promoForm.expiresAt} onChange={(event) => setPromoForm({ ...promoForm, expiresAt: event.target.value })} type="date" required /><button className="primary-button" type="submit">Tạo khuyến mãi</button></form><div className="admin-list">{promotions.length === 0 ? <p className="admin-empty">Chưa có khuyến mãi.</p> : promotions.map((promotion) => <div className="admin-row" key={promotion.id}><div><strong>{promotion.code} · Giảm {promotion.discount}%</strong><small>Hết hạn: {promotion.expiresAt || 'Không có'}</small></div><button className={promotion.status === 'active' ? 'approve-button' : 'reject-button'} onClick={() => updateDoc(doc(db, 'promotions', promotion.id), { status: promotion.status === 'active' ? 'inactive' : 'active' }).then(loadData)}>{promotion.status === 'active' ? 'Đang bật' : 'Đã tắt'}</button></div>)}</div></div>}</section></div>}</div></main>
}

export default App
