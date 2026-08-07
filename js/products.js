document.addEventListener('DOMContentLoaded', () => {
    const productsGrid = document.querySelector('.products-grid');
    const detailsContainer = document.getElementById('product-details-container');

    const loadProducts = async () => {
        try {
            const resp = await fetch('api/products/get_products.php');
            const data = await resp.json();

            if (data.status === 'success') {
                renderProducts(data.products);
                renderProductSections(data.products);
            }
        } catch (err) {
            console.error('Error loading products:', err);
        }
    };

    const renderProducts = (products) => {
        if (!productsGrid) return;
        productsGrid.innerHTML = products.map(p => `
            <div class="product-card">
                <div class="product-image">
                    <img src="${p.main_image || 'https://placehold.co/600x400?text=No+Image'}" alt="${p.name}">
                    ${p.badge ? `<div class="product-badge">${p.badge}</div>` : ''}
                </div>
                <div class="product-content">
                    <h3>${p.name}</h3>
                    <p class="product-description">${p.description}</p>
                    <div class="product-meta">
                        <span class="product-category"><i class="fas fa-tag"></i> ${p.category}</span>
                        <span class="product-rating">${renderRating(p.rating)}</span>
                    </div>
                    <div class="product-price" style="margin-top: 10px; font-weight: bold; font-size: 1.1rem; color: var(--accent-color);">
                        &#8377; ${parseFloat(p.amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                    <a href="#${p.section_id || p.slug}" class="product-link">Learn More <i class="fas fa-arrow-right"></i></a>
                </div>
            </div>
        `).join('');
    };

    const renderProductSections = async (products) => {
        if (!detailsContainer) return;
        detailsContainer.innerHTML = ''; // Clear loading

        for (const p of products) {
            const section = document.createElement('section');
            section.id = p.section_id || p.slug;
            section.className = `product-detail-section ${products.indexOf(p) % 2 !== 0 ? 'alt-bg' : ''}`;

            section.innerHTML = `
                <div class="container">
                    <div class="product-detail-grid ${products.indexOf(p) % 2 !== 0 ? 'reverse' : ''}">
                        <div class="product-detail-content">
                            <div class="product-header">
                                <h2>${p.name}</h2>
                                <p class="product-tagline">${p.tagline || ''}</p>
                            </div>
                            <div class="product-features" id="features-${p.id}">
                                <h3><i class="fas fa-list-check"></i> Key Features</h3>
                                <ul class="feature-list"><li><i class="fas fa-spinner fa-spin"></i> Loading...</li></ul>
                            </div>
                            <div class="product-use-cases" id="usecases-${p.id}">
                                <h3><i class="fas fa-lightbulb"></i> Use Cases</h3>
                                <ul class="use-cases-list"><li><i class="fas fa-spinner fa-spin"></i> Loading...</li></ul>
                            </div>
                            <div class="product-actions" id="actions-${p.id}"></div>
                        </div>
                        <div class="product-detail-gallery" id="gallery-${p.id}">
                            <div class="gallery-container">
                                <div class="gallery-thumbnails-side"></div>
                                <div class="main-image"><img src="" alt="${p.name}"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            detailsContainer.appendChild(section);

            // Special case for comparison table (kept static-ish for now if has_comparison is true)
            if (p.has_comparison == 1) {
                const compSection = createComparisonSection(p.name);
                detailsContainer.appendChild(compSection);
            }

            // Lazy load the details
            loadSingleProductDetails(p.id);
        }
    };

    const createComparisonSection = (productName) => {
        const sect = document.createElement('section');
        sect.id = "product-comparison";
        sect.innerHTML = `
            <div class="container">
                <div class="section-header">
                    <h2>Product Comparison (${productName})</h2>
                    <p>Find the right solution for your specific needs</p>
                </div>
                <div class="comparison-table-wrapper">
                    <table class="comparison-table">
                        <thead>
                            <tr>
                                <th>Feature</th>
                                <th>Basic Model (OmniSWAS101)</th>
                                <th>Standard Model (OmniSWAS201)</th>
                                <th>Standard Model (OmniSWAS202)</th>
                                <th>Pro Model (OmniSWAS302)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>Price (Including GST)</td><td>&#8377; 9,999</td><td>&#8377; 12,999</td><td>&#8377; 13,499</td><td>&#8377; 15,499</td></tr>
                            <tr><td>Alarm Control WiFi</td><td><i class="fas fa-check"></i></td><td><i class="fas fa-check"></i></td><td><i class="fas fa-check"></i></td><td><i class="fas fa-check"></i></td></tr>
                            <tr><td>Multiple Profiles</td><td><i class="fas fa-times"></i></td><td><i class="fas fa-check"></i></td><td><i class="fas fa-check"></i></td><td><i class="fas fa-check"></i></td></tr>
                            <tr><td>No. of Profiles</td><td>1</td><td>3</td><td>3</td><td>6</td></tr>
                            <tr><td>Total Alarms Supported</td><td>20</td><td>60</td><td>60</td><td>192</td></tr>
                            <tr><td>OLED Display</td><td><i class="fas fa-times"></i></td><td><i class="fas fa-times"></i></td><td><i class="fas fa-check"></i></td><td><i class="fas fa-check"></i></td></tr>
                            <tr><td>IP 67 Waterproof</td><td><i class="fas fa-check"></i></td><td><i class="fas fa-check"></i></td><td><i class="fas fa-check"></i></td><td><i class="fas fa-check"></i></td></tr>
                            <tr><td>Best For</td><td>Schools</td><td>Colleges</td><td>Training Centers</td><td>Large Factories</td></tr>
                            <tr><td></td>
                                <td><a href="https://wa.me/919825246857?text=Order%20SWAS101" class="btn-primary" style="background:#009973;border-color:#009973;font-size:0.8rem">Order Now</a></td>
                                <td><a href="https://wa.me/919825246857?text=Order%20SWAS201" class="btn-primary" style="background:#009973;border-color:#009973;font-size:0.8rem">Order Now</a></td>
                                <td><a href="https://wa.me/919825246857?text=Order%20SWAS202" class="btn-primary" style="background:#009973;border-color:#009973;font-size:0.8rem">Order Now</a></td>
                                <td><a href="https://wa.me/919825246857?text=Order%20SWAS302" class="btn-primary" style="background:#009973;border-color:#009973;font-size:0.8rem">Order Now</a></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        return sect;
    }

    const loadSingleProductDetails = async (id) => {
        try {
            const resp = await fetch(`api/products/get_product_details.php?id=${id}`);
            const data = await resp.json();
            if (data.status === 'success') {
                const p = data.product;

                // Features
                const fList = document.querySelector(`#features-${id} .feature-list`);
                if (fList) fList.innerHTML = data.features.map(f => `<li><i class="fas fa-check-circle"></i> ${f}</li>`).join('');

                // Use Cases
                const uList = document.querySelector(`#usecases-${id} .use-cases-list`);
                if (uList) uList.innerHTML = data.use_cases.map(u => `<li><i class="fas fa-lightbulb"></i> <strong>${u.topic}:</strong> ${u.detail}</li>`).join('');

                // Actions
                const actions = document.getElementById(`actions-${id}`);
                if (actions && p.primary_action_label) {
                    let html = `<a href="${p.primary_action_url}" class="btn-primary"><i class="fas fa-calendar-check"></i> ${p.primary_action_label}</a>`;
                    if (p.secondary_action_label) {
                        html += ` <a href="${p.secondary_action_url}" class="btn-secondary"><i class="fas fa-file-alt"></i> ${p.secondary_action_label}</a>`;
                    }
                    actions.innerHTML = html;
                }

                // Gallery
                const gallery = document.getElementById(`gallery-${id}`);
                const mainImg = gallery.querySelector('.main-image img');
                const thumbs = gallery.querySelector('.gallery-thumbnails-side');
                if (mainImg && data.images.length > 0) mainImg.src = data.images[0];
                if (thumbs) {
                    thumbs.innerHTML = data.images.map((img, i) => `
                        <div class="thumbnail-item ${i === 0 ? 'active' : ''}">
                            <img src="${img}" alt="Thumb ${i}" data-full="${img}">
                        </div>
                    `).join('');
                    thumbs.querySelectorAll('.thumbnail-item img').forEach(img => {
                        img.onclick = () => {
                            thumbs.querySelectorAll('.thumbnail-item').forEach(t => t.classList.remove('active'));
                            img.parentElement.classList.add('active');
                            mainImg.src = img.dataset.full;
                        };
                    });
                }
            }
        } catch (err) { console.error(`Error loading details for ${id}:`, err); }
    };

    const renderRating = (rating) => {
        const full = Math.floor(rating);
        const half = rating % 1 >= 0.5;
        let html = '';
        for (let i = 0; i < full; i++) html += '<i class="fas fa-star"></i>';
        if (half) html += '<i class="fas fa-star-half-alt"></i>';
        for (let i = full + (half ? 1 : 0); i < 5; i++) html += '<i class="far fa-star"></i>';
        return html;
    };

    loadProducts();
});
