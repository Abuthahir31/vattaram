import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './home';
import CartPage from './cart/cart';
import Checkout from './cart/Checkout';
import ItemsPage from './ItemsPage'; 
import Fooditem from "./fooditem";
import Wishlist from "./wishlist";
import OrdersPage from './OrdersPage';
//categories
import FoodEdibles from './foodedibles';

//admin
import Adminhome from './Admin/Adminhome';
import AddDistrictForm from './Admin/AddDistrictForm';
import Addcategories from './Admin/Addcategories';
import AddProduct from './Admin/AddProduct';
import AboutUsAdmin from './Admin/AboutUsAdmin'
import TestimonialsAdmin from './Admin/TestimonialsAdmin';
import DealAdminPage from './Admin/DealAdminPage';
import AdminPage from './Admin/AdminPage';
import OrderConfirmation from './cart/OrderConfirmation';
import Register from './components/register';
import PhoneAuth from './components/PhoneAuth';
import VerifyEmail from './components/VerifyEmail';
import AdminOrders from './Admin/Orders';
// import OTP from './components/PhoneVerification'
import PhoneVerification from './components/PhoneVerification';

import OTPLogin from './components/otp';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} /> 
          <Route path="/home" element={<HomePage />} />
          <Route path="/items" element={<ItemsPage />} />
          <Route path="/cart" element={<CartPage />} /> 
          <Route path="/checkout" element={<Checkout />} />  
          <Route path="/shop" element={<FoodEdibles />} /> 
          <Route path="/fooditem" element={<Fooditem/>} />
          <Route path="/wishlist" element={<Wishlist/>} />
          <Route path="/orders" element={<OrdersPage/>} />

          <Route path="/Admin" element={<Adminhome />} />
          <Route path="/AddDis" element={<AddDistrictForm />} />
          <Route path="/AddCat" element={<Addcategories />} />
          <Route path="/AddProd" element={<AddProduct/>} /> 
          <Route path="/about-us" element={<AboutUsAdmin/>} /> 
          <Route path="/testimonial" element={<TestimonialsAdmin/>} /> 
          <Route path="/deal" element={<DealAdminPage/>} /> 
          <Route path="/users" element={<AdminPage/>} /> 
          <Route path="/register1" element={<Register/>} /> 
          <Route path="/account" element={<PhoneAuth/>} /> 
             <Route path="/otp" element={<PhoneVerification/>} /> 

   <Route path="/otplogin" element={<OTPLogin/>} /> 

          <Route path="/verify-email" element={<VerifyEmail/>} />
          <Route path="/order-confirmation" element={<OrderConfirmation/>} />
          <Route path="/adminorders" element={<AdminOrders/>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

