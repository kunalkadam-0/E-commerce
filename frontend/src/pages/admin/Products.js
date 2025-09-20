// frontend/src/pages/admin/Products.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import { useNavigate, Link } from 'react-router-dom';
import { getCategories, getProducts, addProduct, deleteProduct, updateProductPopularity } from '../../services/api';

// Define API_BASE_URL here for image display and consistent backend calls
const API_BASE_URL = 'http://localhost:5000'; // Base URL for backend, used for image paths

const AVAILABLE_SIZES = ['S', 'M', 'L', 'XL', 'XXL']; // Define available sizes
const AVAILABLE_GENDERS = ['Male', 'Female', 'Unisex']; // Exclude 'Kids'

function AdminProducts() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null); // Ref for clearing the file input

    // --- View Management State ---
    const [currentView, setCurrentView] = useState('categories_overview'); // 'categories_overview', 'add_product_form', 'category_products_list'

    // --- Categories State ---
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true); 
    const [errorCategories, setErrorCategories] = useState(null);

    // --- Selected Category for Product Listing State ---
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [selectedCategoryName, setSelectedCategoryName] = useState('');

    // --- Products Listing State ---
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [errorProducts, setErrorProducts] = useState(null);

    // --- Add Product Form State ---
    const [newProductName, setNewProductName] = useState('');
    const [newProductDescription, setNewProductDescription] = useState('');
    const [newProductPrice, setNewProductPrice] = useState('');
    const [newProductDiscountPercentage, setNewProductDiscountPercentage] = useState(''); // CHANGED: from newProductDiscountPrice
    const [newProductStock, setNewProductStock] = useState('');
    const [newProductCategoryId, setNewProductCategoryId] = useState('');
    const [newProductImages, setNewProductImages] = useState([]);
    const [newProductImagePreviews, setNewProductImagePreviews] = useState([]); 
    const [newProductBrand, setNewProductBrand] = useState('');
    const [newProductMaterial, setNewProductMaterial] = useState('');
    const [newProductColor, setNewProductColor] = useState('');
    const [newProductSizes, setNewProductSizes] = useState([]);
    const [newProductGender, setNewProductGender] = useState('');

    const [addingProduct, setAddingProduct] = useState(false);
    const [addProductError, setAddProductError] = useState(null);
    const [addProductSuccess, setAddProductSuccess] = useState(false);

    // --- Delete Confirmation Modal State ---
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [productToDeleteId, setProductToDeleteId] = useState(null);

    // --- useEffect to fetch categories ---
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoadingCategories(true);
                const response = await getCategories();
                setCategories(response.data);
                setLoadingCategories(false);
                if (response.data.length > 0) {
                    setNewProductCategoryId(response.data[0].category_id);
                }
            } catch (err) {
                console.error('Error fetching categories:', err);
                setErrorCategories('Failed to load categories.');
                setLoadingCategories(false);
                if (err.response && err.response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userRole');
                    navigate('/login');
                }
            }
        };

        if (currentView === 'categories_overview' || currentView === 'add_product_form') {
            fetchCategories();
        }
    }, [currentView, navigate]);


    // --- NEW: Handle Toggle Popular Status ---
    const handleTogglePopular = async (productId, currentIsPopular) => {
        try {
            // Optimistically update UI
            setProducts(prevProducts =>
                prevProducts.map(p =>
                    p.product_id === productId ? { ...p, is_popular: !currentIsPopular } : p
                )
            );
            await updateProductPopularity(productId, !currentIsPopular);
        } catch (err) {
            console.error('Error toggling product popularity:', err);
            // Revert optimistic update if API call fails
            setProducts(prevProducts =>
                prevProducts.map(p =>
                    p.product_id === productId ? { ...p, is_popular: currentIsPopular } : p
                )
            );
            // Show error to user
            alert('Failed to update product popularity: ' + (err.response?.data?.message || err.message));
        }
    };


    // --- Function to fetch products for a given category (now memoized with useCallback) ---
    const fetchProductsForCategory = useCallback(async (categoryId, categoryName) => {
        if (categoryId) {
            try {
                setLoadingProducts(true);
                setErrorProducts(null);
                const response = await getProducts(categoryId);
                setProducts(response.data);
                setLoadingProducts(false);
                response.data.forEach(product => {
                    if (product.all_image_urls && product.all_image_urls.length > 0) {
                        console.log(`Product ID ${product.product_id} has all image URLs:`, product.all_image_urls);
                    }
                    console.log(`Product ID ${product.product_id} has sizes:`, product.sizes);
                });
            } catch (err) {
                console.error(`Error fetching products for category ${categoryId}:`, err);
                setErrorProducts(`Failed to load products for ${categoryName}.`);
                setLoadingProducts(false);
                if (err.response && err.response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userRole');
                    navigate('/login');
                }
            }
        }
    }, [navigate]);

    // --- useEffect to fetch products for selected category on view change ---
    useEffect(() => {
        if (currentView === 'category_products_list' && selectedCategoryId) {
            fetchProductsForCategory(selectedCategoryId, selectedCategoryName);
        }
    }, [currentView, selectedCategoryId, selectedCategoryName, fetchProductsForCategory]);

    // --- Cleanup for image previews when component unmounts or previews change ---
    useEffect(() => {
        return () => {
            newProductImagePreviews.forEach(url => URL.revokeObjectURL(url));
        };
    }, [newProductImagePreviews]);

    // --- Handlers ---
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/login');
    };

    const handleAddProductClick = () => {
        setCurrentView('add_product_form');
        setAddProductError(null);
        setAddProductSuccess(false);
        setNewProductImagePreviews([]);
        // Reset form fields
        setNewProductName('');
        setNewProductDescription('');
        setNewProductPrice('');
        setNewProductDiscountPercentage(''); // CHANGED: Reset percentage
        setNewProductStock('');
        setNewProductCategoryId(categories.length > 0 ? categories[0].category_id : '');
        setNewProductImages([]);
        setNewProductBrand('');
        setNewProductMaterial('');
        setNewProductColor('');
        setNewProductSizes([]);
        setNewProductGender('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleCategoryCardClick = (categoryId, categoryName) => {
        setSelectedCategoryId(categoryId);
        setSelectedCategoryName(categoryName);
        setCurrentView('category_products_list');
    };

    const handleEditProduct = (productId) => {
        console.log('Navigating to edit product:', productId);
        navigate(`/admin/products/edit/${productId}`);
    };

    const confirmDeleteProduct = (productId) => {
        setProductToDeleteId(productId);
        setShowDeleteConfirm(true);
    };

    const executeDeleteProduct = async () => {
        setShowDeleteConfirm(false);
        if (!productToDeleteId) return;

        try {
            await deleteProduct(productToDeleteId);
            console.log('Product deleted successfully');
            if (selectedCategoryId) {
                fetchProductsForCategory(selectedCategoryId, selectedCategoryName);
            }
            setProductToDeleteId(null);
        } catch (err) {
            console.error('Error deleting product:', err);
            setErrorProducts('Failed to delete product.');
            setProductToDeleteId(null);
            if (err.response && err.response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('userRole');
                navigate('/login');
            }
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setNewProductImages(files);

        newProductImagePreviews.forEach(url => URL.revokeObjectURL(url));

        const filePreviews = files.map(file => URL.createObjectURL(file));
        setNewProductImagePreviews(filePreviews);
    };

    const handleSizeChange = (e) => {
        const { value, checked } = e.target;
        setNewProductSizes(prev => 
            checked ? [...prev, value] : prev.filter(size => size !== value)
        );
    };

    // CHANGED: Helper to calculate final price using percentage
    const calculateFinalPrice = (price, discountPercentage) => {
        const p = parseFloat(price);
        const dp = parseFloat(discountPercentage); // This is now a percentage (e.g., 10 for 10%)

        if (isNaN(p)) return 'N/A';
        // If discountPercentage is not a number or 0, final price is the original price
        if (isNaN(dp) || dp === 0) return `$${p.toFixed(2)}`;
        
        // Calculate discounted price: price * (1 - discount_percentage / 100)
        const final = p * (1 - dp / 100);
        // Ensure final price isn't negative
        return `$${Math.max(0, final).toFixed(2)}`;
    };

    const handleNewProductSubmit = async (e) => {
        e.preventDefault();
        setAddingProduct(true);
        setAddProductError(null);
        setAddProductSuccess(false);

        const formData = new FormData();
        formData.append('name', newProductName);
        formData.append('description', newProductDescription);
        formData.append('price', newProductPrice);
        formData.append('discount_percentage', newProductDiscountPercentage); // CHANGED: to discount_percentage
        formData.append('stock_quantity', newProductStock);
        formData.append('category_id', newProductCategoryId);
        formData.append('brand', newProductBrand);
        formData.append('material', newProductMaterial);
        formData.append('color', newProductColor);
        formData.append('sizes', JSON.stringify(newProductSizes)); // Send sizes as JSON string
        formData.append('gender', newProductGender);

        if (newProductImages.length > 0) {
            newProductImages.forEach((file) => {
                formData.append('images', file);
            });
        }

        try {
            await addProduct(formData);
            setAddProductSuccess(true);

            // Reset form fields after successful submission
            setNewProductName('');
            setNewProductDescription('');
            setNewProductPrice('');
            setNewProductDiscountPercentage(''); // CHANGED: Reset percentage
            setNewProductStock('');
            setNewProductCategoryId(categories.length > 0 ? categories[0].category_id : '');
            setNewProductImages([]);
            setNewProductImagePreviews([]);
            setNewProductBrand('');
            setNewProductMaterial('');
            setNewProductColor('');
            setNewProductSizes([]);
            setNewProductGender('');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            if (selectedCategoryId) {
                fetchProductsForCategory(selectedCategoryId, selectedCategoryName);
            }

        } catch (err) {
            console.error('Error adding product:', err.response ? err.response.data : err.message);
            setAddProductError(err.response ? err.response.data.message : 'Failed to add product.');
        } finally {
            setAddingProduct(false);
        }
    };

    // --- Render Content ---
    const renderContent = () => {
        switch (currentView) {
            case 'categories_overview':
                if (loadingCategories) {
                    return <div className="text-center mt-5">Loading categories...</div>;
                }
                if (errorCategories) {
                    return <div className="text-center text-danger mt-5">Error: {errorCategories}</div>;
                }
                return (
                    <>
                        <h2 className="mb-4">Product Categories</h2>
                        <p className="lead">Click a category to manage its products, or add a new product for any category.</p>

                        <div className="row mt-4">
                            {categories.length > 0 ? (
                                categories.map(category => (
                                    <div key={category.category_id} className="col-md-4 mb-4">
                                        <div className="card text-center shadow-sm h-100" style={{ cursor: 'pointer' }}
                                            onClick={() => handleCategoryCardClick(category.category_id, category.name)}>
                                            <div className="card-body">
                                                <h5 className="card-title">{category.name}</h5>
                                                <p className="card-text text-muted">{category.description || 'No description'}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-12 text-center">
                                    <p>No categories found. Please add categories first if needed.</p>
                                </div>
                            )}
                        </div>
                        <div className="text-center mt-4 mb-4">
                            <button className="btn btn-primary btn-lg" onClick={handleAddProductClick}>Add New Product</button>
                        </div>
                    </>
                );

            case 'add_product_form':
                return (
                    <>
                        <h2 className="mb-4">Add New Product</h2>
                        <button className="btn btn-secondary mb-3" onClick={() => setCurrentView('categories_overview')}>Back to Categories</button>

                        <form onSubmit={handleNewProductSubmit} className="needs-validation" noValidate>
                            {addProductError && <div className="alert alert-danger">{addProductError}</div>}
                            {addProductSuccess && <div className="alert alert-success">Product added successfully!</div>}

                            <div className="mb-3">
                                <label htmlFor="productName" className="form-label">Product Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="productName"
                                    value={newProductName}
                                    onChange={(e) => setNewProductName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="mb-3">
                                <label htmlFor="productDescription" className="form-label">Description</label>
                                <textarea
                                    className="form-control"
                                    id="productDescription"
                                    rows="3"
                                    value={newProductDescription}
                                    onChange={(e) => setNewProductDescription(e.target.value)}
                                ></textarea>
                            </div>

                            <div className="row">
                                <div className="col-md-4 mb-3">
                                    <label htmlFor="productPrice" className="form-label">Price</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        id="productPrice"
                                        step="0.01"
                                        value={newProductPrice}
                                        onChange={(e) => setNewProductPrice(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label htmlFor="productDiscountPercentage" className="form-label">Discount Percentage (%)</label> {/* CHANGED LABEL */}
                                    <input
                                        type="number"
                                        className="form-control"
                                        id="productDiscountPercentage"
                                        step="0.01" // Allow decimal percentages
                                        min="0"
                                        max="100"
                                        value={newProductDiscountPercentage}
                                        onChange={(e) => setNewProductDiscountPercentage(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label className="form-label">Final Price</label>
                                    <p className="form-control-plaintext fw-bold">
                                        {calculateFinalPrice(newProductPrice, newProductDiscountPercentage)}
                                    </p>
                                </div>
                            </div>

                            <div className="mb-3">
                                <label htmlFor="productStock" className="form-label">Stock Quantity</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    id="productStock"
                                    value={newProductStock}
                                    onChange={(e) => setNewProductStock(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="mb-3">
                                <label htmlFor="productCategory" className="form-label">Category</label>
                                <select
                                    className="form-select"
                                    id="productCategory"
                                    value={newProductCategoryId}
                                    onChange={(e) => setNewProductCategoryId(e.target.value)}
                                    required
                                >
                                    {loadingCategories ? (
                                        <option value="">Loading Categories...</option>
                                    ) : errorCategories ? (
                                        <option value="">Error loading categories</option>
                                    ) : categories.length > 0 ? (
                                        categories.map(category => (
                                            <option key={category.category_id} value={category.category_id}>
                                                {category.name}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="">No categories available</option>
                                    )}
                                </select>
                            </div>

                            <div className="mb-3">
                                <label htmlFor="productBrand" className="form-label">Brand</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="productBrand"
                                    value={newProductBrand}
                                    onChange={(e) => setNewProductBrand(e.target.value)}
                                />
                            </div>

                            <div className="row">
                                <div className="col-md-4 mb-3">
                                    <label htmlFor="productMaterial" className="form-label">Material</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="productMaterial"
                                        value={newProductMaterial}
                                        onChange={(e) => setNewProductMaterial(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label htmlFor="productColor" className="form-label">Color</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="productColor"
                                        value={newProductColor}
                                        onChange={(e) => setNewProductColor(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label className="form-label">Sizes</label>
                                    <div>
                                        {AVAILABLE_SIZES.map(size => (
                                            <div className="form-check form-check-inline" key={size}>
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id={`size-${size}`}
                                                    value={size}
                                                    checked={newProductSizes.includes(size)}
                                                    onChange={handleSizeChange}
                                                />
                                                <label className="form-check-label" htmlFor={`size-${size}`}>{size}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mb-3">
                                <label htmlFor="productGender" className="form-label">Gender</label>
                                <select
                                    className="form-select"
                                    id="productGender"
                                    value={newProductGender}
                                    onChange={(e) => setNewProductGender(e.target.value)}
                                >
                                    <option value="">Select Gender (Optional)</option>
                                    {AVAILABLE_GENDERS.map(gender => (
                                        <option key={gender} value={gender}>{gender}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-3">
                                <label htmlFor="productImages" className="form-label">Product Images (up to 5)</label>
                                <input
                                    type="file"
                                    className="form-control"
                                    id="productImages"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageChange}
                                    ref={fileInputRef}
                                />
                                {newProductImagePreviews.length > 0 && (
                                    <div className="mt-2">
                                        <small className="text-muted">Selected image previews:</small>
                                        <div className="d-flex flex-wrap gap-2 mt-2">
                                            {newProductImagePreviews.map((url, index) => (
                                                <div key={index} className="position-relative">
                                                    <img
                                                        src={url}
                                                        alt={`Preview ${index + 1}`}
                                                        className="img-thumbnail"
                                                        style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={addingProduct}>
                                {addingProduct ? 'Adding Product...' : 'Add Product'}
                            </button>
                        </form>
                    </>
                );

            case 'category_products_list':
                return (
                    <>
                        <h2 className="mb-4">Products in {selectedCategoryName} Category</h2>
                        <button className="btn btn-secondary mb-3 me-2" onClick={() => setCurrentView('categories_overview')}>Back to Categories</button>
                        <button className="btn btn-primary mb-3" onClick={handleAddProductClick}>Add New Product</button>

                        {loadingProducts ? (
                            <div className="text-center mt-5">Loading products...</div>
                        ) : errorProducts ? (
                            <div className="text-center text-danger mt-5">Error: {errorProducts}</div>
                        ) : products.length > 0 ? (
                            <div className="table-responsive mt-4">
                                <table className="table table-striped table-hover align-middle">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>ID</th>
                                            <th>Image</th>
                                            <th>Name</th>
                                            <th>Price</th>
                                            <th>Discount %</th>
                                            <th>Final Price</th>
                                            <th>Stock</th>
                                            <th>Sizes</th>
                                            <th>Brand</th>
                                            <th>Gender</th>
                                            <th>Popular</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map(product => (
                                            <tr key={product.product_id}>
                                                <td>{product.product_id}</td>
                                                <td>
                                                    {product.image_url ? (
                                                        <img src={`${API_BASE_URL}${product.image_url}`} alt={product.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                                                    ) : (
                                                        <div style={{ width: '50px', height: '50px', backgroundColor: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}>
                                                            No Img
                                                        </div>
                                                    )}
                                                </td>
                                                <td>{product.name}</td>
                                                <td>${parseFloat(product.price).toFixed(2)}</td>
                                                <td>{product.discount_percentage ? `${parseFloat(product.discount_percentage).toFixed(2)}%` : 'N/A'}</td>
                                                <td>{calculateFinalPrice(product.price, product.discount_percentage)}</td>
                                                <td>{product.stock_quantity !== null && product.stock_quantity !== undefined ? product.stock_quantity : '0'}</td>
                                                <td>{product.sizes && product.sizes.length > 0 ? product.sizes.join(', ') : 'N/A'}</td>
                                                <td>{product.brand || 'N/A'}</td>
                                                <td>{product.gender || 'N/A'}</td>
                                                <td>
                                                    <button
                                                        className={`btn btn-sm ${product.is_popular ? 'btn-warning' : 'btn-outline-warning'}`}
                                                        onClick={() => handleTogglePopular(product.product_id, product.is_popular)}
                                                        title={product.is_popular ? 'Mark as Unpopular' : 'Mark as Popular'}
                                                    >
                                                        {product.is_popular ? (
                                                            <i className="fa-solid fa-star"></i>
                                                        ) : (
                                                            <i className="fa-regular fa-star"></i>
                                                        )}
                                                    </button>
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-sm btn-info me-2"
                                                        onClick={() => handleEditProduct(product.product_id)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => confirmDeleteProduct(product.product_id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center mt-4">
                                <p>No products found for the {selectedCategoryName} category.</p>
                                <button className="btn btn-primary" onClick={handleAddProductClick}>Add First Product</button>
                            </div>
                        )}
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <div className="d-flex" style={{ minHeight: '100vh' }}>
            <Sidebar />
            <div className="flex-grow-1 d-flex flex-column" style={{ marginLeft: '250px' }}>
                <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
                    <div className="container-fluid">
                        <Link className="navbar-brand" to="/admin/products">Admin Products Management</Link>
                        <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
                    </div>
                </nav>
                <div className="container-fluid p-4 flex-grow-1">
                    {renderContent()}
                </div>
                <footer className="bg-dark text-white text-center py-3 w-100">
                    <p className="mb-0">&copy; Admin Panel 2024</p>
                </footer>
            </div>

            {showDeleteConfirm && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Confirm Deletion</h5>
                                <button type="button" className="btn-close" onClick={() => setShowDeleteConfirm(false)}></button>
                            </div>
                            <div className="modal-body">
                                Are you sure you want to delete this product? This action cannot be undone.
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                                <button type="button" className="btn btn-danger" onClick={executeDeleteProduct}>Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminProducts;