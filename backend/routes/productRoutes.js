// backend/routes/productRoutes.js
const express = require('express');
const db = require('../config/db.config'); // Ensure this path is correct
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Node.js built-in module for file system operations

module.exports = (authMiddleware) => {
    const router = express.Router();

    // --- Multer Storage Configuration for Multiple Product Images ---
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadDir = path.join(__dirname, '../uploads/products');
            console.log("Multer attempting to save files to destination:", uploadDir);
            if (!fs.existsSync(uploadDir)) {
                try {
                    fs.mkdirSync(uploadDir, { recursive: true });
                    console.log(`Successfully created upload directory: ${uploadDir}`);
                } catch (mkdirErr) {
                    console.error(`ERROR: Failed to create upload directory ${uploadDir}:`, mkdirErr);
                    return cb(mkdir);
                }
            }
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const uniqueFilename = Date.now() + '-' + file.originalname;
            console.log("Multer generated filename:", uniqueFilename);
            cb(null, uniqueFilename);
        }
    });

    const upload = multer({ storage: storage });

    // --- HELPER FUNCTION: Get Absolute File Path from DB URL ---
    const getAbsoluteFilePath = (imageUrlFromDb) => {
        if (!imageUrlFromDb) return null;
        const backendRoot = path.resolve(__dirname, '..'); 
        return path.join(backendRoot, imageUrlFromDb);
    };

    // --- ROUTE: Add New Product with Multiple Images and Multiple Sizes ---
    router.post(
        '/',
        authMiddleware.verifyToken,
        authMiddleware.authorizeRoles(['admin']),
        upload.array('images', 5),
        async (req, res) => {
            console.log('\n--- Add Product Request Hit (Multiple Images) ---');
            console.log('Multer req.files object (array of uploaded files):', req.files);
            console.log('req.body (product data from form fields):', req.body);
            console.log('--- End Add Product Request ---');

            try {
                const {
                    name, description, price, stock_quantity,
                    category_id, brand, material, color, gender,
                    discount_percentage, // CHANGED: from discount_price to discount_percentage
                    sizes
                } = req.body;

                if (!name || !price || !stock_quantity || !category_id) {
                    if (req.files && req.files.length > 0) {
                        req.files.forEach(file => {
                            fs.unlink(file.path, (err) => {
                                if (err) console.error('Error deleting partially uploaded file:', err);
                            });
                        });
                    }
                    return res.status(400).json({ message: 'Product name, price, stock quantity, and category are required.' });
                }

                const imageUrls = (req.files || []).map(file => `/uploads/products/${file.filename}`);
                const primaryImageForProductsTable = imageUrls.length > 0 ? imageUrls[0] : null;

                const sku = `PROD-${Date.now()}`;
                
                let parsedSizes = [];
                if (sizes) {
                    try {
                        parsedSizes = JSON.parse(sizes);
                        if (!Array.isArray(parsedSizes)) {
                            throw new Error('Sizes must be an array.');
                        }
                    } catch (parseError) {
                        console.error('Error parsing sizes:', parseError);
                        throw new Error('Invalid sizes format.');
                    }
                }
                const sizesString = parsedSizes.join(',');

                // CHANGED: Handle discount_percentage: convert empty string to null for DECIMAL column
                const finalDiscountPercentage = discount_percentage === '' ? null : parseFloat(discount_percentage);


                // Insert product into the 'products' table
                const [result] = await db.execute(
                    'INSERT INTO products (name, description, price, stock_quantity, category_id, image_url, brand, material, color, size, gender, sku, discount_percentage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', // CHANGED: discount_price to discount_percentage
                    [name, description, price, stock_quantity, category_id, primaryImageForProductsTable, brand, material, color, sizesString, gender, sku, finalDiscountPercentage] // Use finalDiscountPercentage
                );

                const productId = result.insertId;

                // --- IMPORTANT: Insert ALL images into the product_images table ---
                if (imageUrls.length > 0) {
                    const imageInsertPromises = imageUrls.map((url, index) => {
                        const isThumbnail = index === 0 ? 1 : 0;
                        return db.execute(
                            'INSERT INTO product_images (product_id, image_url, alt_text, is_thumbnail) VALUES (?, ?, ?, ?)',
                            [productId, url, `${name} Image ${index + 1}`, isThumbnail]
                        );
                    });
                    await Promise.all(imageInsertPromises);
                    console.log(`Product ID ${productId}: All ${imageUrls.length} images inserted into product_images table.`);
                } else {
                    console.log(`Product ID ${productId}: No images uploaded.`);
                }

                res.status(201).json({
                    message: 'Product added successfully!',
                    productId,
                    primaryImageUrl: primaryImageForProductsTable,
                    allImageUrls: imageUrls,
                    sku
                });

            } catch (error) {
                console.error('Error adding product:', error);
                if (req.files && req.files.length > 0) {
                    req.files.forEach(file => {
                        fs.unlink(file.path, (err) => {
                            if (err) console.error('Error deleting partially uploaded file:', err);
                        });
                    });
                }
                res.status(500).json({ message: 'Failed to add product.' });
            }
        }
    );

    router.put(
    '/:id/toggle-popular',
    authMiddleware.verifyToken,
    authMiddleware.authorizeRoles(['admin']),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { is_popular } = req.body; // Expecting true/false or 1/0

            // Validate input
            if (typeof is_popular !== 'boolean' && is_popular !== 0 && is_popular !== 1) {
                return res.status(400).json({ message: 'Invalid value for is_popular. Must be boolean (true/false) or (0/1).' });
            }
            
            const [result] = await db.execute(
                'UPDATE products SET is_popular = ? WHERE product_id = ?',
                [is_popular ? 1 : 0, id] // Convert boolean to 1 or 0 for TINYINT
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Product not found.' });
            }

            res.status(200).json({
                message: `Product ${id} popularity status updated successfully.`,
                is_popular: is_popular
            });

        } catch (error) {
            console.error('Error toggling product popularity:', error);
            res.status(500).json({ message: 'Failed to update product popularity.' });
        }
    }
);


