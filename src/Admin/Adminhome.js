import { Link } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import './AdminHome.css';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';

const AdminHome = () => {
  const [totals, setTotals] = useState({
    products: 0,
    categories: 0,
    districts: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTotals = async () => {
      try {
        const [productsRes, categoriesRes, districtsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/products'),
          axios.get('http://localhost:5000/api/categories'),
          axios.get('http://localhost:5000/api/districts')
        ]);

        const productMap = new Map();
        
        productsRes.data.forEach(item => {
          if (!productMap.has(item._id)) {
            productMap.set(item._id, {
              _id: item._id,
              name: item.name,
              image: item.image,
              imageUrl: item.imageUrl,
              subtitle: item.subtitle,
              description: item.description,
              category: item.category,
              district: item.district,
              ratingValue: item.ratingValue,
              variants: [],
              createdAt: item.createdAt,
              updatedAt: item.updatedAt
            });
          }
          
          const product = productMap.get(item._id);
          let variant = product.variants[item.variantIndex];
          
          if (!variant) {
            variant = { weights: [] };
            product.variants[item.variantIndex] = variant;
          }
          
          variant.weights[item.weightIndex] = item.weight;
        });
        
        const processedProducts = Array.from(productMap.values())
          .filter(product => product.name && product.name.trim() !== '')
          .map(product => ({
            ...product,
            variants: product.variants.filter(v => v !== undefined)
          }));

        setTotals({
          products: processedProducts.length,
          categories: categoriesRes.data.length,
          districts: districtsRes.data.length
        });
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        console.error('Error fetching totals:', err);
      }
    };

    fetchTotals();
  }, []);

  if (loading) {
    return (
      <div className="admin-home-container">
        <AdminNavbar />
        <div className="admin-home-content">
          <Container className="py-5">
            <Row className="justify-content-center">
              <Col className="text-center">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </Col>
            </Row>
          </Container>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-home-container">
        <AdminNavbar />
        <div className="admin-home-content">
          <Container className="py-5">
            <Row className="justify-content-center">
              <Col md={8}>
                <Alert variant="danger">
                  Error: {error}
                </Alert>
              </Col>
            </Row>
          </Container>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-home-container">
      <AdminNavbar />
      <div className="admin-home-content">
        <Container className="py-5"> <Row className="g-4">
            <Col xs={12} md={6} lg={4}>
              <Card as={Link} to="/AddProd" className="h-100 text-decoration-none admin-option-card">
                <Card.Body className="text-center">
                  <div className="option-icon mb-3">📦</div>
                  <Card.Title>Products</Card.Title>
                  <Card.Text className="text-muted">
                    <span className="d-block">Total: {totals.products}</span>
                    <small>Manage all products</small>
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col xs={12} md={6} lg={4}>
              <Card as={Link} to="/AddCat" className="h-100 text-decoration-none admin-option-card">
                <Card.Body className="text-center">
                  <div className="option-icon mb-3">🗂️</div>
                  <Card.Title>Categories</Card.Title>
                  <Card.Text className="text-muted">
                    <span className="d-block">Total: {totals.categories}</span>
                    <small>Manage product categories</small>
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col xs={12} md={6} lg={4}>
              <Card as={Link} to="/AddDis" className="h-100 text-decoration-none admin-option-card">
                <Card.Body className="text-center">
                  <div className="option-icon mb-3">🗺️</div>
                  <Card.Title>Districts</Card.Title>
                  <Card.Text className="text-muted">
                    <span className="d-block">Total: {totals.districts}</span>
                    <small>Manage available districts</small>
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default AdminHome;