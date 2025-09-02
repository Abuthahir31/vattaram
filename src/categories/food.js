import '../category.css';
import Navbar from '../navbar';

const FoodEdibles = () => {
  const categories = [
    {
      id: 1,
      name: 'Tirunelveli Halwa',
      image: 'https://i.imgur.com/JqYeZ0U.jpg',
      quantity: '250g, 500g, 1kg',
      
    },
    {
      id: 2,
      name: 'Karupatti (Palm Jaggery)',
      image: 'https://i.imgur.com/mXJQZzP.jpg',
      quantity: '200g, 500g, 1kg',
     
    },
    {
      id: 3,
      name: 'Cashew Nuts',
      image: 'https://i.imgur.com/VvNdq9h.jpg',
      quantity: '100g, 250g, 500g',
     
    },
    {
      id: 4,
      name: 'Banana Chips',
      image: 'https://i.imgur.com/8Q3qZ2T.jpg',
      quantity: '150g, 300g, 500g',
      
    },
    {
      id: 5,
      name: 'Pickles & Preserves',
      image: 'https://i.imgur.com/5jKZ9Xx.jpg',
      quantity: '200ml, 500ml, 1L',
  
    },
    {
      id: 6,
      name: 'Dried Fish Varieties',
      image: 'https://i.imgur.com/9YQvZ2k.jpg',
      quantity: '100g, 250g, 500g',
     
    },
    {
      id: 7,
      name: 'Coconut Products',
      image: 'https://i.imgur.com/3jKZ9Yx.jpg',
      quantity: 'Varies by product',
     
    },
    {
      id: 8,
      name: 'Jackfruit Chips',
      image: 'https://i.imgur.com/2kLmZ9P.jpg',
      quantity: '150g, 300g, 500g',
     
    },
    {
      id: 9,
      name: 'Sea Salt',
      image: 'https://i.imgur.com/7jKZ9Yx.jpg',
      quantity: '250g, 500g, 1kg',
      
    }
  ];

  return (
    <div className="food-edibles-section">
        <Navbar />
      <h2 className="section-title">Food & Edibles</h2>
      <div className="categories-container">
        {categories.map((category) => (
          <div key={category.id} className="category-card">
            <div className="category-image-container">
              <img 
                src={category.image} 
                alt={category.name} 
                className="category-image"
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = 'https://i.imgur.com/YCa6FJD.jpg'; 
                }}
              />
            </div>
            <div className="category-details">
              <h3 className="category-name">{category.name}</h3>
              <p className="category-quantity"><strong>Available in:</strong> {category.quantity}</p>
             
              <button className="shop-now-btn">Shop Now</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FoodEdibles;