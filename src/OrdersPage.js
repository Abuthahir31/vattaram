import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Button, 
  Badge, 
  Spinner, 
  Alert, 
  Dropdown, 
  Pagination,
  Card,
  ListGroup,
  Row,
  Col,
  Container
} from 'react-bootstrap';
import { 
  FaShoppingBag, 
  FaCalendarAlt, 
  FaTruck, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaFilter,
  FaChevronLeft,
  FaBox,
  FaRupeeSign,
  FaUser
} from 'react-icons/fa';
import Navbar from './navbar'; 
import './OrdersPage.css';
import { auth } from './firebase';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(5);
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();

  const statusBadge = {
    pending: 'warning',
    processing: 'info',
    shipped: 'primary',
    delivered: 'success',
    cancelled: 'danger'
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setAuthChecked(true);
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        const idToken = await user.getIdToken();
        const response = await fetch(`http://localhost:5000/api/orders?status=${filter}`, {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        
        const data = await response.json();
        setOrders(data.orders);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [filter]);

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
  };

  const handleBackToList = () => {
    setSelectedOrder(null);
  };

  const handleStatusFilter = (status) => {
    setFilter(status);
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <FaCheckCircle className="text-success me-1" />;
      case 'cancelled':
        return <FaTimesCircle className="text-danger me-1" />;
      case 'shipped':
        return <FaTruck className="text-primary me-1" />;
      default:
        return <FaCalendarAlt className="text-secondary me-1" />;
    }
  };

  const getFirstItemName = (items) => {
    if (items.length === 0) return 'No items';
    return items[0].name;
  };

  const getItemsCount = (items) => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  if (!authChecked || loading) {
    return (
      <>
        <Navbar />
        <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
          <Spinner animation="border" variant="primary" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <Alert variant="danger" className="mt-4">
          {error}
        </Alert>
      </>
    );
  }

  return (
    <>
      <Navbar />    
      <Container className="orders-page-container py-4">
        {selectedOrder ? (
          <>
            <Button 
              variant="link" 
              onClick={handleBackToList}
              className="mb-3 d-flex align-items-center"
            >
              <FaChevronLeft className="me-1" /> Back to Orders
            </Button>           
            <Card className="mb-4">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Order #{selectedOrder._id.substring(0, 8)}</h5>
                <Badge pill bg={statusBadge[selectedOrder.status]} className="text-capitalize">
                  {selectedOrder.status}
                </Badge>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <h6 className="mb-3">Order Summary</h6>
                    <ListGroup variant="flush">
                      <ListGroup.Item className="d-flex justify-content-between">
                        <span>Order Date:</span>
                        <span>{formatDate(selectedOrder.createdAt)}</span>
                      </ListGroup.Item>
                      {selectedOrder.shippedAt && (
                        <ListGroup.Item className="d-flex justify-content-between">
                          <span>Shipped Date:</span>
                          <span>{formatDate(selectedOrder.shippedAt)}</span>
                        </ListGroup.Item>
                      )}
                      {selectedOrder.deliveredAt && (
                        <ListGroup.Item className="d-flex justify-content-between">
                          <span>Delivered Date:</span>
                          <span>{formatDate(selectedOrder.deliveredAt)}</span>
                        </ListGroup.Item>
                      )}
                      {selectedOrder.trackingNumber && (
                        <ListGroup.Item className="d-flex justify-content-between">
                          <span>Tracking Number:</span>
                          <span>{selectedOrder.trackingNumber}</span>
                        </ListGroup.Item>
                      )}
                      <ListGroup.Item className="d-flex justify-content-between">
                        <span>Payment Method:</span>
                        <span className="text-capitalize">{selectedOrder.paymentMethod}</span>
                      </ListGroup.Item>
                      <ListGroup.Item className="d-flex justify-content-between">
                        <span>Subtotal:</span>
                        <span>₹{selectedOrder.subtotal.toFixed(2)}</span>
                      </ListGroup.Item>
                      <ListGroup.Item className="d-flex justify-content-between">
                        <span>Delivery Fee:</span>
                        <span>₹{selectedOrder.deliveryFee.toFixed(2)}</span>
                      </ListGroup.Item>
                      <ListGroup.Item className="d-flex justify-content-between fw-bold">
                        <span>Total:</span>
                        <span>₹{selectedOrder.total.toFixed(2)}</span>
                      </ListGroup.Item>
                    </ListGroup>
                  </Col>
                  <Col md={6}>
                    <h6 className="mb-3">Shipping Information</h6>
                    <div className="shipping-info p-3 bg-light rounded">
                      <p className="mb-1"><strong>{selectedOrder.name}</strong></p>
                      <p className="mb-1">{selectedOrder.address}</p>
                      <p className="mb-1">{selectedOrder.city}, {selectedOrder.state} {selectedOrder.zip}</p>
                      <p className="mb-1">Phone: {selectedOrder.phone}</p>
                      <p className="mb-0">Email: {selectedOrder.email}</p>
                    </div>
                  </Col>
                </Row>
                <h6 className="mt-4 mb-3">Order Items ({getItemsCount(selectedOrder.items)})</h6>
                <div className="order-items-container">
                  {selectedOrder.items.map((item, index) => (
                    <Card key={index} className="mb-3">
                      <Card.Body>
                        <Row className="align-items-center">
                          <Col xs={3} md={2}>
                            <img 
                              src={item.image || 'https://via.placeholder.com/80'} 
                              alt={item.name} 
                              className="img-fluid rounded"
                              style={{ maxHeight: '80px' }}
                            />
                          </Col>
                          <Col xs={9} md={6}>
                            <h6 className="mb-1">{item.name}</h6>
                            {item.weight && <small className="text-muted">{item.weight}</small>}
                          </Col>
                          <Col xs={6} md={2} className="mt-2 mt-md-0">
                            <div className="d-flex align-items-center">
                              <FaRupeeSign className="me-1 text-muted" />
                              <span>{item.price.toFixed(2)}</span>
                            </div>
                            <small className="text-muted">x {item.quantity}</small>
                          </Col>
                          <Col xs={6} md={2} className="mt-2 mt-md-0 text-end">
                            <div className="d-flex align-items-center justify-content-end">
                              <FaRupeeSign className="me-1 text-muted" />
                              <span className="fw-bold">{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </>
        ) : (
          <>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="mb-0">My Orders</h2>
              <Dropdown>
                <Dropdown.Toggle variant="outline-primary" id="dropdown-status-filter">
                  <FaFilter className="me-2" />
                  {filter === 'all' ? 'All Orders' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => handleStatusFilter('all')}>All Orders</Dropdown.Item>
                  <Dropdown.Item onClick={() => handleStatusFilter('pending')}>Pending</Dropdown.Item>
                  <Dropdown.Item onClick={() => handleStatusFilter('processing')}>Processing</Dropdown.Item>
                  <Dropdown.Item onClick={() => handleStatusFilter('shipped')}>Shipped</Dropdown.Item>
                  <Dropdown.Item onClick={() => handleStatusFilter('delivered')}>Delivered</Dropdown.Item>
                  <Dropdown.Item onClick={() => handleStatusFilter('cancelled')}>Cancelled</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
            {filteredOrders.length === 0 ? (
              <Card className="text-center py-5">
                <Card.Body>
                  <FaShoppingBag size={48} className="text-muted mb-3" />
                  <h5>No orders found</h5>
                  <p className="text-muted">
                    {filter === 'all' 
                      ? "You haven't placed any orders yet."
                      : `You don't have any ${filter} orders.`}
                  </p>
                  <Button variant="primary" onClick={() => navigate('/shop')}>
                    Start Shopping
                  </Button>
                </Card.Body>
              </Card>
            ) : (
              <>
                <div className="orders-list">
                  {currentOrders.map((order) => (
                    <Card key={order._id} className="mb-3 order-card">
                      <Card.Body>
                        <Row className="align-items-center g-3">
                          <Col xs={12} sm={6} md={3}>
                            <div className="small text-muted mb-1">Customer</div>
                            <div className="d-flex align-items-center">
                              <FaUser className="me-2 text-muted" />
                              <span className="text-truncate">{order.name}</span>
                            </div>
                          </Col>
                          <Col xs={12} sm={6} md={3}>
                            <div className="small text-muted mb-1">Items ({getItemsCount(order.items)})</div>
                            <div className="text-truncate">
                              <FaBox className="me-2 text-muted" />
                              {getFirstItemName(order.items)}
                              {order.items.length > 1 && ` +${order.items.length - 1} more`}
                            </div>
                          </Col>
                          <Col xs={6} sm={4} md={2}>
                            <div className="small text-muted mb-1">Amount</div>
                            <div className="d-flex align-items-center">
                              <FaRupeeSign className="me-2 text-muted" />
                              <span className="fw-bold">{order.total.toFixed(2)}</span>
                            </div>
                          </Col>
                          <Col xs={6} sm={4} md={2}>
                            <div className="small text-muted mb-1">Date</div>
                            <div>
                              <FaCalendarAlt className="me-2 text-muted" />
                              {formatDate(order.createdAt)}
                            </div>
                          </Col>
                          <Col xs={6} sm={4} md={1}>
                            <div className="small text-muted mb-1">Status</div>
                            <Badge pill bg={statusBadge[order.status]} className="text-capitalize">
                              {order.status}
                            </Badge>
                          </Col>
                          <Col xs={6} sm={12} md={1} className="text-md-end">
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => handleViewDetails(order)}
                              className="w-100"
                            >
                              Details
                            </Button>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="d-flex justify-content-center mt-4">
                    <Pagination>
                      <Pagination.Prev 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      />
                      {Array.from({ length: totalPages }, (_, i) => (
                        <Pagination.Item
                          key={i + 1}
                          active={i + 1 === currentPage}
                          onClick={() => setCurrentPage(i + 1)}
                        >
                          {i + 1}
                        </Pagination.Item>
                      ))}
                      <Pagination.Next 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      />
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </Container>
    </>
  );
};

export default OrdersPage;