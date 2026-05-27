// js/products.js
// Client-side interactive features and API integration for OmniTeq Products Page

const initProductGalleries = () => {
    const galleries = document.querySelectorAll('.product-detail-gallery');
    
    galleries.forEach(gallery => {
        const mainImg = gallery.querySelector('.main-image img');
        const thumbs = gallery.querySelectorAll('.gallery-thumbnails-side .thumbnail-item img');
        
        thumbs.forEach(thumb => {
            thumb.addEventListener('click', () => {
                const parentItem = thumb.parentElement;
                const siblingItems = parentItem.parentElement.querySelectorAll('.thumbnail-item');
                
                siblingItems.forEach(item => item.classList.remove('active'));
                parentItem.classList.add('active');
                
                if (mainImg) {
                    const fullSrc = thumb.getAttribute('data-full') || thumb.getAttribute('src');
                    mainImg.src = fullSrc;
                }
            });
        });
    });
};

const generateStarsHTML = (rating) => {
    const r = parseFloat(rating) || 5.0;
    const fullStars = Math.floor(r);
    const hasHalf = (r - fullStars) >= 0.4;
    let starsHTML = '';
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            starsHTML += '<i class="fas fa-star"></i>';
        } else if (i === fullStars && hasHalf) {
            starsHTML += '<i class="fas fa-star-half-alt"></i>';
        } else {
            starsHTML += '<i class="far fa-star"></i>';
        }
    }
    return starsHTML;
};

const getPrimaryIcon = (label) => {
    if (!label) return '';
    const l = label.toLowerCase();
    if (l.includes('demo')) return '<i class="fas fa-calendar-check"></i> ';
    if (l.includes('order')) return '<i class="fas fa-shopping-cart"></i> ';
    if (l.includes('quote')) return '<i class="fas fa-file-invoice-dollar"></i> ';
    return '<i class="fas fa-arrow-right"></i> ';
};

const getSecondaryIcon = (label) => {
    if (!label) return '';
    const l = label.toLowerCase();
    if (l.includes('doc') || l.includes('spec') || l.includes('catalog') || l.includes('brochure')) {
        return '<i class="fas fa-file-alt"></i> ';
    }
    return '';
};