// Modify your existing /popular route in productRoutes.js
router.get('/popular', async (req, res) => {
        try {
            // SQL query to fetch popular products with their thumbnail image
            const [products] = await db.execute(`
                SELECT
                    p.product_id AS id,
                    p.name,
                    p.price,
                    p.discount_percentage,
                    pi.image_url AS image,
                    p.category_id,
                    p.gender
                FROM products p
                JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_thumbnail = 1
                WHERE p.is_popular = 1
                ORDER BY p.name ASC;
            `);

            // Format the products to match the expected structure for your frontend Item component
            const formattedProducts = products.map(product => {
                const originalPrice = parseFloat(product.price);
                const discountPercentage = parseFloat(product.discount_percentage || 0);

                // Calculate new_price based on original price and discount percentage
                const newPrice = originalPrice * (1 - discountPercentage / 100);

                return {
                    id: product.id,
                    name: product.name,
                    image: product.image,
                    new_price: parseFloat(newPrice.toFixed(2)),
                    old_price: parseFloat(originalPrice.toFixed(2)) // Original price from DB becomes old_price
                };
            });

            res.status(200).json(formattedProducts);
        } catch (error) {
            console.error('Error fetching popular products:', error);
            res.status(500).json({ message: 'Failed to fetch popular products.' });
        }
    });



    // --- ROUTE: Get All Products (by Category ID optional) ---
    router.get('/', async (req, res) => {
        try {
            const categoryId = req.query.category_id;
            let query = `
                SELECT 
                    p.*, 
                    GROUP_CONCAT(pi.image_url ORDER BY pi.is_thumbnail DESC, pi.image_id ASC) AS all_image_urls
                FROM products p
                LEFT JOIN product_images pi ON p.product_id = pi.product_id
            `;
            const params = [];

            if (categoryId) {
                query += ' WHERE p.category_id = ?';
                params.push(categoryId);
            }
            query += ' GROUP BY p.product_id';

            const [products] = await db.execute(query, params);
            
            const productsWithImages = products.map(product => ({
                ...product,
                all_image_urls: product.all_image_urls ? product.all_image_urls.split(',') : [],
                image_url: product.image_url,
                sizes: product.size ? product.size.split(',') : []
            }));

            res.status(200).json(productsWithImages);
        } catch (error) {
            console.error('Error fetching products:', error);
            res.status(500).json({ message: 'Failed to fetch products.' });
        }
    });

    // --- ROUTE: Get Product by ID ---
    router.get('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const [productRows] = await db.execute(`
                SELECT 
                    p.*, 
                    GROUP_CONCAT(pi.image_id ORDER BY pi.is_thumbnail DESC, pi.image_id ASC) AS image_ids,
                    GROUP_CONCAT(pi.image_url ORDER BY pi.is_thumbnail DESC, pi.image_id ASC) AS image_urls,
                    GROUP_CONCAT(pi.alt_text ORDER BY pi.is_thumbnail DESC, pi.image_id ASC) AS image_alt_texts,
                    GROUP_CONCAT(pi.is_thumbnail ORDER BY pi.is_thumbnail DESC, pi.image_id ASC) AS image_is_thumbnails
                FROM products p
                LEFT JOIN product_images pi ON p.product_id = pi.product_id
                WHERE p.product_id = ?
                GROUP BY p.product_id
            `, [id]);

            if (productRows.length === 0) {
                return res.status(404).json({ message: 'Product not found.' });
            }
            
            const productData = productRows[0];
            const allImages = [];

            if (productData.image_ids) {
                const ids = productData.image_ids.split(',');
                const urls = productData.image_urls.split(',');
                const altTexts = productData.image_alt_texts.split(',');
                const isThumbnails = productData.image_is_thumbnails.split(',').map(val => val === '1');
                
                for (let i = 0; i < ids.length; i++) {
                    allImages.push({
                        image_id: parseInt(ids[i], 10),
                        image_url: urls[i],
                        alt_text: altTexts[i],
                        is_thumbnail: isThumbnails[i]
                    });
                }
            }

            const product = {
                ...productData,
                all_images: allImages,
                all_image_urls: allImages.map(img => img.image_url),
                sizes: productData.size ? productData.size.split(',') : []
            };
            delete product.image_ids;
            delete product.image_urls;
            delete product.image_alt_texts;
            delete product.image_is_thumbnails;

            res.status(200).json(product);
        } catch (error) {
            console.error('Error fetching product by ID:', error);
            res.status(500).json({ message: 'Failed to fetch product.' });
        }
    });

    // --- ROUTE: Update Product with Multiple Image Management, Multiple Sizes, and Discount Percentage ---
    router.put(
        '/:id',
        authMiddleware.verifyToken,
        authMiddleware.authorizeRoles(['admin']),
        upload.fields([
            { name: 'primaryImage', maxCount: 1 },
            { name: 'newAdditionalImages', maxCount: 5 }
        ]),
        async (req, res) => {
            console.log('\n--- Update Product Request Hit (Multi-Image Management) ---');
            console.log('Multer req.files object:', req.files);
            console.log('req.body (product data + imagesToDelete):', req.body);
            console.log('--- End Update Product Request ---');

            const connection = await db.getConnection();
            try {
                await connection.beginTransaction();

                const { id } = req.params;
                const {
                    name, description, price, stock_quantity,
                    category_id, brand, material, color, gender,
                    discount_percentage, // CHANGED: from discount_price to discount_percentage
                    sizes,
                    imagesToDelete
                } = req.body;

                let parsedImagesToDelete = [];
                if (imagesToDelete) {
                    try {
                        parsedImagesToDelete = JSON.parse(imagesToDelete);
                        if (!Array.isArray(parsedImagesToDelete)) {
                            throw new Error('imagesToDelete must be an array.');
                        }
                    } catch (parseError) {
                        console.error('Error parsing imagesToDelete:', parseError);
                        throw new Error('Invalid imagesToDelete format.');
                    }
                }

                const newPrimaryImageFile = req.files && req.files.primaryImage ? req.files.primaryImage[0] : null;
                const newAdditionalImageFiles = req.files && req.files.newAdditionalImages ? req.files.newAdditionalImages : [];

                const updateFields = [];
                const updateValues = [];

                if (name) { updateFields.push('name = ?'); updateValues.push(name); }
                if (description) { updateFields.push('description = ?'); updateValues.push(description); }
                if (price) { updateFields.push('price = ?'); updateValues.push(price); }
                if (stock_quantity) { updateFields.push('stock_quantity = ?'); updateValues.push(stock_quantity); }
                if (category_id) { updateFields.push('category_id = ?'); updateValues.push(category_id); }
                if (brand) { updateFields.push('brand = ?'); updateValues.push(brand); }
                if (material) { updateFields.push('material = ?'); updateValues.push(material); }
                if (color) { updateFields.push('color = ?'); updateValues.push(color); }
                if (gender) { updateFields.push('gender = ?'); updateValues.push(gender); }
                
                // CHANGED: Handle discount_percentage for update
                if (discount_percentage !== undefined) { 
                    updateFields.push('discount_percentage = ?'); 
                    updateValues.push(discount_percentage === '' ? null : parseFloat(discount_percentage)); 
                } 
                
                if (sizes !== undefined) { 
                    let parsedUpdateSizes = [];
                    try {
                        parsedUpdateSizes = JSON.parse(sizes);
                        if (!Array.isArray(parsedUpdateSizes)) {
                            throw new Error('Sizes must be an array.');
                        }
                    } catch (parseError) {
                        console.error('Error parsing sizes for update:', parseError);
                        throw new Error('Invalid sizes format for update.');
                    }
                    updateFields.push('size = ?'); 
                    updateValues.push(parsedUpdateSizes.join(',')); 
                }

                // --- 1. Handle Deletion of Existing Images ---
                if (parsedImagesToDelete.length > 0) {
                    const placeholders = parsedImagesToDelete.map(() => '?').join(',');
                    const [imagesToDeleteRows] = await connection.execute(
                        `SELECT image_url FROM product_images WHERE image_id IN (${placeholders}) AND product_id = ?`,
                        [...parsedImagesToDelete, id]
                    );

                    imagesToDeleteRows.forEach(row => {
                        const imagePath = getAbsoluteFilePath(row.image_url);
                        if (imagePath && fs.existsSync(imagePath)) {
                            fs.unlink(imagePath, (err) => {
                                if (err) console.error(`Error deleting file ${imagePath}:`, err);
                            });
                        }
                    });

                    await connection.execute(
                        `DELETE FROM product_images WHERE image_id IN (${placeholders}) AND product_id = ?`,
                        [...parsedImagesToDelete, id]
                    );

                    const [currentPrimary] = await connection.execute('SELECT image_url FROM products WHERE product_id = ?', [id]);
                    if (currentPrimary.length > 0 && parsedImagesToDelete.includes(currentPrimary[0].image_url)) {
                        updateFields.push('image_url = NULL');
                    }
                }

                // --- 2. Handle New Primary Image Replacement ---
                let finalPrimaryImageUrl = null;
                if (newPrimaryImageFile) {
                    const newPrimaryImageUrl = `/uploads/products/${newPrimaryImageFile.filename}`;
                    
                    const [oldPrimaryProductRows] = await connection.execute('SELECT image_url FROM products WHERE product_id = ?', [id]);
                    if (oldPrimaryProductRows.length > 0 && oldPrimaryProductRows[0].image_url) {
                        const oldPrimaryImagePath = getAbsoluteFilePath(oldPrimaryProductRows[0].image_url);
                        if (oldPrimaryImagePath && fs.existsSync(oldPrimaryImagePath)) {
                            fs.unlink(oldPrimaryImagePath, (err) => {
                                if (err) console.error('Error deleting old primary image file:', err);
                            });
                        }
                    }

                    await connection.execute('DELETE FROM product_images WHERE product_id = ? AND is_thumbnail = 1', [id]);
                    
                    await connection.execute(
                        'INSERT INTO product_images (product_id, image_url, alt_text, is_thumbnail) VALUES (?, ?, ?, ?)',
                        [id, newPrimaryImageUrl, `${name} Main Image`, 1]
                    );
                    
                    updateFields.push('image_url = ?');
                    updateValues.push(newPrimaryImageUrl);
                    finalPrimaryImageUrl = newPrimaryImageUrl;

                } else {
                    const [currentPrimary] = await connection.execute('SELECT image_url FROM products WHERE product_id = ?', [id]);
                    if (currentPrimary.length > 0) {
                        finalPrimaryImageUrl = currentPrimary[0].image_url;
                    }
                }

                // --- 3. Handle New Additional Images ---
                if (newAdditionalImageFiles.length > 0) {
                    const newAdditionalImagePromises = newAdditionalImageFiles.map(file => {
                        const imageUrl = `/uploads/products/${file.filename}`;
                        return connection.execute(
                            'INSERT INTO product_images (product_id, image_url, alt_text, is_thumbnail) VALUES (?, ?, ?, ?)',
                            [id, imageUrl, `${name} Additional Image`, 0]
                        );
                    });
                    await Promise.all(newAdditionalImagePromises);
                }

                // --- 4. Update Product Details in products table ---
                if (updateFields.length === 0 && !newPrimaryImageFile && newAdditionalImageFiles.length === 0 && parsedImagesToDelete.length === 0) {
                    return res.status(400).json({ message: 'No fields or image changes provided for update.' });
                }

                const query = `UPDATE products SET ${updateFields.join(', ')} WHERE product_id = ?`;
                const [result] = await connection.execute(query, [...updateValues, id]);

                if (result.affectedRows === 0) {
                    await connection.rollback();
                    if (newPrimaryImageFile) fs.unlink(newPrimaryImageFile.path, (err) => { if (err) console.error('Error deleting orphaned primary image file:', err); });
                    newAdditionalImageFiles.forEach(file => fs.unlink(file.path, (err) => { if (err) console.error('Error deleting orphaned additional image file:', err); }));
                    return res.status(404).json({ message: 'Product not found or no changes made.' });
                }

                await connection.commit();

                res.status(200).json({
                    message: 'Product updated successfully.',
                    primaryImageUrl: finalPrimaryImageUrl
                });

            } catch (error) {
                await connection.rollback();
                console.error('Error updating product:', error);
                if (req.files) {
                    if (req.files.primaryImage) {
                        req.files.primaryImage.forEach(file => fs.unlink(file.path, (err) => { if (err) console.error('Error deleting uploaded file on error:', err); }));
                    }
                    if (req.files.newAdditionalImages) {
                        req.files.newAdditionalImages.forEach(file => fs.unlink(file.path, (err) => { if (err) console.error('Error deleting uploaded file on error:', err); }));
                    }
                }
                res.status(500).json({ message: 'Failed to update product.' });
            } finally {
                connection.release();
            }
        }
    );

    // --- ROUTE: Delete Product ---
    router.delete('/:id', authMiddleware.verifyToken, authMiddleware.authorizeRoles(['admin']), async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { id } = req.params;

            const [productImageRows] = await connection.execute('SELECT image_url FROM product_images WHERE product_id = ?', [id]);
            
            if (productImageRows.length > 0) {
                productImageRows.forEach(row => {
                    const imagePath = getAbsoluteFilePath(row.image_url);
                    if (imagePath && fs.existsSync(imagePath)) {
                        fs.unlink(imagePath, (err) => {
                            if (err) console.error(`Error deleting product image file ${imagePath}:`, err);
                        });
                    }
                });
            }

            await connection.execute('DELETE FROM product_images WHERE product_id = ?', [id]);

            const [result] = await connection.execute('DELETE FROM products WHERE product_id = ?', [id]);

            if (result.affectedRows === 0) {
                await connection.rollback();
                return res.status(404).json({ message: 'Product not found.' });
            }

            await connection.commit();
            res.status(200).json({ message: 'Product deleted successfully.' });

        } catch (error) {
            await connection.rollback();
            console.error('Error deleting product:', error);
            res.status(500).json({ message: 'Failed to delete product.' });
        } finally {
            connection.release();
        }
    });

    return router;
};