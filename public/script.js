let tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

let productsData = [];
let currentSelectedItem = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cinematic Entry with GSAP
    gsap.from('.ios-header', { y: -50, opacity: 0, duration: 1, ease: 'power3.out' });
    gsap.from('.search-bar', { y: 20, opacity: 0, duration: 1, delay: 0.2, ease: 'power3.out' });

    // 2. Fetch products
    try {
        const response = await fetch('/api/products');
        productsData = await response.json();
        renderProducts(productsData);
    } catch (err) {
        console.error('Failed to load products', err);
    }

    // 3. Search functionality
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = productsData.filter(p => p.name.toLowerCase().includes(term));
        renderProducts(filtered);
    });
});

function renderProducts(items) {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';
    
    items.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'product-card glass-card';
        card.innerHTML = `
            <div class="img-container">
                <img src="${item.image}" alt="${item.name}" loading="lazy">
            </div>
            <h3>${item.name}</h3>
            <p class="price">${item.price}</p>
        `;
        card.onclick = () => openProductModal(item);
        grid.appendChild(card);
        
        // GSAP Stagger effect for items
        gsap.from(card, {
            y: 30,
            opacity: 0,
            duration: 0.6,
            delay: index * 0.1,
            ease: 'back.out(1.7)'
        });
    });
}

function openProductModal(item) {
    tg.HapticFeedback.impactOccurred('light');
    currentSelectedItem = item;
    
    document.getElementById('modalImage').src = item.image;
    document.getElementById('modalTitle').textContent = item.name;
    document.getElementById('modalPrice').textContent = item.price;
    
    document.getElementById('productModal').classList.add('active');
}

function closeModals() {
    tg.HapticFeedback.impactOccurred('light');
    document.getElementById('productModal').classList.remove('active');
    document.getElementById('checkoutModal').classList.remove('active');
}

// Checkout Flow
document.getElementById('openCheckoutBtn').addEventListener('click', () => {
    tg.HapticFeedback.impactOccurred('medium');
    document.getElementById('productModal').classList.remove('active');
    
    // Populate Checkout
    document.getElementById('checkoutImage').src = currentSelectedItem.image;
    document.getElementById('checkoutItemName').textContent = currentSelectedItem.name;
    document.getElementById('checkoutPrice').textContent = currentSelectedItem.price;
    
    document.getElementById('checkoutModal').classList.add('active');
});

document.getElementById('confirmOrderBtn').addEventListener('click', () => {
    tg.HapticFeedback.notificationOccurred('success');
    
    // Send Data to Bot to generate the receipt
    tg.sendData(JSON.stringify({ 
        action: 'buy', 
        item: currentSelectedItem.name,
        price: currentSelectedItem.price
    }));
    
    tg.close();
});

// Support Link Handler for Telegram
function openSupport(e) {
    e.preventDefault();
    tg.openTelegramLink('https://t.me/SCK_Official');
}
