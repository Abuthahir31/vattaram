import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaShoppingCart,
  FaUser,
  FaHeart,
  FaBars,
  FaTimes,
  FaChevronDown,
  FaHome,
  FaStore,
  FaBolt,
  FaTh,
  FaInfoCircle,
  FaPhone,
  FaTag,
  FaSignInAlt,
  FaSignOutAlt,
  FaEye,
  FaEyeSlash,
  FaRegUserCircle,
  FaGoogle,
  FaUserShield,
} from "react-icons/fa";
import { Button, Modal, Form, Alert, Spinner } from "react-bootstrap";
import "./Navbar.css";
import {
  auth,
  googleProvider,
} from "./firebase";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import PhoneVerification from "./components/PhoneVerification";

const ADMIN_EMAIL = "pcsoldiers0@gmail.com";

const Navbar = ({ cartItems, onSearch }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [categories, setCategories] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const accountDropdownRef = useRef(null);
  const categoriesDropdownRef = useRef(null);
  const searchResultsRef = useRef(null);
  const searchInputRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Handle hash-based scrolling
  useEffect(() => {
    const handleHashScroll = () => {
      if (location.hash) {
        const sectionId = location.hash.substring(1);
        const element = document.getElementById(sectionId);
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      }
    };
    handleHashScroll();
  }, [location]);

  // Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target)) {
        setAccountDropdownOpen(false);
      }
      if (categoriesDropdownRef.current && !categoriesDropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target)) {
        if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
          setShowSearchResults(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle auth state and fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/categories");
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const isAdminUser = user.email === ADMIN_EMAIL;
        setIsAuthenticated(true);
        setIsAdmin(isAdminUser);
        setUser({
          uid: user.uid,
          email: user.email || "",
          name: user.displayName || (user.email ? user.email.split("@")[0] : "User"),
          photo: user.photoURL || "https://randomuser.me/api/portraits/lego/1.jpg",
        });
        if (isAdminUser && location.pathname !== "/admin") {
          navigate("/admin");
        }
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, [navigate, location.pathname]);

  const scrollToSection = (sectionId) => {
    if (location.pathname === "/" || location.pathname === "/home") {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
      setMobileMenuOpen(false);
    } else {
      navigate(`/#${sectionId}`);
      setMobileMenuOpen(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
    setShowSearchResults(false);
  };

  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setShowSearchResults(query.trim() !== "");
  };

  const toggleDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDropdownOpen(!dropdownOpen);
    setAccountDropdownOpen(false);
  };

  const toggleAccountDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setAccountDropdownOpen(!accountDropdownOpen);
    setDropdownOpen(false);
  };

  const handleCategoryClick = (categoryName) => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate("/shop", {
      state: {
        filterType: "category",
        filterValue: categoryName,
      },
    });
  };

  const handleShowAuthModal = (mode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
    setAccountDropdownOpen(false);
  };

  const handleCloseAuthModal = () => {
    setShowAuthModal(false);
    setName("");
    setEmail("");
    setPassword("");
    setError("");
    setSuccess("");
    setShowPassword(false);
    setLoading(false);
    setAuthMode("login");
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const isAdminUser = user.email === ADMIN_EMAIL;
      setIsAdmin(isAdminUser);
      setSuccess(isAdminUser ? "Admin login successful!" : "Google Sign-In successful!");
      setIsAuthenticated(true);
      setUser({
        uid: user.uid,
        email: user.email || "",
        name: user.displayName || (user.email ? user.email.split("@")[0] : "User"),
        photo: user.photoURL || "https://randomuser.me/api/portraits/lego/1.jpg",
      });
      setTimeout(() => {
        handleCloseAuthModal();
        if (isAdminUser) {
          navigate("/admin");
        }
      }, 1000);
    } catch (err) {
      setError("Google Sign-In Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (!email.trim() || !password.trim()) {
        throw new Error("Please enter both email and password");
      }
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;
      const isAdminUser = user.email === ADMIN_EMAIL;
      setIsAdmin(isAdminUser);
      if (!user.emailVerified && !isAdminUser) {
        await signOut(auth);
        throw new Error("Email not verified. Please check your inbox for verification email.");
      }
      setSuccess(isAdminUser ? "Admin login successful!" : "Login successful!");
      setIsAuthenticated(true);
      setUser({
        uid: user.uid,
        email: user.email || "",
        name: user.displayName || (user.email ? user.email.split("@")[0] : "User"),
        photo: user.photoURL || "https://randomuser.me/api/portraits/lego/1.jpg",
      });
      setTimeout(() => {
        handleCloseAuthModal();
        if (isAdminUser) {
          navigate("/admin");
        }
      }, 1000);
    } catch (err) {
      setError("Login Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (!name || !email || !password) {
        throw new Error("Fill all fields");
      }
      if (!email.endsWith("@gmail.com")) {
        throw new Error("Only Gmail allowed");
      }
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      await sendEmailVerification(user);
      await signOut(auth);
      setSuccess("Verification email sent. Please check your Gmail inbox.");
      setTimeout(() => {
        setAuthMode("login");
        setEmail("");
        setPassword("");
      }, 1500);
    } catch (err) {
      setError("Registration failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setUser(null);
      setAccountDropdownOpen(false);
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handlePhoneVerificationSuccess = (phone) => {
    setSuccess('Phone verification successful!');
    setIsAuthenticated(true);
    setUser({
      uid: 'phone-user-' + Math.random().toString(36).substring(2),
      phone: phone,
      name: phone, // Use phone as display name
      photo: 'https://randomuser.me/api/portraits/lego/1.jpg',
    });
    setTimeout(() => {
      handleCloseAuthModal();
    }, 1000);
  };

  const shouldShowFullNav = location.pathname === "/" || location.pathname === "/home";

  return (
    <>
      <div className="announcement-bar bg-dark text-white py-2">
        <div className="container text-center">
          <p className="mb-0">Free shipping on orders over ₹500 | Use code <strong>SOUTHBAY10</strong> for 10% off</p>
        </div>
      </div>
      <header className={`header ${isScrolled ? "scrolled" : ""}`}>
        <div className="container">
          <div className="header-top py-3 d-flex align-items-center">
            <div className="mobile-menu-toggle d-lg-none me-3" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </div>
            <Link className="nav-link d-flex align-items-center" to="/" onClick={() => setMobileMenuOpen(false)}>
              <FaHome className="me-2 nav-icon" />
            </Link>
            <div className="logo me-auto ms-3 ms-lg-0">
              <Link to="/" className="text-decoration-none">
                <img
                  src="/images/logo.jpg"
                  alt="Vattaram - The Best of South"
                  style={{
                    height: "50px",
                    width: "auto",
                    maxWidth: "100%",
                    objectFit: "contain",
                  }}
                />
              </Link>
            </div>
            <div className="search-bar mx-3 d-none d-lg-block flex-grow-1 position-relative">
              <form className="d-flex" onSubmit={handleSearch}>
                <input
                  ref={searchInputRef}
                  type="text"
                  className="form-control rounded-0 rounded-start"
                  placeholder="Search for products..."
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={() => searchQuery && setShowSearchResults(true)}
                />
                <button className="btn btn-danger rounded-0 rounded-end" type="submit">
                  <FaSearch />
                </button>
              </form>
              {showSearchResults && (
                <div
                  ref={searchResultsRef}
                  className="search-results-dropdown shadow-sm"
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    backgroundColor: "white",
                    border: "1px solid #ddd",
                    borderRadius: "0 0 4px 4px",
                    maxHeight: "300px",
                    overflowY: "auto",
                  }}
                >
                  <div className="p-2 text-muted">Type and press enter to search</div>
                </div>
              )}
            </div>
            <div className="user-actions d-flex align-items-center ms-auto">
              <div className="account-dropdown position-relative me-2 me-lg-3" ref={accountDropdownRef}>
                <button
                  className="btn btn-link text-dark text-decoration-none p-0 account-dropdown-toggle"
                  onClick={toggleAccountDropdown}
                  aria-expanded={accountDropdownOpen}
                >
                  {isAuthenticated && user ? (
                    <img
                      src={user.photo}
                      alt="Profile"
                      className="rounded-circle"
                      style={{ width: "32px", height: "32px", objectFit: "cover" }}
                    />
                  ) : (
                    <FaRegUserCircle size={24} />
                  )}
                </button>
                {accountDropdownOpen && (
                  <div
                    className="dropdown-menu show"
                    style={{
                      minWidth: "200px",
                      position: "absolute",
                      right: "0",
                      left: "auto",
                      zIndex: 1000,
                      marginTop: "0.5rem",
                    }}
                  >
                    {isAuthenticated ? (
                      <>
                        <div className="dropdown-header px-3 py-2 border-bottom">
                          <div className="d-flex align-items-center">
                            <img
                              src={user.photo}
                              alt="Profile"
                              className="rounded-circle me-2"
                              style={{ width: "40px", height: "40px", objectFit: "cover" }}
                            />
                            <div>
                              <h6 className="mb-0">
                                {user.phone ? user.phone : user.name}
                                {isAdmin && <span className="badge bg-danger ms-2">Admin</span>}
                              </h6>
                              <small className="text-muted">{user.email || user.phone || "User"}</small>
                            </div>
                          </div>
                        </div>
                        {isAdmin && (
                          <Link
                            to="/admin"
                            className="dropdown-item d-flex align-items-center"
                            onClick={() => setAccountDropdownOpen(false)}
                          >
                            <FaUserShield className="me-2" /> Admin Dashboard
                          </Link>
                        )}
                        <Link
                          to="/wishlist"
                          className="dropdown-item d-flex align-items-center"
                          onClick={() => setAccountDropdownOpen(false)}
                        >
                          <FaHeart className="me-2" /> My Wishlist
                        </Link>
                        <Link
                          to="/orders"
                          className="dropdown-item d-flex align-items-center"
                          onClick={() => setAccountDropdownOpen(false)}
                        >
                          <FaShoppingCart className="me-2" /> My Orders
                        </Link>
                        <div className="dropdown-divider"></div>
                        <button
                          className="dropdown-item d-flex align-items-center text-danger"
                          onClick={handleLogout}
                        >
                          <FaSignOutAlt className="me-2" /> Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="dropdown-header px-3 py-2">
                          <h6 className="mb-0">Welcome Guest</h6>
                          <small className="text-muted">Login to access your account</small>
                        </div>
                        <button
                          className="dropdown-item d-flex align-items-center"
                          onClick={() => handleShowAuthModal("login")} // Ensure this line uses the correct function
                        >
                          <FaSignInAlt className="me-2" /> Login / Register
                        </button>
                        <Link
                          to="/wishlist"
                          className="dropdown-item d-flex align-items-center"
                          onClick={() => setAccountDropdownOpen(false)}
                        >
                          <FaHeart className="me-2" /> Wishlist
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
              <Link to="/cart" className="text-decoration-none">
                <button className="btn btn-link text-dark text-decoration-none mx-2 position-relative">
                  <div className="d-flex flex-column align-items-center">
                    <FaShoppingCart size={20} className="icon-hover-effect" />
                    <span className="small d-none d-md-block">Cart {cartItems}</span>
                  </div>
                  {cartItems > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {cartItems}
                    </span>
                  )}
                </button>
              </Link>
            </div>
          </div>
          <div className="mobile-search d-lg-none py-2 position-relative">
            <form className="d-flex" onSubmit={handleSearch}>
              <input
                ref={searchInputRef}
                type="text"
                className="form-control rounded-0 rounded-start"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={handleSearchInputChange}
                onFocus={() => searchQuery && setShowSearchResults(true)}
              />
              <button className="btn btn-danger rounded-0 rounded-end" type="submit">
                <FaSearch />
              </button>
            </form>
            {showSearchResults && (
              <div
                ref={searchResultsRef}
                className="search-results-dropdown shadow-sm"
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  zIndex: 1000,
                  backgroundColor: "white",
                  border: "1px solid #ddd",
                  borderRadius: "0 0 4px 4px",
                  maxHeight: "300px",
                  overflowY: "auto",
                }}
              >
                <div className="p-2 text-muted">Type and press enter to search</div>
              </div>
            )}
          </div>
          {shouldShowFullNav && (
            <nav className={`main-nav navbar navbar-expand-lg ${mobileMenuOpen ? "show" : ""}`}>
              <div className="container-fluid px-0">
                <div className={`navbar-collapse ${mobileMenuOpen ? "show" : "collapse"}`}>
                  <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                    <li className="nav-item">
                      <Link
                        className="nav-link d-flex align-items-center"
                        to="/shop"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <FaStore className="me-2 nav-icon" />
                        Shop
                      </Link>
                    </li>
                    <li className="nav-item">
                      <button
                        className="nav-link d-flex align-items-center border-0 bg-transparent"
                        onClick={() => scrollToSection("deals")}
                      >
                        <FaBolt className="me-2 nav-icon" />
                        Deals
                      </button>
                    </li>
                    <li className={`nav-item dropdown ${dropdownOpen ? "show" : ""}`} ref={categoriesDropdownRef}>
                      <a
                        className="nav-link d-flex align-items-center dropdown-toggle"
                        href="#"
                        onClick={toggleDropdown}
                        role="button"
                        aria-expanded={dropdownOpen}
                      >
                        <FaTh className="me-2 nav-icon" />
                        Categories
                        <FaChevronDown
                          className={`ms-1 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                          size={12}
                        />
                      </a>
                      <ul
                        className={`dropdown-menu ${dropdownOpen ? "show" : ""}`}
                        style={{
                          position: window.innerWidth <= 992 ? "static" : "absolute",
                          zIndex: 1000,
                        }}
                      >
                        {categories.length > 0 ? (
                          categories.map((category, index) => (
                            <li key={`category-${category.name}-${index}`}>
                              <button
                                className="dropdown-item d-flex align-items-center"
                                onClick={() => handleCategoryClick(category.name)}
                              >
                                <FaTag className="me-2" size={14} />
                                {category.name}
                              </button>
                            </li>
                          ))
                        ) : (
                          <li>
                            <span className="dropdown-item text-muted">Loading categories...</span>
                          </li>
                        )}
                      </ul>
                    </li>
                    <li className="nav-item">
                      <button
                        className="nav-link d-flex align-items-center border-0 bg-transparent"
                        onClick={() => scrollToSection("about")}
                      >
                        <FaInfoCircle className="me-2 nav-icon" />
                        About Us
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className="nav-link d-flex align-items-center border-0 bg-transparent"
                        onClick={() => scrollToSection("contact")}
                      >
                        <FaPhone className="me-2 nav-icon" />
                        Contact
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </nav>
          )}
        </div>
      </header>
      <Modal show={showAuthModal} onHide={handleCloseAuthModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {authMode === "login" ? "Login" : authMode === "register" ? "Register" : "Phone Login"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          {authMode === "login" && (
            <Form onSubmit={handleLogin}>
              <Form.Group className="mb-3" controlId="formBasicEmail">
                <Form.Label>Email Address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formBasicPassword">
                <Form.Label>Password</Form.Label>
                <div style={{ position: "relative" }}>
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    style={{ paddingRight: "40px" }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                      zIndex: 1,
                    }}
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </div>
                </div>
              </Form.Group>
              <div className="d-grid gap-2 mb-3">
                <Button
                  variant="primary"
                  type="submit"
                  disabled={loading}
                  className="d-flex align-items-center justify-content-center"
                >
                  {loading && <Spinner animation="border" size="sm" className="me-2" />}
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </div>
              <div className="text-center mb-3">
                <p className="mb-1">or</p>
                <p className="mb-1">Continue with</p>
                <div className="d-flex justify-content-center gap-3 mt-2">
                  <img
                    src="https://www.citypng.com/public/uploads/preview/google-logo-icon-gsuite-hd-701751694791470gzbayltphh.png"
                    onClick={signInWithGoogle}
                    alt="Google Sign In"
                    style={{
                      cursor: "pointer",
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                    }}
                  />
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/724/724664.png"
                    onClick={() => setAuthMode("phone")}
                    alt="Phone Sign In"
                    style={{
                      cursor: "pointer",
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                    }}
                  />
                </div>
              </div>
              <div className="text-center">
                <p className="mb-1">
                  Don’t have an account?{" "}
                  <Button variant="link" onClick={() => setAuthMode("register")} className="p-0">
                    Register
                  </Button>
                </p>
              </div>
            </Form>
          )}

          {authMode === "register" && (
            <Form onSubmit={handleRegister}>
              <Form.Group className="mb-3" controlId="formBasicName">
                <Form.Label>Full Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formBasicEmail">
                <Form.Label>Email Address (Gmail only)</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter your Gmail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formBasicPassword">
                <Form.Label>Password</Form.Label>
                <div style={{ position: "relative" }}>
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password (min 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength="6"
                    disabled={loading}
                    style={{ paddingRight: "40px" }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                      zIndex: 1,
                    }}
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </div>
                </div>
              </Form.Group>
              <div className="d-grid gap-2">
                <Button
                  variant="primary"
                  type="submit"
                  disabled={loading}
                  className="d-flex align-items-center justify-content-center"
                >
                  {loading && <Spinner animation="border" size="sm" className="me-2" />}
                  {loading ? "Registering..." : "Register"}
                </Button>
              </div>
              <div className="mt-3 text-center">
                <p className="mb-1">
                  Already have an account?{" "}
                  <Button variant="link" onClick={() => setAuthMode("login")} className="p-0">
                    Login
                  </Button>
                </p>
              </div>
            </Form>
          )}

          {authMode === "phone" && (
            <div>
              <PhoneVerification onSuccess={handlePhoneVerificationSuccess} />
              <div className="text-center mt-3">
                <Button variant="link" onClick={() => setAuthMode("login")} className="p-0">
                  Back to Email Login
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default Navbar;