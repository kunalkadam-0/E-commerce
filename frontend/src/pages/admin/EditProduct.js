// frontend/src/pages/admin/EditProduct.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../../components/admin/Sidebar';
import { getProductById, getCategories, updateProduct } from '../../services/api';

const API_BASE_URL = 'http://localhost:5000';

const AVAILABLE_SIZES = ['S', 'M', 'L', 'XL', 'XXL']; // Define available sizes
const AVAILABLE_GENDERS = ['Male', 'Female', 'Unisex']; // Exclude 'Kids'

function AdminEditProduct() {
    const { productId } = useParams(); // Get product ID from URL
    const navigate = useNavigate();
    const primaryFileInputRef = useRef(null); // Ref for primary image input
    const additionalFileInputRef = useRef(null); // Ref for additional images input

    // --- Product Data State ---
    const [product, setProduct] = useState(null);
    const [loadingProduct, setLoadingProduct] = useState(true);
    const [errorProduct, setErrorProduct] = useState(null);

    // --- Form Fields State (for editing) ---
    const [editProductName, setEditProductName] = useState('');
    const [editProductDescription, setEditProductDescription] = useState('');
    const [editProductPrice, setEditProductPrice] = useState('');
    const [editProductDiscountPercentage, setEditProductDiscountPercentage] = useState(''); // CHANGED: from editProductDiscountPrice
    const [editProductStock, setEditProductStock] = useState('');
    const [editProductCategoryId, setEditProductCategoryId] = useState('');
    const [editProductBrand, setEditProductBrand] = useState('');
    const [editProductMaterial, setEditProductMaterial] = useState('');
    const [editProductColor, setEditProductColor] = useState('');
    const [editProductSizes, setEditProductSizes] = useState([]);
    // FIX: Corrected useState initialization
    const [editProductGender, setEditProductGender] = useState('');

    // --- Image Management State ---
    const [existingImages, setExistingImages] = useState([]);
    const [imagesToDelete, setImagesToDelete] = useState([]);

    const [newPrimaryImageFile, setNewPrimaryImageFile] = useState(null);
    const [newPrimaryImagePreview, setNewPrimaryImagePreview] = useState(null);

    const [newAdditionalImageFiles, setNewAdditionalImageFiles] = useState([]);
    const [newAdditionalImagePreviews, setNewAdditionalImagePreviews] = useState([]);

    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    const [updatingProduct, setUpdatingProduct] = useState(false);
    const [updateProductError, setUpdateProductError] = useState(null);
    const [updateProductSuccess, setUpdateProductSuccess] = useState(false);

    // --- Fetch Product Data and Categories on Mount ---
    useEffect(() => {
        const fetchProductAndCategories = async () => {
            try {
                setLoadingProduct(true);
                setLoadingCategories(true);

                // Fetch Product Details
                const productResponse = await getProductById(productId);
                const fetchedProduct = productResponse.data;
                setProduct(fetchedProduct);

                // Pre-fill form fields
                setEditProductName(fetchedProduct.name || '');
                setEditProductDescription(fetchedProduct.description || '');
                setEditProductPrice(fetchedProduct.price || '');
                setEditProductDiscountPercentage(fetchedProduct.discount_percentage || ''); // CHANGED: Pre-fill percentage
                setEditProductStock(fetchedProduct.stock_quantity || '');
                setEditProductCategoryId(fetchedProduct.category_id || '');
                setEditProductBrand(fetchedProduct.brand || '');
                setEditProductMaterial(fetchedProduct.material || '');
                setEditProductColor(fetchedProduct.color || '');
                setEditProductSizes(fetchedProduct.sizes || []);
                setEditProductGender(fetchedProduct.gender || '');

                // Set existing images from fetched product (all_images is now an array of objects)
                setExistingImages(fetchedProduct.all_images || []);
                setImagesToDelete([]); // Reset images to delete on new fetch

                // Fetch Categories
                const categoriesResponse = await getCategories();
                setCategories(categoriesResponse.data);

                setLoadingProduct(false);
                setLoadingCategories(false);

            } catch (err) {
                console.error('Error fetching product or categories:', err);
                setErrorProduct('Failed to load product details or categories.');
                setLoadingProduct(false);
                setLoadingCategories(false);
                if (err.response && err.response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userRole');
                    navigate('/login');
                }
            }
        };

        fetchProductAndCategories();
    }, [productId, navigate]);

    // --- Cleanup for image preview URLs ---
    useEffect(() => {
        return () => {
            if (newPrimaryImagePreview) {
                URL.revokeObjectURL(newPrimaryImagePreview);
            }
            newAdditionalImagePreviews.forEach(url => URL.revokeObjectURL(url));
        };
    }, [newPrimaryImagePreview, newAdditionalImagePreviews]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/login');
    };

    // --- Handle New Primary Image Selection ---
    const handleNewPrimaryImageChange = (e) => {
        const file = e.target.files[0];
        setNewPrimaryImageFile(file);

        if (file) {
            if (newPrimaryImagePreview) {
                URL.revokeObjectURL(newPrimaryImagePreview);
            }
            setNewPrimaryImagePreview(URL.createObjectURL(file));
        } else {
            setNewPrimaryImagePreview(null);
        }
    };

    // --- Handle New Additional Images Selection ---
    const handleNewAdditionalImagesChange = (e) => {
        const files = Array.from(e.target.files);
        setNewAdditionalImageFiles(files);

        newAdditionalImagePreviews.forEach(url => URL.revokeObjectURL(url));

        const filePreviews = files.map(file => URL.createObjectURL(file));
        setNewAdditionalImagePreviews(filePreviews);
    };

    // --- Handle Removing an Existing Image ---
    const handleRemoveExistingImage = (imageIdToRemove, imageUrlToRemove, isThumbnail) => {
        // Prevent removing the primary image unless a new one is selected
        if (isThumbnail && !newPrimaryImageFile) {
            setUpdateProductError('You must select a new primary image before removing the current one.');
            return;
        }
        setUpdateProductError(null);

        setImagesToDelete(prev => [...prev, imageIdToRemove]);
        setExistingImages(prev => prev.filter(img => img.image_id !== imageIdToRemove));
    };

    // Handle multiple size checkbox changes
    const handleSizeChange = (e) => {
        const { value, checked } = e.target;
        setEditProductSizes(prev => 
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

    // --- Handle Form Submission for Update ---
    const handleUpdateProductSubmit = async (e) => {
        e.preventDefault();
        setUpdatingProduct(true);
        setUpdateProductError(null);
        setUpdateProductSuccess(false);

        const formData = new FormData();
        formData.append('name', editProductName);
        formData.append('description', editProductDescription);
        formData.append('price', editProductPrice);
        formData.append('discount_percentage', editProductDiscountPercentage); // CHANGED: to discount_percentage
        formData.append('stock_quantity', editProductStock);
        formData.append('category_id', editProductCategoryId);
        formData.append('brand', editProductBrand);
        formData.append('material', editProductMaterial);
        formData.append('color', editProductColor);
        formData.append('sizes', JSON.stringify(editProductSizes));
        formData.append('gender', editProductGender);

        // Append the new primary image file if selected
        if (newPrimaryImageFile) {
            formData.append('primaryImage', newPrimaryImageFile);
        }

        // Append new additional image files
        newAdditionalImageFiles.forEach((file) => {
            formData.append('newAdditionalImages', file);
        });

        // Append images to delete as a JSON string
        if (imagesToDelete.length > 0) {
            formData.append('imagesToDelete', JSON.stringify(imagesToDelete));
        }

        try {
            await updateProduct(productId, formData);
            setUpdateProductSuccess(true);
            setUpdateProductError(null);

            console.log('Product updated successfully!');

            // Re-fetch product data to show latest changes
            const updatedProductResponse = await getProductById(productId);
            const updatedFetchedProduct = updatedProductResponse.data;
            setProduct(updatedFetchedProduct);

            // Update image states based on refreshed data
            setExistingImages(updatedFetchedProduct.all_images || []);
            setImagesToDelete([]);
            setNewPrimaryImageFile(null);
            setNewPrimaryImagePreview(null);
            setNewAdditionalImageFiles([]);
            setNewAdditionalImagePreviews([]);

            // Clear file inputs visually
            if (primaryFileInputRef.current) {
                primaryFileInputRef.current.value = '';
            }
            if (additionalFileInputRef.current) {
                additionalFileInputRef.current.value = '';
            }


        } catch (err) {
            console.error('Error updating product:', err.response ? err.response.data : err.message);
            setUpdateProductError(err.response ? err.response.data.message : 'Failed to update product.');
        } finally {
            setUpdatingProduct(false);
        }
    };

    if (loadingProduct || loadingCategories) {
        return <div className="text-center mt-5">Loading product and categories...</div>;
    }

    if (errorProduct) {
        return <div className="text-center text-danger mt-5">Error: {errorProduct}</div>;
    }

    if (!product) {
        return <div className="text-center mt-5">Product not found.</div>;
    }

    return (
        <div className="d-flex" style={{ minHeight: '100vh' }}>
            <Sidebar />
            <div className="flex-grow-1 d-flex flex-column" style={{ marginLeft: '250px' }}>
                <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
                    <div className="container-fluid">
                        <Link className="navbar-brand" to="/admin/products">Edit Product</Link>
                        <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
                    </div>
                </nav>
                <div className="container-fluid p-4 flex-grow-1">
                    <h2 className="mb-4">Edit Product: {product.name} (ID: {productId})</h2>
                    <button className="btn btn-secondary mb-3" onClick={() => navigate('/admin/products')}>Back to Products</button>

                    <form onSubmit={handleUpdateProductSubmit} className="needs-validation" noValidate>
                        {updateProductError && <div className="alert alert-danger">{updateProductError}</div>}
                        {updateProductSuccess && <div className="alert alert-success">Product updated successfully!</div>}

                        <div className="mb-3">
                            <label htmlFor="editProductName" className="form-label">Product Name</label>
                            <input
                                type="text"
                                className="form-control"
                                id="editProductName"
                                value={editProductName}
                                onChange={(e) => setEditProductName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="editProductDescription" className="form-label">Description</label>
                            <textarea
                                className="form-control"
                                id="editProductDescription"
                                rows="3"
                                value={editProductDescription}
                                onChange={(e) => setEditProductDescription(e.target.value)}
                            ></textarea>
                        </div>

                        <div className="row">
                            <div className="col-md-4 mb-3">
                                <label htmlFor="editProductPrice" className="form-label">Price</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    id="editProductPrice"
                                    step="0.01"
                                    value={editProductPrice}
                                    onChange={(e) => setEditProductPrice(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="col-md-4 mb-3">
                                <label htmlFor="editProductDiscountPercentage" className="form-label">Discount Percentage (%)</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    id="editProductDiscountPercentage"
                                    step="0.01" // Allow decimal percentages
                                    min="0"
                                    max="100"
                                    value={editProductDiscountPercentage}
                                    onChange={(e) => setEditProductDiscountPercentage(e.target.value)}
                                />
                            </div>
                            <div className="col-md-4 mb-3">
                                <label className="form-label">Final Price</label>
                                <p className="form-control-plaintext fw-bold">
                                    {calculateFinalPrice(editProductPrice, editProductDiscountPercentage)}
                                </p>
                            </div>
                        </div>

                        <div className="mb-3">
                            <label htmlFor="editProductStock" className="form-label">Stock Quantity</label>
                            <input
                                type="number"
                                className="form-control"
                                id="editProductStock"
                                value={editProductStock}
                                onChange={(e) => setEditProductStock(e.target.value)}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="editProductCategory" className="form-label">Category</label>
                            <select
                                className="form-select"
                                id="editProductCategory"
                                value={editProductCategoryId}
                                onChange={(e) => setEditProductCategoryId(e.target.value)}
                                required
                            >
                                {categories.length > 0 ? (
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
                            <label htmlFor="editProductBrand" className="form-label">Brand</label>
                            <input
                                type="text"
                                className="form-control"
                                id="editProductBrand"
                                value={editProductBrand}
                                onChange={(e) => setEditProductBrand(e.target.value)}
                            />
                        </div>

                        <div className="row">
                            <div className="col-md-4 mb-3">
                                <label htmlFor="editProductMaterial" className="form-label">Material</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="editProductMaterial"
                                    value={editProductMaterial}
                                    onChange={(e) => setEditProductMaterial(e.target.value)}
                                />
                            </div>
                            <div className="col-md-4 mb-3">
                                <label htmlFor="editProductColor" className="form-label">Color</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="editProductColor"
                                    value={editProductColor}
                                    onChange={(e) => setEditProductColor(e.target.value)}
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
                                                id={`edit-size-${size}`}
                                                value={size}
                                                checked={editProductSizes.includes(size)}
                                                onChange={handleSizeChange}
                                            />
                                            <label className="form-check-label" htmlFor={`edit-size-${size}`}>{size}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mb-3">
                            <label htmlFor="editProductGender" className="form-label">Gender</label>
                            <select
                                className="form-select"
                                id="editProductGender"
                                value={editProductGender}
                                onChange={(e) => setEditProductGender(e.target.value)}
                            >
                                <option value="">Select Gender (Optional)</option>
                                {AVAILABLE_GENDERS.map(gender => (
                                    <option key={gender} value={gender}>{gender}</option>
                                ))}
                            </select>
                        </div>

                        {/* --- Image Management Section --- */}
                        <h4 className="mt-4 mb-3">Product Images</h4>

                        {/* Current Primary Image */}
                        <div className="mb-3">
                            <label className="form-label">Current Primary Image</label>
                            <div className="d-flex align-items-center gap-3">
                                {existingImages.find(img => img.is_thumbnail) ? (
                                    <img
                                        src={`${API_BASE_URL}${existingImages.find(img => img.is_thumbnail).image_url}`}
                                        alt="Current Primary"
                                        className="img-thumbnail"
                                        style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div style={{ width: '100px', height: '100px', backgroundColor: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}>
                                        No Primary
                                    </div>
                                )}
                                <p className="mb-0 text-muted">
                                    {existingImages.find(img => img.is_thumbnail) ? existingImages.find(img => img.is_thumbnail).image_url.split('/').pop() : 'No primary image set.'}
                                </p>
                            </div>
                        </div>

                        {/* Replace Primary Image Input */}
                        <div className="mb-3">
                            <label htmlFor="newPrimaryImage" className="form-label">Replace Primary Image (Optional)</label>
                            <input
                                type="file"
                                className="form-control"
                                id="newPrimaryImage"
                                accept="image/*"
                                onChange={handleNewPrimaryImageChange}
                                ref={primaryFileInputRef}
                            />
                            {newPrimaryImagePreview && (
                                <div className="mt-2">
                                    <small className="text-muted">New primary image preview:</small>
                                    <div className="d-flex flex-wrap gap-2 mt-2">
                                        <img
                                            src={newPrimaryImagePreview}
                                            alt="New Primary Preview"
                                            className="img-thumbnail"
                                            style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* All Existing Images (with remove functionality for non-primary) */}
                        {existingImages.length > 0 && (
                            <div className="mb-3 mt-4">
                                <label className="form-label">Manage Existing Images</label>
                                <div className="d-flex flex-wrap gap-2">
                                    {existingImages.map((img) => (
                                        <div key={img.image_id} className="position-relative">
                                            <img
                                                src={`${API_BASE_URL}${img.image_url}`}
                                                alt={img.alt_text || `Product image ${img.image_id}`}
                                                className="img-thumbnail"
                                                style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                            />
                                            {!img.is_thumbnail && ( // Only show remove button for non-thumbnail images
                                                <button
                                                    type="button"
                                                    className="btn-close position-absolute top-0 end-0 bg-light rounded-circle p-1"
                                                    style={{ fontSize: '0.6rem' }}
                                                    onClick={() => handleRemoveExistingImage(img.image_id, img.image_url, img.is_thumbnail)}
                                                ></button>
                                            )}
                                            {img.is_thumbnail && (
                                                <span className="badge bg-primary position-absolute bottom-0 start-0 translate-middle-y ms-1">Primary</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {updateProductError && updateProductError.includes('primary image') && (
                                    <div className="text-danger mt-2">
                                        {updateProductError}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Add More Images Input */}
                        <div className="mb-3">
                            <label htmlFor="newAdditionalImages" className="form-label">Add More Images (Optional)</label>
                            <input
                                type="file"
                                className="form-control"
                                id="newAdditionalImages"
                                accept="image/*"
                                multiple
                                onChange={handleNewAdditionalImagesChange}
                                ref={additionalFileInputRef}
                            />
                            {newAdditionalImagePreviews.length > 0 && (
                                <div className="mt-2">
                                    <small className="text-muted">New additional image previews:</small>
                                    <div className="d-flex flex-wrap gap-2 mt-2">
                                        {newAdditionalImagePreviews.map((url, index) => (
                                            <img
                                                key={index}
                                                src={url}
                                                alt={`New Additional Preview ${index + 1}`}
                                                className="img-thumbnail"
                                                style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={updatingProduct}>
                            {updatingProduct ? 'Updating Product...' : 'Update Product'}
                        </button>
                    </form>
                </div>
                <footer className="bg-dark text-white text-center py-3 w-100">
                    <p className="mb-0">&copy; Admin Panel 2024</p>
                </footer>
            </div>
        </div>
    );
}

export default AdminEditProduct;