const loadProducts = async () => {
    const gridContainer = document.querySelector('.products-grid');
    const detailsContainer = document.getElementById('product-details-container');
    
    if (!gridContainer || !detailsContainer) return;
    
    // Save comparison table
    const comparisonTable = document.getElementById('product-comparison');
    
    try {
        gridContainer.innerHTML = '<div class="loading-spinner" style="grid-column: 1/-1; text-align: center; padding: 50px;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary);"></i><p style="margin-top: 15px; color: var(--text-muted-dark);">Loading products...</p></div>';
        detailsContainer.innerHTML = '';
        
        const response = await fetch('api/products/get_products.php');
        const data = await response.json();
        
        if (data.status !== 'success') {
            throw new Error(data.message || 'Failed to fetch products');
        }
        
        gridContainer.innerHTML = '';
        
        data.products.forEach((product, index) => {
            // Render grid card
            const price = parseFloat(product.amount).toLocaleString('en-IN');
            const badgeHTML = product.badge ? `<div class="product-badge">${product.badge}</div>` : '';
            const starsHTML = generateStarsHTML(product.rating);
            
            const cardHTML = `
                <div class="product-card glass-panel animate-on-scroll visible" style="opacity: 1; transform: none;">
                    <div class="product-image">
                        <img src="${product.main_image}" alt="${product.name}">
                        ${badgeHTML}
                    </div>
                    <div class="product-content">
                        <h3>${product.name}</h3>
                        <p class="product-description">${product.description}</p>
                        <div class="product-meta">
                            <span class="product-category"><i class="fas fa-tag"></i> ${product.category || 'General'}</span>
                            <span class="product-rating">
                                ${starsHTML}
                            </span>
                        </div>
                        <div class="product-price" style="margin-top: 10px; font-weight: bold; font-size: 1.1rem; color: var(--primary);">
                            &#8377; ${price}
                        </div>
                        <a href="#${product.section_id}" class="btn-ghost" style="margin-top: 15px; display: inline-block;">Learn More <i class="fas fa-arrow-right"></i></a>
                    </div>
                </div>
            `;
            gridContainer.insertAdjacentHTML('beforeend', cardHTML);
            
            // Render detail section
            const reverseClass = index % 2 === 1 ? 'reverse' : '';
            const featuresHTML = product.features.map(feat => `<li><i class="fas fa-check-circle"></i> ${feat}</li>`).join('');
            const useCasesHTML = product.use_cases.map(uc => `<li><i class="fas fa-lightbulb"></i> <strong>${uc.topic}:</strong> ${uc.detail}</li>`).join('');
            
            const primaryIcon = getPrimaryIcon(product.primary_action_label);
            const secondaryIcon = getSecondaryIcon(product.secondary_action_label);
            
            const primaryBtnHTML = product.primary_action_label ? `<a href="${product.primary_action_url}" class="btn-primary">${primaryIcon}${product.primary_action_label}</a>` : '';
            const secondaryBtnHTML = product.secondary_action_label ? `<a href="${product.secondary_action_url}" class="btn-secondary">${secondaryIcon}${product.secondary_action_label}</a>` : '';
            
            const galleryThumbnailsHTML = product.images.map((imgUrl, i) => `
                <div class="thumbnail-item ${i === 0 ? 'active' : ''}">
                    <img src="${imgUrl}" alt="Thumb ${i}" data-full="${imgUrl}">
                </div>
            `).join('');
            
            const detailHTML = `
                <section id="${product.section_id}" class="product-detail-section">
                    <div class="container">
                        <div class="product-detail-grid glass-panel animate-on-scroll visible ${reverseClass}" style="padding: 40px; opacity: 1; transform: none;">
                            <div class="product-detail-content">
                                <div class="product-header">
                                    <h2 class="section-title" style="text-align: left; margin-bottom: 10px;">${product.name}</h2>
                                    <p class="product-tagline text-gradient" style="font-weight: 600; margin-bottom: 20px;">${product.tagline || ''}</p>
                                </div>
                                <div class="product-features" id="features-${product.id}">
                                    <h3 style="color: var(--primary);"><i class="fas fa-list-check"></i> Key Features</h3>
                                    <ul class="feature-list">
                                        ${featuresHTML}
                                    </ul>
                                </div>
                                <div class="product-use-cases" id="usecases-${product.id}">
                                    <h3 style="color: var(--primary);"><i class="fas fa-lightbulb"></i> Use Cases</h3>
                                    <ul class="use-cases-list">
                                        ${useCasesHTML}
                                    </ul>
                                </div>
                                <div class="product-actions" id="actions-${product.id}" style="margin-top: 30px;">
                                    ${primaryBtnHTML}
                                    ${secondaryBtnHTML}
                                </div>
                            </div>
                            <div class="product-detail-gallery" id="gallery-${product.id}">
                                <div class="gallery-container">
                                    <div class="gallery-thumbnails-side">
                                        ${galleryThumbnailsHTML}
                                    </div>
                                    <div class="main-image glass-panel" style="padding: 10px; overflow: hidden;">
                                        <img src="${product.main_image}" alt="${product.name}" style="border-radius: var(--radius-md); width: 100%;">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            `;
            detailsContainer.insertAdjacentHTML('beforeend', detailHTML);
            
            // Append comparison table if product has_comparison is true
            if (parseInt(product.has_comparison) === 1 && comparisonTable) {
                const clonedTable = comparisonTable.cloneNode(true);
                // Make all animate-on-scroll elements inside the comparison table visible
                clonedTable.querySelectorAll('.animate-on-scroll').forEach(el => {
                    el.classList.add('visible');
                    el.style.opacity = '1';
                    el.style.transform = 'none';
                });
                clonedTable.classList.add('visible');
                clonedTable.style.opacity = '1';
                clonedTable.style.transform = 'none';
                detailsContainer.appendChild(clonedTable);
            }
        });
        
        // Re-initialize galleries
        initProductGalleries();
        
        // If there's an active hash in the URL, scroll to it
        if (window.location.hash) {
            const targetEl = document.querySelector(window.location.hash);
            if (targetEl) {
                setTimeout(() => {
                    targetEl.scrollIntoView({ behavior: 'smooth' });
                }, 300);
            }
        }
        
    } catch (error) {
        console.error('Error loading products:', error);
        gridContainer.innerHTML = `<div class="error-message" style="grid-column: 1/-1; text-align: center; color: #ff3333; padding: 50px;"><i class="fas fa-exclamation-triangle" style="font-size: 2rem;"></i><p style="margin-top: 15px;">Failed to load products. Please try again later.</p></div>`;
    }
};

// Safe load hook mapping both immediate readyState and DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProducts);
} else {
    loadProducts();
}
